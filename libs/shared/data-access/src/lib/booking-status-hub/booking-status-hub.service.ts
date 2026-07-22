import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@cleaners/util';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { BookingStatusEvent } from './booking-status.event';

const BOOKING_STATUS_HUB_EVENT = 'bookingStatusChanged';

// Conecta ao hub SignalR de status de Booking, autenticado pela mesma sessão (cookie httpOnly) usada
// pelo resto das chamadas HTTP — nunca um token anexado manualmente (CLAUDE.md secao 6.1). Não é um
// sistema robusto de reconexão: se a conexão cair, a feature consumidora continua confiando em HTTP
// (GET /bookings/:id) como fonte de verdade ao recarregar (ver skill google-calendar-mcp-scheduling).
@Injectable({ providedIn: 'root' })
export class BookingStatusHubService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly statusChanged$ = new Subject<BookingStatusEvent>();

  private connection: HubConnection | null = null;

  readonly events: Observable<BookingStatusEvent> =
    this.statusChanged$.asObservable();

  connect(): void {
    if (this.connection) {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${this.apiBaseUrl}/hubs/bookings`, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    this.connection.on(
      BOOKING_STATUS_HUB_EVENT,
      (event: BookingStatusEvent) => {
        this.statusChanged$.next(event);
      },
    );

    void this.connection.start();
  }

  disconnect(): void {
    if (!this.connection) {
      return;
    }

    if (this.connection.state !== HubConnectionState.Disconnected) {
      void this.connection.stop();
    }

    this.connection = null;
  }
}
