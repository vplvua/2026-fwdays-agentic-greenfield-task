import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HealthApi } from './health-api';
import { HealthDto } from './health.model';

interface HealthState {
  health: HealthDto | null;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class HealthFacade {
  private readonly api = inject(HealthApi);
  private readonly state = signal<HealthState>({
    health: null,
    loading: false,
  });

  readonly health = computed(() => this.state().health);
  readonly loading = computed(() => this.state().loading);

  async load(): Promise<void> {
    this.state.update((s) => ({ ...s, loading: true }));
    try {
      const health = await firstValueFrom(this.api.check());
      this.state.set({ health, loading: false });
    } catch (err) {
      // The API reports DB loss as 503 with the same JSON shape; anything
      // else (network down, API dead) collapses to the generic error state
      const health =
        err instanceof HttpErrorResponse && isHealthDto(err.error)
          ? err.error
          : { status: 'error', db: 'down' };
      this.state.set({ health, loading: false });
    }
  }
}

function isHealthDto(value: unknown): value is HealthDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as HealthDto).status === 'string' &&
    typeof (value as HealthDto).db === 'string'
  );
}
