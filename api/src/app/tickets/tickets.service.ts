import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { TicketCategory, TicketPriority } from '../../generated/prisma/enums';
import type { HouseModel, TicketModel } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import { TicketError } from './ticket-errors';

export const TICKET_TITLE_MAX = 255;
export const TICKET_DESCRIPTION_MAX = 10_000;
export const TICKET_REQUESTER_NAME_MAX = 255;
export const TICKET_REQUESTER_PHONE_MAX = 32;
export const TICKET_EXECUTOR_MAX = 255;

// The card payload joins the house name in (design D2) — no client stitching.
export type TicketWithHouse = TicketModel & { house: HouseModel };

// Validation lives in the service, no class-validator (BC-PRIN-01, same as
// houses). Field rules per FR-TICKET-01 and design D2.
function normalizeTitle(value: unknown): string {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title) {
    throw new TicketError('TICKET_TITLE_INVALID', 'Title is required');
  }
  if (title.length > TICKET_TITLE_MAX) {
    throw new TicketError(
      'TICKET_TITLE_INVALID',
      `Title is longer than ${TICKET_TITLE_MAX} characters`,
    );
  }
  return title;
}

function optionalText(
  max: number,
  code:
    | 'TICKET_DESCRIPTION_INVALID'
    | 'TICKET_REQUESTER_INVALID'
    | 'TICKET_EXECUTOR_INVALID',
  label: string,
): (value: unknown) => string | null {
  return (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') {
      throw new TicketError(code, `${label} must be text`);
    }
    const text = value.trim();
    if (text.length > max) {
      throw new TicketError(code, `${label} is longer than ${max} characters`);
    }
    return text || null;
  };
}

function normalizeCategory(value: unknown): TicketCategory {
  if (
    typeof value === 'string' &&
    Object.values(TicketCategory).includes(value as TicketCategory)
  ) {
    return value as TicketCategory;
  }
  throw new TicketError('TICKET_CATEGORY_INVALID', 'Category is required');
}

function normalizePriority(value: unknown): TicketPriority {
  if (
    typeof value === 'string' &&
    Object.values(TicketPriority).includes(value as TicketPriority)
  ) {
    return value as TicketPriority;
  }
  throw new TicketError('TICKET_PRIORITY_INVALID', 'Unknown priority');
}

// Due date travels as a plain YYYY-MM-DD calendar date (design D5): validate
// the shape, then require the parsed date to round-trip — V8 silently rolls
// impossible dates over (Feb 31 → Mar 3), which must be a 400, not a mutation.
function normalizeDueDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value);
    if (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    ) {
      return date;
    }
  }
  throw new TicketError(
    'TICKET_DUE_DATE_INVALID',
    'Due date must be a valid YYYY-MM-DD date',
  );
}

// houseId arrives in the JSON body as a number; a missing or malformed value
// is a 400 shape error, while a well-formed id that isn't the owner's house
// answers 404 (TICKET_HOUSE_NOT_FOUND) — same parity rule as FR-ACCESS-01.
function parseBodyHouseId(value: unknown): bigint {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return BigInt(value);
  }
  throw new TicketError('TICKET_HOUSE_INVALID', 'House is required');
}

// Route :id → BigInt; anything non-numeric is simply "not found" — the same
// 404 as a missing or foreign ticket (FR-ACCESS-01).
function parseTicketId(raw: string): bigint | null {
  if (!/^\d{1,18}$/.test(raw)) return null;
  return BigInt(raw);
}

const notFound = () =>
  new TicketError('TICKET_NOT_FOUND', 'Ticket does not exist');

const houseNotFound = () =>
  new TicketError('TICKET_HOUSE_NOT_FOUND', 'House does not exist');

function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}

export interface TicketInput {
  title?: unknown;
  description?: unknown;
  houseId?: unknown;
  category?: unknown;
  priority?: unknown;
  requesterName?: unknown;
  requesterPhone?: unknown;
  executor?: unknown;
  dueDate?: unknown;
  // status is deliberately absent: creation is always NEW and PATCH ignores
  // it — transitions get their own endpoint in S-05 (spec requirement).
}

// One normalizer per writable FR-TICKET-01 field (houseId aside — it needs
// the async owner check). create() runs all of them; update() only those
// whose field is present in the body, so PATCH leaves the rest untouched.
const FIELD_NORMALIZERS = {
  title: normalizeTitle,
  description: optionalText(
    TICKET_DESCRIPTION_MAX,
    'TICKET_DESCRIPTION_INVALID',
    'Description',
  ),
  category: normalizeCategory,
  priority: normalizePriority,
  requesterName: optionalText(
    TICKET_REQUESTER_NAME_MAX,
    'TICKET_REQUESTER_INVALID',
    'Requester name',
  ),
  requesterPhone: optionalText(
    TICKET_REQUESTER_PHONE_MAX,
    'TICKET_REQUESTER_INVALID',
    'Requester phone',
  ),
  executor: optionalText(
    TICKET_EXECUTOR_MAX,
    'TICKET_EXECUTOR_INVALID',
    'Executor',
  ),
  dueDate: normalizeDueDate,
} as const;

type TicketField = keyof typeof FIELD_NORMALIZERS;
type TicketData = Prisma.TicketUpdateManyMutationInput & { houseId?: bigint };

function normalizeFields(body: TicketInput, fields: TicketField[]): TicketData {
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    data[field] = FIELD_NORMALIZERS[field](body[field]);
  }
  return data as TicketData;
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  // Owner check for the referenced house uses the same one-query idiom as
  // the ticket itself (`id AND user_id`): zero rows → 404 with an identical
  // body for "missing" and "foreign" (FR-ACCESS-01, NFR-SEC-03).
  private async resolveOwnHouseId(
    userId: bigint,
    value: unknown,
  ): Promise<bigint> {
    const houseId = parseBodyHouseId(value);
    const house = await this.prisma.house.findFirst({
      where: { id: houseId, userId },
      select: { id: true },
    });
    if (!house) throw houseNotFound();
    return houseId;
  }

  async create(userId: bigint, input: TicketInput): Promise<TicketWithHouse> {
    const body = input ?? {};
    const houseId = await this.resolveOwnHouseId(userId, body.houseId);
    // every field goes through its normalizer; priority is left to the
    // schema default (NORMAL, PRD §5.3) when absent
    const fields: TicketField[] = [
      'title',
      'category',
      'description',
      'requesterName',
      'requesterPhone',
      'executor',
      'dueDate',
    ];
    if (body.priority !== undefined) fields.push('priority');
    const data = {
      userId,
      houseId,
      ...normalizeFields(body, fields),
    } as Prisma.TicketUncheckedCreateInput;
    try {
      return await this.prisma.ticket.create({
        data,
        include: { house: true },
      });
    } catch (error) {
      // FK backstop: the house vanished between the owner check and the
      // insert — same 404 as a missing house, no 500
      if (isForeignKeyError(error)) throw houseNotFound();
      throw error;
    }
  }

  async get(userId: bigint, rawId: string): Promise<TicketWithHouse> {
    const id = parseTicketId(rawId);
    const ticket = id
      ? await this.prisma.ticket.findFirst({
          where: { id, userId },
          include: { house: true },
        })
      : null;
    if (!ticket) throw notFound();
    return ticket;
  }

  // PATCH updates only the fields present in the body; `dueDate: null`
  // clears the date (FR-DUE-01); status is not read from the body.
  async update(
    userId: bigint,
    rawId: string,
    input: TicketInput,
  ): Promise<TicketWithHouse> {
    const id = parseTicketId(rawId);
    if (!id) throw notFound();
    const body = input ?? {};
    // only fields present in the body are normalized and written; status is
    // not in FIELD_NORMALIZERS, so a supplied status never reaches the DB
    const present = (Object.keys(FIELD_NORMALIZERS) as TicketField[]).filter(
      (field) => field in body,
    );
    const data: TicketData = normalizeFields(body, present);
    if ('houseId' in body) {
      data.houseId = await this.resolveOwnHouseId(userId, body.houseId);
    }
    // an effectively empty patch (e.g. only an ignored status) is a no-op:
    // updateMany with empty data reports count 0 and would 404 the owner
    if (Object.keys(data).length === 0) return this.get(userId, rawId);
    try {
      // updateMany applies the owner filter atomically; count 0 → 404
      const { count } = await this.prisma.ticket.updateMany({
        where: { id, userId },
        data,
      });
      if (count === 0) throw notFound();
    } catch (error) {
      if (isForeignKeyError(error)) throw houseNotFound();
      throw error;
    }
    return this.get(userId, rawId);
  }
}
