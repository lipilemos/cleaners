import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AvailabilityRules,
  Booking,
  CalendarConnection,
  CreateBookingRequest,
  TimeSlot,
} from '@cleaners/models';
import { API_BASE_URL } from '@cleaners/util';
import { Observable } from 'rxjs';

// Nenhum método aqui fala com googleapis/SDK do Google diretamente — tudo passa pela API .NET (camada MCP).
// Ver skill google-calendar-mcp-scheduling para o fluxo completo entre client-app e professional-portal.
@Injectable({ providedIn: 'root' })
export class CalendarMcpService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  // userId vem da sessão (cookie) — nunca passado explicitamente pelo client.
  connectionStatus(): Observable<CalendarConnection> {
    return this.http.get<CalendarConnection>(
      `${this.apiBaseUrl}/me/calendar-connection`,
    );
  }

  // Retorna só a URL de consentimento OAuth do Google; o callback/troca de token é do backend.
  startConnection(): Observable<{ authUrl: string }> {
    return this.http.post<{ authUrl: string }>(
      `${this.apiBaseUrl}/me/calendar-connection/start`,
      {},
    );
  }

  // Sempre busca fresco da agenda real via MCP — nunca inferido de dados locais desatualizados.
  getAvailability(
    professionalId: string,
    from: string,
    to: string,
  ): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(
      `${this.apiBaseUrl}/professionals/${professionalId}/availability`,
      { params: { from, to } },
    );
  }

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiBaseUrl}/bookings`, request);
  }

  confirmBooking(bookingId: string): Observable<Booking> {
    return this.http.post<Booking>(
      `${this.apiBaseUrl}/bookings/${bookingId}/confirm`,
      {},
    );
  }

  cancelBooking(bookingId: string): Observable<Booking> {
    return this.http.post<Booking>(
      `${this.apiBaseUrl}/bookings/${bookingId}/cancel`,
      {},
    );
  }

  // 🔗 API (suposição — endpoint ainda não existe em cleaners-api, ver TASKS.md T27): regras semanais
  // de disponibilidade do profissional logado, resolvidas pela sessão (cookie), no mesmo padrão de
  // "/me/..." usado por connectionStatus/startConnection.
  getAvailabilityRules(): Observable<AvailabilityRules> {
    return this.http.get<AvailabilityRules>(
      `${this.apiBaseUrl}/me/availability-rules`,
    );
  }

  updateAvailabilityRules(
    request: AvailabilityRules,
  ): Observable<AvailabilityRules> {
    return this.http.put<AvailabilityRules>(
      `${this.apiBaseUrl}/me/availability-rules`,
      request,
    );
  }
}
