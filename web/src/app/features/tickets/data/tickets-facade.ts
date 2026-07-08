import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TicketsApi } from './tickets-api';
import {
  DEFAULT_TICKET_LIST_FILTERS,
  FeedItemDto,
  TicketDto,
  TicketInput,
  TicketListFilters,
  TicketListItemDto,
  TicketStatus,
  ticketErrorMessage,
} from './ticket.model';

interface TicketsState {
  ticket: TicketDto | null;
  feed: FeedItemDto[];
  loading: boolean;
  pending: boolean;
  error: string | null;
}

const INITIAL_STATE: TicketsState = {
  ticket: null,
  feed: [],
  loading: false,
  pending: false,
  error: null,
};

// List screen state (S-06): separate from the card state — navigating
// card ↔ list must not wipe either. `filters` mirror the URL (design D8);
// `page` is the load-more depth and deliberately does not.
interface TicketListState {
  filters: TicketListFilters;
  items: TicketListItemDto[];
  total: number;
  page: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

const INITIAL_LIST_STATE: TicketListState = {
  filters: DEFAULT_TICKET_LIST_FILTERS,
  items: [],
  total: 0,
  page: 1,
  loading: false,
  loadingMore: false,
  error: null,
};

// One-ticket state (card + its feed) is enough for S-05; the list arrives
// in S-06 with its own needs. Same shape as HousesFacade (ADR-0009).
@Injectable({ providedIn: 'root' })
export class TicketsFacade {
  private readonly api = inject(TicketsApi);
  private readonly state = signal<TicketsState>(INITIAL_STATE);
  private readonly listState = signal<TicketListState>(INITIAL_LIST_STATE);
  // stale-response guard: rapid filter changes may resolve out of order —
  // only the latest list request may write the state
  private listRequestId = 0;

  // The selector run below is the ADR-0009 facade idiom (same shape in every
  // feature facade) — an intentional pattern, not copy-paste to extract.
  // fallow-ignore-next-line code-duplication
  readonly ticket = computed(() => this.state().ticket);
  readonly feed = computed(() => this.state().feed);
  readonly loading = computed(() => this.state().loading);
  readonly pending = computed(() => this.state().pending);
  readonly error = computed(() => this.state().error);

  // fallow-ignore-next-line code-duplication
  readonly listItems = computed(() => this.listState().items);
  readonly listTotal = computed(() => this.listState().total);
  readonly listLoading = computed(() => this.listState().loading);
  readonly listLoadingMore = computed(() => this.listState().loadingMore);
  readonly listError = computed(() => this.listState().error);
  readonly listHasMore = computed(() => {
    const { items, total } = this.listState();
    return items.length < total;
  });

  /** Fresh query (URL changed): replaces the shown items with page 1. */
  async loadList(filters: TicketListFilters): Promise<void> {
    const requestId = ++this.listRequestId;
    this.listState.update((s) => ({
      ...s,
      filters,
      page: 1,
      loading: true,
      error: null,
    }));
    try {
      const result = await firstValueFrom(this.api.list(filters, 1));
      if (requestId !== this.listRequestId) return;
      this.listState.update((s) => ({
        ...s,
        items: result.items,
        total: result.total,
        loading: false,
      }));
    } catch (err) {
      if (requestId !== this.listRequestId) return;
      this.listState.update((s) => ({
        ...s,
        items: [],
        total: 0,
        loading: false,
        error: ticketErrorMessage(err),
      }));
    }
  }

  /** «Показати ще»: appends the next page of the current query. */
  async loadMore(): Promise<void> {
    const { filters, page, loading, loadingMore } = this.listState();
    if (loading || loadingMore || !this.listHasMore()) return;
    const requestId = ++this.listRequestId;
    this.listState.update((s) => ({ ...s, loadingMore: true, error: null }));
    try {
      const result = await firstValueFrom(this.api.list(filters, page + 1));
      if (requestId !== this.listRequestId) return;
      this.listState.update((s) => ({
        ...s,
        items: [...s.items, ...result.items],
        total: result.total,
        page: page + 1,
        loadingMore: false,
      }));
    } catch (err) {
      if (requestId !== this.listRequestId) return;
      this.listState.update((s) => ({
        ...s,
        loadingMore: false,
        error: ticketErrorMessage(err),
      }));
    }
  }

  /** Create mode must start blank: the root-singleton facade otherwise
   *  keeps the last viewed/created ticket (S-04 review, high finding). */
  reset(): void {
    this.state.set(INITIAL_STATE);
  }

  // The card loads the ticket and its feed together: one loading flag, the
  // ticket read decides the error state (the feed 404s exactly when the
  // ticket does — same owner check).
  async load(id: number): Promise<void> {
    this.state.update((s) => ({
      ...s,
      ticket: null,
      feed: [],
      loading: true,
      error: null,
    }));
    try {
      const [ticket, feed] = await Promise.all([
        firstValueFrom(this.api.get(id)),
        firstValueFrom(this.api.getFeed(id)),
      ]);
      this.state.update((s) => ({ ...s, ticket, feed, loading: false }));
    } catch (err) {
      this.state.update((s) => ({
        ...s,
        loading: false,
        error: ticketErrorMessage(err),
      }));
    }
  }

  /** Resolves to true on success; on failure `error` carries the Ukrainian
   *  copy for the container's snackbar. The endpoint answers the fresh card
   *  payload; the feed is reloaded for the new STATUS event (design D5:
   *  reload-after-mutation, no optimistic state). */
  async transition(id: number, to: TicketStatus): Promise<boolean> {
    return this.mutateWithFeed(id, () =>
      firstValueFrom(this.api.transition(id, to)),
    );
  }

  /** Resolves to true when the note landed (the feed then shows it). */
  async addNote(id: number, text: string): Promise<boolean> {
    return this.mutateWithFeed(id, async () => {
      await firstValueFrom(this.api.addNote(id, text));
      return null;
    });
  }

  private async mutateWithFeed(
    id: number,
    action: () => Promise<TicketDto | null>,
  ): Promise<boolean> {
    this.state.update((s) => ({ ...s, pending: true, error: null }));
    try {
      const ticket = await action();
      // commit the mutation result before the feed reload: if that GET
      // fails, the card must not keep showing the stale status/actions
      // (S-05 review, medium)
      if (ticket) this.state.update((s) => ({ ...s, ticket }));
      const feed = await firstValueFrom(this.api.getFeed(id));
      this.state.update((s) => ({ ...s, feed, pending: false }));
      return true;
    } catch (err) {
      this.state.update((s) => ({
        ...s,
        pending: false,
        error: ticketErrorMessage(err),
      }));
      return false;
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
