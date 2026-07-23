import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  BookingStatusHubService,
  BookingsService,
  CalendarMcpService,
} from '@cleaners/data-access';
import { Booking } from '@cleaners/models';
import { toDateKey } from '@cleaners/util';
import { Subscription } from 'rxjs';

// Estado da feature `incoming-bookings` (T28), injetado no escopo da rota. Reaproveita o mesmo
// BookingStatusHubService da Fase 4 (T32, skill google-calendar-mcp-scheduling) para refletir novos
// pedidos e mudanças de status sem recarregar a página inteira. Aceitar/recusar usam os mesmos
// métodos de domínio do CalendarMcpService usados pelo client-app (confirmBooking/cancelBooking) —
// nunca decide localmente se a ação é permitida, só reflete a resposta do backend.
@Injectable()
export class IncomingBookingsStore implements OnDestroy {
  private readonly bookingsService = inject(BookingsService);
  private readonly calendarMcpService = inject(CalendarMcpService);
  private readonly bookingStatusHub = inject(BookingStatusHubService);

  private readonly _bookings = signal<Booking[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _processingIds = signal<ReadonlySet<string>>(new Set());
  private readonly _actionErrorKey = signal<string | null>(null);

  private hubSubscription: Subscription | null = null;

  readonly bookings = this._bookings.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly actionErrorKey = this._actionErrorKey.asReadonly();

  readonly pendingBookings = computed(() =>
    this._bookings()
      .filter((booking) => booking.status === 'pending')
      .sort((a, b) => a.startAt.localeCompare(b.startAt)),
  );

  readonly confirmedBookings = computed(() =>
    this._bookings()
      .filter((booking) => booking.status === 'confirmed')
      .sort((a, b) => a.startAt.localeCompare(b.startAt)),
  );

  readonly historyBookings = computed(() =>
    this._bookings()
      .filter(
        (booking) =>
          booking.status === 'completed' || booking.status === 'cancelled',
      )
      .sort((a, b) => b.startAt.localeCompare(a.startAt)),
  );

  // Agrupamento por dia local (aba Calendário) — toda a agenda do profissional, sem filtrar por
  // status, para dar a visão completa que as outras abas (por status) não oferecem sozinhas.
  readonly bookingsByDayKey = computed(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of this._bookings()) {
      const key = toDateKey(new Date(booking.startAt));
      const existing = map.get(key);
      if (existing) {
        existing.push(booking);
      } else {
        map.set(key, [booking]);
      }
    }
    return map;
  });

  load(): void {
    this._loading.set(true);
    this._error.set(null);

    this.bookingsService.getMine().subscribe({
      next: (bookings) => {
        this._bookings.set(bookings);
        this._loading.set(false);
        this.listenForUpdates();
      },
      error: () => {
        this._error.set('incomingBookings.loadErrorMessage');
        this._loading.set(false);
      },
    });
  }

  isProcessing(bookingId: string): boolean {
    return this._processingIds().has(bookingId);
  }

  accept(bookingId: string): void {
    this.setProcessing(bookingId, true);
    this._actionErrorKey.set(null);

    this.calendarMcpService.confirmBooking(bookingId).subscribe({
      next: (booking) => {
        this.upsertBooking(booking);
        this.setProcessing(bookingId, false);
      },
      error: () => {
        this.setProcessing(bookingId, false);
        this._actionErrorKey.set('incomingBookings.acceptErrorMessage');
      },
    });
  }

  reject(bookingId: string): void {
    this.setProcessing(bookingId, true);
    this._actionErrorKey.set(null);

    this.calendarMcpService.cancelBooking(bookingId).subscribe({
      next: (booking) => {
        this.upsertBooking(booking);
        this.setProcessing(bookingId, false);
      },
      error: () => {
        this.setProcessing(bookingId, false);
        this._actionErrorKey.set('incomingBookings.rejectErrorMessage');
      },
    });
  }

  private listenForUpdates(): void {
    if (this.hubSubscription) {
      return;
    }

    this.bookingStatusHub.connect();
    this.hubSubscription = this.bookingStatusHub.events.subscribe((event) => {
      const known = this._bookings().find(
        (booking) => booking.id === event.bookingId,
      );
      if (known) {
        // Confirmação chegou por uma via que não passou por accept() deste store (outra aba/
        // dispositivo da mesma sessão) — busca o Booking completo pra garantir que customerContact
        // apareça (seção 5.4: só é liberado após confirmação, e só a resposta HTTP o traz).
        if (event.status === 'confirmed' && !known.customerContact) {
          this.bookingsService.getById(event.bookingId).subscribe({
            next: (booking) => this.upsertBooking(booking),
            error: () => undefined,
          });
          return;
        }

        this._bookings.set(
          this._bookings().map((booking) =>
            booking.id === event.bookingId
              ? { ...booking, status: event.status }
              : booking,
          ),
        );
        return;
      }

      // Pedido novo que este store ainda não conhece (ex.: acabou de ser criado pelo client-app):
      // busca o Booking completo via HTTP, fonte de verdade (skill google-calendar-mcp-scheduling).
      this.bookingsService.getById(event.bookingId).subscribe({
        next: (booking) => this.upsertBooking(booking),
        // Silencioso: se falhar, o próximo load() reconcilia a lista.
        error: () => undefined,
      });
    });
  }

  private upsertBooking(booking: Booking): void {
    const exists = this._bookings().some(
      (existing) => existing.id === booking.id,
    );
    this._bookings.set(
      exists
        ? this._bookings().map((existing) =>
            existing.id === booking.id ? booking : existing,
          )
        : [booking, ...this._bookings()],
    );
  }

  private setProcessing(bookingId: string, processing: boolean): void {
    const next = new Set(this._processingIds());
    if (processing) {
      next.add(bookingId);
    } else {
      next.delete(bookingId);
    }
    this._processingIds.set(next);
  }

  ngOnDestroy(): void {
    this.hubSubscription?.unsubscribe();
    this.bookingStatusHub.disconnect();
  }
}
