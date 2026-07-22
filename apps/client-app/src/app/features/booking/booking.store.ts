import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  BookingStatusHubService,
  CalendarMcpService,
  ProfessionalsService,
} from '@cleaners/data-access';
import {
  Booking,
  BookingStatus,
  Professional,
  TimeSlot,
} from '@cleaners/models';
import { addDays } from '@cleaners/util';
import { Subscription, forkJoin } from 'rxjs';

// Estado da feature de agendamento (client-app), ver skill google-calendar-mcp-scheduling. Cuida do
// ciclo de vida da conexão SignalR de status (T26) escopado a esta rota — se cair, a UI segue confiando
// na resposta HTTP de createBooking como fonte de verdade, sem travar.
@Injectable()
export class BookingStore implements OnDestroy {
  private readonly calendarMcpService = inject(CalendarMcpService);
  private readonly professionalsService = inject(ProfessionalsService);
  private readonly bookingStatusHub = inject(BookingStatusHubService);

  private readonly _professional = signal<Professional | null>(null);
  private readonly _slots = signal<TimeSlot[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _submitting = signal(false);
  private readonly _confirmedBooking = signal<Booking | null>(null);
  private readonly _liveStatus = signal<BookingStatus | null>(null);

  private hubSubscription: Subscription | null = null;

  readonly professional = this._professional.asReadonly();
  readonly slots = this._slots.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly confirmedBooking = this._confirmedBooking.asReadonly();

  readonly services = computed(() => this._professional()?.services ?? []);
  readonly hasSlots = computed(() => this._slots().length > 0);
  // Status exibido: prioriza a atualização em tempo real via SignalR; cai para o valor da última
  // resposta HTTP enquanto o evento não chega (fallback descrito na skill de agendamento).
  readonly currentStatus = computed(
    () => this._liveStatus() ?? this._confirmedBooking()?.status ?? null,
  );

  load(professionalId: string): void {
    this._loading.set(true);
    this._error.set(null);

    const from = new Date();
    const to = addDays(from, 14);

    forkJoin({
      professional: this.professionalsService.getById(professionalId),
      slots: this.calendarMcpService.getAvailability(
        professionalId,
        from.toISOString(),
        to.toISOString(),
      ),
    }).subscribe({
      next: ({ professional, slots }) => {
        this._professional.set(professional);
        this._slots.set(slots);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('booking.loadError');
        this._loading.set(false);
      },
    });
  }

  confirm(professionalId: string, serviceId: string, slot: TimeSlot): void {
    this._submitting.set(true);
    this._error.set(null);

    this.calendarMcpService
      .createBooking({
        professionalId,
        serviceId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        // Permite retry seguro sem duplicar o booking em caso de falha de rede (CLAUDE.md/skill agendamento).
        requestId: crypto.randomUUID(),
      })
      .subscribe({
        next: (booking) => {
          this._confirmedBooking.set(booking);
          this._submitting.set(false);
          this.listenForStatusUpdates();
        },
        error: () => {
          this._submitting.set(false);
          this._error.set('booking.createError');
          // Conflito de horário entre a consulta e a confirmação: recarrega só a disponibilidade em
          // segundo plano (skill agendamento) — não usa load() para não apagar a mensagem de erro
          // recém-definida (load() reseta o erro no início de toda chamada).
          this.reloadAvailabilityAfterConflict(professionalId);
        },
      });
  }

  private reloadAvailabilityAfterConflict(professionalId: string): void {
    const from = new Date();
    const to = addDays(from, 14);

    this.calendarMcpService
      .getAvailability(professionalId, from.toISOString(), to.toISOString())
      .subscribe({
        next: (slots) => this._slots.set(slots),
        // Silencioso: a mensagem de erro da criação já orienta o usuário a tentar novamente.
        error: () => undefined,
      });
  }

  private listenForStatusUpdates(): void {
    this.bookingStatusHub.connect();
    this.hubSubscription = this.bookingStatusHub.events.subscribe((event) => {
      if (event.bookingId === this._confirmedBooking()?.id) {
        this._liveStatus.set(event.status);
      }
    });
  }

  ngOnDestroy(): void {
    this.hubSubscription?.unsubscribe();
    this.bookingStatusHub.disconnect();
  }
}
