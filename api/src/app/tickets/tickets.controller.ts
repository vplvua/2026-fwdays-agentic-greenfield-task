import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../generated/prisma/enums';
import type { AuthenticatedRequest } from '../auth/session.guard';
import {
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
  requesterName: string | null;
  requesterPhone: string | null;
  executor: string | null;
  dueDate: string | null; // YYYY-MM-DD (design D5)
  createdAt: string;
  updatedAt: string;
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
    requesterName: ticket.requesterName,
    requesterPhone: ticket.requesterPhone,
    executor: ticket.executor,
    dueDate: ticket.dueDate ? ticket.dueDate.toISOString().slice(0, 10) : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

// No @Public() anywhere: the global SessionGuard applies, and every service
// call is scoped to req.user.id (FR-ACCESS-01, NFR-SEC-03). No DELETE and no
// list route by design: tickets are never deleted (FR-TICKET-04), the list
// arrives in S-06.
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
}
