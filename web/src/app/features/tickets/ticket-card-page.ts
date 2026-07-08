import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketCard } from './components/ticket-card';
import { TicketsFacade } from './data/tickets-facade';

// Container: loads one ticket by the route id and shows its card; the edit
// action lives in the toolbar. Foreign/missing ids surface the facade's
// 404 message (FR-ACCESS-01).
// Container template = loading/content/error state machine; the branching
// is the page's whole job (ADR-0009), splitting further adds indirection.
// fallow-ignore-next-line complexity
@Component({
  selector: 'app-ticket-card-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    RouterLink,
    TicketCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="toolbar">
      <a matIconButton routerLink="/" aria-label="На головну">
        <mat-icon>arrow_back</mat-icon>
      </a>
      <span class="title">Заявка</span>
      @if (facade.ticket(); as ticket) {
        <a
          matIconButton
          [routerLink]="['/tickets', ticket.id, 'edit']"
          aria-label="Редагувати заявку"
        >
          <mat-icon>edit</mat-icon>
        </a>
      }
    </mat-toolbar>
    <main class="content">
      @if (facade.loading()) {
        <mat-spinner class="spinner" [diameter]="32" />
      } @else if (facade.ticket(); as ticket) {
        <app-ticket-card [ticket]="ticket" />
      } @else if (facade.error(); as error) {
        <section class="empty">
          <p role="alert">{{ error }}</p>
          <button matButton="filled" type="button" (click)="onReload()">
            Спробувати ще раз
          </button>
        </section>
      }
    </main>
  `,
  styles: `
    .toolbar {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      gap: 0.5rem;
    }

    .title {
      flex: 1;
    }

    .content {
      max-width: 40rem;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }

    .spinner {
      justify-self: center;
      margin-top: 2rem;
    }

    .empty {
      text-align: center;
      margin-top: 2rem;
      display: grid;
      gap: 1rem;
      justify-items: center;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class TicketCardPage implements OnInit {
  protected readonly facade = inject(TicketsFacade);
  private readonly route = inject(ActivatedRoute);

  private readonly ticketId = computed(() =>
    Number(this.route.snapshot.paramMap.get('id')),
  );

  ngOnInit(): void {
    void this.facade.load(this.ticketId());
  }

  protected onReload(): void {
    void this.facade.load(this.ticketId());
  }
}
