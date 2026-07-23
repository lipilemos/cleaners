export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// Dado sensível (CLAUDE.md secao 5.4) — 🔗 API (suposição, endpoint ainda não existe em cleaners-api):
// assume-se que o backend só preenche este campo na resposta de GET /bookings (e GET /bookings/:id)
// quando (a) quem pede é a sessão do Professional dono do booking, e (b) o status já é 'confirmed'
// (ou posterior). Nunca aparece na listagem pública nem antes da confirmação — ver T29.
export interface BookingCustomerContact {
  readonly name: string;
  readonly phone: string;
}

export interface Booking {
  readonly id: string;
  readonly userId: string;
  readonly professionalId: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly status: BookingStatus;
  // ID do evento correspondente na Google Agenda do profissional (ver skill google-calendar-mcp-scheduling).
  readonly calendarEventId?: string;
  readonly customerContact?: BookingCustomerContact;
}

// Visita de estimativa gratuita (free estimate): não referencia um Service — o profissional visita o
// local, avalia e informa o preço pessoalmente (ver CLAUDE.md 5.3).
export interface CreateBookingRequest {
  readonly professionalId: string;
  readonly startAt: string;
  readonly endAt: string;
  // Gerado no client para permitir retry seguro sem duplicar o booking em caso de falha de rede.
  readonly requestId: string;
}

export interface TimeSlot {
  readonly startAt: string;
  readonly endAt: string;
}
