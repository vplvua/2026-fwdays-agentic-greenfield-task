import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketDto, TicketInput } from './ticket.model';

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
}
