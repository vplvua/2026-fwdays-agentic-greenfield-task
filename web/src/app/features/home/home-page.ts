import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { ProfileCard } from '../auth/components/profile-card';
import { AuthFacade } from '../auth/data/auth-facade';
import { HealthStatus } from './components/health-status';
import { HealthFacade } from './data/health-facade';

@Component({
  selector: 'app-home-page',
  imports: [MatCardModule, MatToolbarModule, HealthStatus, ProfileCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="toolbar">Сервіс-деск Mini</mat-toolbar>
    <main class="content">
      @if (auth.user(); as user) {
        <app-profile-card
          [user]="user"
          [pending]="auth.pending()"
          (nameSaved)="onNameSaved($event)"
          (loggedOut)="onLogout()"
        />
      }
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Вітаємо!</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            Мінімальний сервіс-деск для мешканців будинку: заявки, будинки,
            фото. Це «ходячий скелет» застосунку — функціонал зʼявиться в
            наступних зрізах.
          </p>
          <app-health-status
            [health]="facade.health()"
            [loading]="facade.loading()"
          />
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: `
    .toolbar {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .content {
      max-width: 40rem;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }
  `,
})
export class HomePage implements OnInit {
  protected readonly facade = inject(HealthFacade);
  protected readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.facade.load();
  }

  protected onNameSaved(name: string | null): void {
    void this.auth.updateName(name);
  }

  protected async onLogout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
