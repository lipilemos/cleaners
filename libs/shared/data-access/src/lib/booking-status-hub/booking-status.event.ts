import { BookingStatus } from '@cleaners/models';

// Payload do evento SignalR emitido pelo hub `/hubs/bookings` da API .NET sempre que o status de um
// Booking muda (ver skill google-calendar-mcp-scheduling, secao "Tempo real"). Reaproveitado pelo
// client-app (feature booking) e, futuramente, pelo professional-portal (incoming-bookings).
export interface BookingStatusEvent {
  readonly bookingId: string;
  readonly status: BookingStatus;
}
