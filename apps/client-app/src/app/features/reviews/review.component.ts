import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BookingsService,
  ProfessionalsService,
  ReviewsService,
} from '@cleaners/data-access';
import { Professional } from '@cleaners/models';
import { FormFieldErrorComponent, StarRatingComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';
import { NotificationsService } from '../../core/notifications/notifications.service';

// Feature simples e isolada (um único formulário): estado local com signal() é suficiente, sem
// necessidade de um *.store.ts dedicado (skill angular-signals-state, "quando não criar um store").
// A validação de que o Booking pertence ao usuário e está concluído é sempre do backend
// (CLAUDE.md secao 1.1) — esta tela só reflete o que a API aceitar/recusar.
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormFieldErrorComponent,
    StarRatingComponent,
    TranslocoPipe,
  ],
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly bookingsService = inject(BookingsService);
  private readonly professionalsService = inject(ProfessionalsService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly notifications = inject(NotificationsService);

  private readonly bookingId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('bookingId'))),
    { initialValue: null },
  );

  protected readonly loading = signal(true);
  protected readonly loadErrorKey = signal<string | null>(null);
  protected readonly professional = signal<Professional | null>(null);

  protected readonly rating = signal<0 | 1 | 2 | 3 | 4 | 5>(0);
  protected readonly ratingTouched = signal(false);
  protected readonly ratingInvalid = computed(
    () => this.ratingTouched() && this.rating() === 0,
  );

  protected readonly submitting = signal(false);
  protected readonly submitErrorKey = signal<string | null>(null);

  protected readonly commentControl = this.formBuilder.nonNullable.control('', [
    Validators.required,
    Validators.maxLength(500),
  ]);

  constructor() {
    effect(() => {
      const id = this.bookingId();
      if (id) {
        this.loadBooking(id);
      }
    });
  }

  protected setRating(value: number): void {
    this.rating.set(value as 0 | 1 | 2 | 3 | 4 | 5);
    this.ratingTouched.set(true);
  }

  protected submit(): void {
    this.ratingTouched.set(true);
    this.commentControl.markAsTouched();

    if (this.rating() === 0 || this.commentControl.invalid) {
      return;
    }

    const bookingId = this.bookingId();
    const professionalId = this.professional()?.id;
    if (!bookingId || !professionalId) {
      return;
    }

    this.submitting.set(true);
    this.submitErrorKey.set(null);

    this.reviewsService
      .create({
        professionalId,
        bookingId,
        rating: this.rating() as 1 | 2 | 3 | 4 | 5,
        comment: this.commentControl.getRawValue(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notifications.success('reviews.successMessage');
          void this.router.navigateByUrl('/professionals');
        },
        error: () => {
          this.submitting.set(false);
          this.submitErrorKey.set('reviews.errorMessage');
        },
      });
  }

  private loadBooking(bookingId: string): void {
    this.loading.set(true);
    this.loadErrorKey.set(null);

    this.bookingsService.getById(bookingId).subscribe({
      next: (booking) => {
        this.professionalsService.getById(booking.professionalId).subscribe({
          next: (professional) => {
            this.professional.set(professional);
            this.loading.set(false);
          },
          error: () => {
            this.loadErrorKey.set('reviews.bookingNotFoundMessage');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.loadErrorKey.set('reviews.bookingNotFoundMessage');
        this.loading.set(false);
      },
    });
  }
}
