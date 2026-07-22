import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeSlot } from '@cleaners/models';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { map } from 'rxjs';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { BookingStore } from './booking.store';

// Container de agendamento (client-app), ver skill google-calendar-mcp-scheduling: consulta
// disponibilidade real via CalendarMcpService (delegado ao BookingStore) e cria o Booking. Nunca
// assume sucesso sem a resposta da API, nunca infere disponibilidade localmente.
@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    TranslocoDatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    TranslocoPipe,
  ],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  protected readonly store = inject(BookingStore);

  private readonly professionalId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('professionalId'))),
    { initialValue: null },
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    serviceId: ['', Validators.required],
    slot: this.formBuilder.control<TimeSlot | null>(null, Validators.required),
  });

  protected readonly bookingPending = computed(
    () => this.store.confirmedBooking() !== null,
  );

  protected readonly statusKey = computed(() => {
    const status = this.store.currentStatus();
    return status ? `bookingStatus.${status}` : null;
  });

  constructor() {
    effect(() => {
      const id = this.professionalId();
      if (id) {
        this.store.load(id);
      }
    });

    effect(() => {
      const status = this.store.currentStatus();
      if (status === 'confirmed') {
        this.notifications.success('booking.successMessage');
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const professionalId = this.professionalId();
    const { serviceId, slot } = this.form.getRawValue();
    if (!professionalId || !slot) {
      return;
    }

    this.store.confirm(professionalId, serviceId, slot);
  }

  protected goBack(): void {
    const id = this.professionalId();
    void this.router.navigate(id ? ['/professionals', id] : ['/professionals']);
  }
}
