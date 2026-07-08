import { Injectable } from '@nestjs/common';
import type { HouseModel } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import { HouseError } from './house-errors';

export const HOUSE_NAME_MAX = 255;
export const HOUSE_NOTE_MAX = 1000;

// Validation lives in the service, no class-validator (BC-PRIN-01, same as
// auth): name/address is one required text line (FR-HOUSE-01), note optional.
function normalizeName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) {
    throw new HouseError('HOUSE_NAME_INVALID', 'Name/address is required');
  }
  if (name.length > HOUSE_NAME_MAX) {
    throw new HouseError(
      'HOUSE_NAME_INVALID',
      `Name/address is longer than ${HOUSE_NAME_MAX} characters`,
    );
  }
  return name;
}

function normalizeNote(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new HouseError('HOUSE_NOTE_INVALID', 'Note must be text');
  }
  const note = value.trim();
  if (note.length > HOUSE_NOTE_MAX) {
    throw new HouseError(
      'HOUSE_NOTE_INVALID',
      `Note is longer than ${HOUSE_NOTE_MAX} characters`,
    );
  }
  return note || null;
}

// Route :id → BigInt; anything non-numeric is simply "not found" — the same
// 404 as a missing or foreign house (FR-ACCESS-01).
function parseHouseId(raw: string): bigint | null {
  if (!/^\d{1,18}$/.test(raw)) return null;
  return BigInt(raw);
}

const notFound = () =>
  new HouseError('HOUSE_NOT_FOUND', 'House does not exist');

export interface HouseInput {
  name?: unknown;
  note?: unknown;
}

@Injectable()
export class HousesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: bigint): Promise<HouseModel[]> {
    return this.prisma.house.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: bigint, input: HouseInput): Promise<HouseModel> {
    return this.prisma.house.create({
      data: {
        userId,
        name: normalizeName(input?.name),
        note: normalizeNote(input?.note),
      },
    });
  }

  // Owner check idiom (design D2, the precedent for S-04+): every id-scoped
  // query filters by `id AND user_id` in one statement — zero rows means 404,
  // identical for "missing" and "foreign" (FR-ACCESS-01, NFR-SEC-03).
  async get(userId: bigint, rawId: string): Promise<HouseModel> {
    const id = parseHouseId(rawId);
    const house = id
      ? await this.prisma.house.findFirst({ where: { id, userId } })
      : null;
    if (!house) throw notFound();
    return house;
  }

  async update(
    userId: bigint,
    rawId: string,
    input: HouseInput,
  ): Promise<HouseModel> {
    const id = parseHouseId(rawId);
    if (!id) throw notFound();
    const data: { name?: string; note?: string | null } = {};
    if (input && 'name' in input) data.name = normalizeName(input.name);
    if (input && 'note' in input) data.note = normalizeNote(input.note);
    // updateMany applies the owner filter atomically; count 0 → 404
    const { count } = await this.prisma.house.updateMany({
      where: { id, userId },
      data,
    });
    if (count === 0) throw notFound();
    return this.get(userId, rawId);
  }

  // FR-HOUSE-02: the "has tickets" refusal (HOUSE_HAS_TICKETS, 409) becomes
  // enforceable in S-04 when the ticket table adds its FK (design D3).
  async remove(userId: bigint, rawId: string): Promise<void> {
    const id = parseHouseId(rawId);
    if (!id) throw notFound();
    const { count } = await this.prisma.house.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw notFound();
  }
}
