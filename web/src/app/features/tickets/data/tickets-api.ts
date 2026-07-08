import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FeedItemDto,
  TicketDto,
  TicketInput,
  TicketStatus,
} from './ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketsApi {
  private readonly http = inject(HttpClient);

  create(input: TicketInput): Observable<TicketDto> {
    return this.http.post<TicketDto>('/api/tickets', input);
  }

  get(id: number): Observable<TicketDto> {
    return this.http.get<TicketDto>(`/api/tickets/${id}`);
  }

  update(id: number, input: TicketInput): Observable<TicketDto> {
    return this.http.patch<TicketDto>(`/api/tickets/${id}`, input);
  }

  // The only status-changing call (FR-STATUS-02); answers the fresh card
  // payload, so the SPA immediately knows the next allowed moves.
  transition(id: number, to: TicketStatus): Observable<TicketDto> {
    return this.http.post<TicketDto>(`/api/tickets/${id}/transition`, { to });
  }

  getFeed(id: number): Observable<FeedItemDto[]> {
    return this.http.get<FeedItemDto[]>(`/api/tickets/${id}/feed`);
  }

  addNote(id: number, text: string): Observable<FeedItemDto> {
    return this.http.post<FeedItemDto>(`/api/tickets/${id}/notes`, { text });
  }
}
