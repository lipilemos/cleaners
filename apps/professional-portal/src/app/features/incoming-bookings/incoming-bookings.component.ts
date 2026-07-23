import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { LANG_TO_LOCALE_MAPPING, LanguageStore } from '@cleaners/i18n';
import { Booking } from '@cleaners/models';
import { toDateKey } from '@cleaners/util';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { PortalToolbarComponent } from '../../core/shell/portal-toolbar/portal-toolbar.component';
import { IncomingBookingsStore } from './incoming-bookings.store';

// CSS aplicado à célula do mat-calendar (aba Calendário) quando o dia tem ao menos um Booking.
// Prioridade de destaque quando o dia tem Bookings em mais de um status: o que exige mais atenção do
// profissional aparece primeiro.
const CALENDAR_DAY_STATUS_PRIORITY: readonly Booking['status'][] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];

const CALENDAR_DAY_CLASS_BY_STATUS: Record<Booking['status'], string> = {
  pending: 'incoming-bookings__calendar-day--pending',
  confirmed: 'incoming-bookings__calendar-day--confirmed',
  completed: 'incoming-bookings__calendar-day--completed',
  cancelled: 'incoming-bookings__calendar-day--cancelled',
};

// Container da feature `incoming-bookings` (T28/T29/T32, ver skill google-calendar-mcp-scheduling):
// lista os pedidos recebidos pelo profissional logado, aceita/recusa e reflete atualizações em tempo
// real via SignalR (delegado ao store). O telefone do cliente (T29, CLAUDE.md secao 5.4) só é
// renderizado quando `booking.customerContact` vem preenchido pelo backend, isto é, nunca antes da
// confirmação — este componente não decide isso, apenas reflete o que a API devolve.
@Component({
  selector: 'app-incoming-bookings',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    PortalToolbarComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  templateUrl: './incoming-bookings.component.html',
  styleUrl: './incoming-bookings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomingBookingsComponent {
  protected readonly store = inject(IncomingBookingsStore);

  private readonly dateAdapter = inject<DateAdapter<Date>>(DateAdapter);
  private readonly languageStore = inject(LanguageStore);

  // Dia selecionado na aba Calendário — estado puramente de interação de UI (não é dado de domínio),
  // por isso vive no componente e não no store (mesmo padrão do rulesForm em AvailabilityComponent).
  protected readonly selectedDate = signal(new Date());

  protected readonly selectedDayBookings = computed(() =>
    (this.store.bookingsByDayKey().get(toDateKey(this.selectedDate())) ?? [])
      .slice()
      .sort((a, b) => a.startAt.localeCompare(b.startAt)),
  );

  constructor() {
    this.store.load();

    // mat-calendar não segue LanguageStore sozinho (seu DateAdapter é lido uma vez na injeção) —
    // sincroniza nomes de mês/dia com o idioma ativo, mesma fonte usada por TranslocoDatePipe.
    effect(() => {
      this.dateAdapter.setLocale(
        LANG_TO_LOCALE_MAPPING[this.languageStore.current()],
      );
    });
  }

  protected accept(booking: Booking): void {
    this.store.accept(booking.id);
  }

  protected reject(booking: Booking): void {
    this.store.reject(booking.id);
  }

  // Nunca loga o telefone (CLAUDE.md secao 5.4) — só monta o href `tel:`, tratado pelo próprio
  // navegador/dispositivo, sem passar pela URL da aplicação nem por analytics.
  protected telHref(phone: string): string {
    return `tel:${phone.replace(/\D/g, '')}`;
  }

  protected statusKey(status: Booking['status']): string {
    return `bookingStatus.${status}`;
  }

  protected onCalendarDaySelected(date: Date | null): void {
    if (date) {
      this.selectedDate.set(date);
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

    const bookings = this.store.bookingsByDayKey().get(toDateKey(date));
    if (!bookings || bookings.length === 0) {
      return '';
    }

    const statuses = new Set(bookings.map((booking) => booking.status));
    const highlighted = CALENDAR_DAY_STATUS_PRIORITY.find((status) =>
      statuses.has(status),
    );
    return highlighted
      ? `incoming-bookings__calendar-day ${CALENDAR_DAY_CLASS_BY_STATUS[highlighted]}`
      : '';
  };
}
