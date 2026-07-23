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
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { LANG_TO_LOCALE_MAPPING, LanguageStore } from '@cleaners/i18n';
import { TimeSlot } from '@cleaners/models';
import { addDays, toDateKey } from '@cleaners/util';
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
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTabsModule,
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
  private readonly dateAdapter = inject<DateAdapter<Date>>(DateAdapter);
  private readonly languageStore = inject(LanguageStore);

  protected readonly store = inject(BookingStore);

  private readonly professionalId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('professionalId'))),
    { initialValue: null },
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    slot: this.formBuilder.control<TimeSlot | null>(null, Validators.required),
  });

  protected readonly bookingPending = computed(
    () => this.store.confirmedBooking() !== null,
  );

  protected readonly statusKey = computed(() => {
    const status = this.store.currentStatus();
    return status ? `bookingStatus.${status}` : null;
  });

  // Janela de disponibilidade consultada (deve ficar em sincronia com o intervalo usado por
  // BookingStore.load) — limita a navegação do mat-calendar da aba Calendário a dias que o backend
  // de fato consultou, evitando sugerir disponibilidade que nunca foi buscada.
  protected readonly minDate = new Date();
  protected readonly maxDate = addDays(new Date(), 14);

  // Dia selecionado na aba Calendário — estado puramente de interação de UI (não é dado de domínio),
  // mesmo padrão do selectedDate em IncomingBookingsComponent (professional-portal).
  protected readonly selectedDate = signal(new Date());
  private readonly dateManuallySelected = signal(false);

  protected readonly selectedDaySlots = computed(
    () => this.store.slotsByDayKey().get(toDateKey(this.selectedDate())) ?? [],
  );

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

    // Assim que os horários chegam, foca o calendário no primeiro dia com disponibilidade — só até o
    // usuário escolher um dia manualmente (dateManuallySelected), para não sobrescrever a escolha dele.
    effect(() => {
      const slots = this.store.slots();
      if (!this.dateManuallySelected() && slots.length > 0) {
        this.selectedDate.set(new Date(slots[0].startAt));
      }
    });

    // mat-calendar não segue LanguageStore sozinho (seu DateAdapter é lido uma vez na injeção) —
    // sincroniza nomes de mês/dia com o idioma ativo, mesma fonte usada por TranslocoDatePipe.
    effect(() => {
      this.dateAdapter.setLocale(
        LANG_TO_LOCALE_MAPPING[this.languageStore.current()],
      );
    });
  }

  protected selectSlot(slot: TimeSlot | null): void {
    this.form.controls.slot.setValue(slot);
  }

  protected onCalendarDaySelected(date: Date | null): void {
    if (date) {
      this.selectedDate.set(date);
      this.dateManuallySelected.set(true);
    }
  }

  // Referenciado no template como [dateClass] (campo, não método, para preservar `this` sem `.bind`).
  protected readonly calendarDayClass = (
    date: Date,
    view: 'month' | 'year' | 'multi-year',
  ): string => {
    if (view !== 'month') {
      return '';
    }
    const slots = this.store.slotsByDayKey().get(toDateKey(date));
    return slots && slots.length > 0 ? 'booking__calendar-day--available' : '';
  };

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const professionalId = this.professionalId();
    const { slot } = this.form.getRawValue();
    if (!professionalId || !slot) {
      return;
    }

    this.store.confirm(professionalId, slot);
  }

  protected goBack(): void {
    const id = this.professionalId();
    void this.router.navigate(id ? ['/professionals', id] : ['/professionals']);
  }
}
