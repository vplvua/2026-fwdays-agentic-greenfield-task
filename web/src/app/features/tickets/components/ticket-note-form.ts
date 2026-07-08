import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Presentational (ADR-0009): note input for the append-only feed
// (FR-FEED-01). Emits the trimmed text; the container owns the API call and
// calls clear() once the note actually landed — a failed submit keeps the
// typed text.
@Component({
  selector: 'app-ticket-note-form',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="form" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Новий запис</mat-label>
        <textarea
          matInput
          [formControl]="text"
          rows="2"
          maxlength="10000"
        ></textarea>
        @if (showEmptyHint) {
          <mat-error>Введіть текст запису</mat-error>
        }
      </mat-form-field>
      <button matButton="filled" type="submit" [disabled]="pending()">
        Додати запис
      </button>
    </form>
  `,
  styles: `
    .form {
      display: grid;
      gap: 0.25rem;
      justify-items: end;
    }

    .field {
      width: 100%;
    }
  `,
})
export class TicketNoteForm {
  readonly pending = input(false);
  readonly submitted = output<string>();

  protected readonly text = inject(NonNullableFormBuilder).control('');
  protected showEmptyHint = false;

  protected onSubmit(): void {
    // Validators.required does not trim — normalize before validating
    const value = this.text.value.trim();
    if (!value) {
      this.showEmptyHint = true;
      this.text.setErrors({ required: true });
      this.text.markAsTouched();
      return;
    }
    this.showEmptyHint = false;
    this.submitted.emit(value);
  }

  /** The container confirms the note landed; only then the field empties. */
  clear(): void {
    this.text.reset();
    this.text.setErrors(null);
    this.showEmptyHint = false;
  }
}
