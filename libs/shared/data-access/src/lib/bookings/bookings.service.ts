import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Booking } from '@cleaners/models';
import { API_BASE_URL } from '@cleaners/util';
import { Observable, map } from 'rxjs';
import { BookingDto, toBookingModel } from './booking.dto';

// Criação/confirmação/cancelamento de Booking ficam no CalendarMcpService (ver skill
// google-calendar-mcp-scheduling) — este service cobre apenas leitura (histórico, avaliações, etc.).
@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  // "Meus bookings" é resolvido pelo backend a partir da sessão (cookie) — nenhum id de usuário é passado aqui.
  getMine(): Observable<Booking[]> {
    return this.http
      .get<BookingDto[]>(`${this.apiBaseUrl}/bookings`)
      .pipe(map((dtos) => dtos.map(toBookingModel)));
  }

  getById(id: string): Observable<Booking> {
    return this.http
      .get<BookingDto>(`${this.apiBaseUrl}/bookings/${id}`)
      .pipe(map(toBookingModel));
  }
}
