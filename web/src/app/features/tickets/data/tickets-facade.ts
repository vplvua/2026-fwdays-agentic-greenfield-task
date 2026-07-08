import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TicketsApi } from './tickets-api';
import { TicketDto, TicketInput, ticketErrorMessage } from './ticket.model';

interface TicketsState {
  ticket: TicketDto | null;
  loading: boolean;
  pending: boolean;
  error: string | null;
}

const INITIAL_STATE: TicketsState = {
  ticket: null,
  loading: false,
  pending: false,
  error: null,
};

// One-ticket state is enough for S-04 (form + card); the list arrives in
// S-06 with its own needs. Same shape as HousesFacade (ADR-0009).
@Injectable({ providedIn: 'root' })
export class TicketsFacade {
  private readonly api = inject(TicketsApi);
  private readonly state = signal<TicketsState>(INITIAL_STATE);

  // The selector run below is the ADR-0009 facade idiom (same shape in every
  // feature facade) — an intentional pattern, not copy-paste to extract.
  // fallow-ignore-next-line code-duplication
  readonly ticket = computed(() => this.state().ticket);
  readonly loading = computed(() => this.state().loading);
  readonly pending = computed(() => this.state().pending);
  readonly error = computed(() => this.state().error);

  async load(id: number): Promise<void> {
    this.state.update((s) => ({
      ...s,
      ticket: null,
      loading: true,
      error: null,
    }));
    try {
      const ticket = await firstValueFrom(this.api.get(id));
      this.state.update((s) => ({ ...s, ticket, loading: false }));
    } catch (err) {
      this.state.update((s) => ({
        ...s,
        loading: false,
        error: ticketErrorMessage(err),
      }));
    }
  }

  /** Resolves to the saved ticket, or null with `error` in Ukrainian. */
  create(input: TicketInput): Promise<TicketDto | null> {
    return this.mutate(() => firstValueFrom(this.api.create(input)));
  }

  update(id: number, input: TicketInput): Promise<TicketDto | null> {
    return this.mutate(() => firstValueFrom(this.api.update(id, input)));
  }

  // The fresh row from the mutation becomes the state — the card the user
  // lands on shows it without an extra reload.
  private async mutate(
    action: () => Promise<TicketDto>,
  ): Promise<TicketDto | null> {
    this.state.update((s) => ({ ...s, pending: true, error: null }));
    try {
      const ticket = await action();
      this.state.update((s) => ({ ...s, ticket, pending: false }));
      return ticket;
    } catch (err) {
      this.state.update((s) => ({
        ...s,
        pending: false,
        error: ticketErrorMessage(err),
      }));
      return null;
    }
  }
}
