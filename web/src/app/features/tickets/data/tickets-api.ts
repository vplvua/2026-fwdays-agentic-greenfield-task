import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FeedItemDto,
  TicketDto,
  TicketInput,
  TicketListFilters,
  TicketListPageDto,
  TicketStatus,
} from './ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketsApi {
  private readonly http = inject(HttpClient);

  // Unset filters stay out of the query string — the URL mirrors what the
  // user actually narrowed down (design D8)
  list(
    filters: TicketListFilters,
    page: number,
  ): Observable<TicketListPageDto> {
    let params = new HttpParams()
      .set('sort', filters.sort)
      .set('order', filters.order)
      .set('page', page);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.houseId) params = params.set('houseId', filters.houseId);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.q) params = params.set('q', filters.q);
    return this.http.get<TicketListPageDto>('/api/tickets', { params });
  }

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
