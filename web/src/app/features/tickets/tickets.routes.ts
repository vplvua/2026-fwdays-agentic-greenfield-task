import { Route } from '@angular/router';
import { TicketCardPage } from './ticket-card-page';
import { TicketFormPage } from './ticket-form-page';

export const ticketsRoutes: Route[] = [
  { path: 'new', component: TicketFormPage },
  { path: ':id/edit', component: TicketFormPage },
  { path: ':id', component: TicketCardPage },
];
