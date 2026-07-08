import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type {
  TicketCategory,
  TicketEventField,
  TicketFeedItemType,
  TicketPriority,
  TicketStatus,
} from '../../generated/prisma/enums';
import type { AuthenticatedRequest } from '../auth/session.guard';
import {
  ALLOWED_TRANSITIONS,
  FeedItemWithAuthor,
  TicketInput,
  TicketsService,
  TicketWithHouse,
} from './tickets.service';

export interface TicketDto {
  id: number; // doubles as the human-visible number #N (FR-TICKET-02)
  houseId: number;
  houseName: string;
  title: string;
  description: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  // computed server-side from the §5.1 table (FR-STATUS-02): the SPA renders
  // transition buttons from this list and owns no transition rules
  allowedTransitions: TicketStatus[];
  requesterName: string | null;
  requesterPhone: string | null;
  executor: string | null;
  dueDate: string | null; // YYYY-MM-DD (design D5)
  createdAt: string;
  updatedAt: string;
}

// One feed item (PRD §5.5): a NOTE carries `text`, an EVENT carries
// `field/oldValue/newValue` as locale-free snapshots the SPA renders in
// Ukrainian. Every item has its author and date-time (FR-FEED-01).
export interface FeedItemDto {
  id: number;
  type: TicketFeedItemType;
  authorId: number;
  authorName: string | null;
  text: string | null;
  field: TicketEventField | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// BigInt ids don't survive JSON.stringify — expose them as numbers
function toTicketDto(ticket: TicketWithHouse): TicketDto {
  return {
    id: Number(ticket.id),
    houseId: Number(ticket.houseId),
    houseName: ticket.house.name,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    allowedTransitions: [...ALLOWED_TRANSITIONS[ticket.status]],
    requesterName: ticket.requesterName,
    requesterPhone: ticket.requesterPhone,
    executor: ticket.executor,
    dueDate: ticket.dueDate ? ticket.dueDate.toISOString().slice(0, 10) : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function toFeedItemDto(item: FeedItemWithAuthor): FeedItemDto {
  return {
    id: Number(item.id),
    type: item.type,
    authorId: Number(item.authorId),
    authorName: item.author.name ?? item.author.phone,
    text: item.text,
    field: item.field,
    oldValue: item.oldValue,
    newValue: item.newValue,
    createdAt: item.createdAt.toISOString(),
  };
}

// No @Public() anywhere: the global SessionGuard applies, and every service
// call is scoped to req.user.id (FR-ACCESS-01, NFR-SEC-03). No DELETE and no
// list route by design: tickets are never deleted (FR-TICKET-04), the list
// arrives in S-06. Feed items expose no update/delete routes either —
// append-only (FR-FEED-01).
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: TicketInput,
  ): Promise<TicketDto> {
    return toTicketDto(await this.tickets.create(req.user.id, body));
  }

  @Get(':id')
  async get(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TicketDto> {
    return toTicketDto(await this.tickets.get(req.user.id, id));
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: TicketInput,
  ): Promise<TicketDto> {
    return toTicketDto(await this.tickets.update(req.user.id, id, body));
  }

  // The only way a status changes (FR-STATUS-02); returns the updated card
  // payload so the SPA immediately knows the next allowed moves.
  @Post(':id/transition')
  async transition(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { to?: unknown },
  ): Promise<TicketDto> {
    return toTicketDto(await this.tickets.transition(req.user.id, id, body));
  }

  @Get(':id/feed')
  async getFeed(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<FeedItemDto[]> {
    const items = await this.tickets.getFeed(req.user.id, id);
    return items.map(toFeedItemDto);
  }

  @Post(':id/notes')
  async addNote(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { text?: unknown },
  ): Promise<FeedItemDto> {
    return toFeedItemDto(await this.tickets.addNote(req.user.id, id, body));
  }
}
