---
name: google-calendar-mcp-scheduling
description: Use ao implementar o fluxo de agendamento (Booking) integrado ao Google Agenda via MCP — conexão de agenda por usuário, consulta de disponibilidade do profissional, criação do evento, atualização de status em tempo real via SignalR e o disparo de contato pós-confirmação. Cobre tanto o lado do client-app (criar agendamento) quanto do professional-portal (gerenciar disponibilidade e aceitar/recusar). Consulte também o agente calendar-mcp-integrator para decisões de arquitetura mais amplas dessa integração.
---

# Agendamento com Google Agenda via MCP

## Princípio central

Cada usuário (`User` e `Professional`) conecta sua **própria** Google Agenda de forma independente — não existe uma agenda única do aplicativo. A conexão é modelada como uma credencial/autorização por conta, acessada através de uma camada MCP dentro da **API .NET Core (repositório separado deste, ver CLAUDE.md seção 1.1)**. O Angular **nunca** guarda ou manipula tokens OAuth do Google — ele só consome endpoints da API .NET (autenticados por cookie `httpOnly`, ver CLAUDE.md seção 6.1), que por sua vez fala com o Google Agenda através do MCP.

```
Angular (client-app / professional-portal)   API .NET Core (repo separado)         Google Calendar API
   |  cookie httpOnly + CSRF header               |  camada MCP de Google Agenda        |
   | --------------------------------------------> | -----------------------------------> |
                                                      (token OAuth do Google isolado por
                                                       usuário, nunca chega ao Angular)
```

Existem dois tokens/credenciais diferentes e não devem ser confundidos: a **sessão da aplicação** (cookie `httpOnly`, usada em toda chamada, inclusive as de agendamento) e o **token OAuth do Google**, que fica inteiramente do lado do backend/MCP, por usuário.

## Divisão entre os dois apps

- **`client-app`** (feature `booking`): consulta `getAvailability` para um profissional e cria o `Booking` (`createBooking`).
- **`professional-portal`** (feature `availability`): inicia/gerencia a conexão da própria Google Agenda (`connectionStatus`, `startConnection`) e define regras de disponibilidade.
- **`professional-portal`** (feature `incoming-bookings`): lista bookings `pending` recebidos e aceita/recusa (`confirmBooking`, `cancelBooking`).
- O `CalendarMcpService` é o mesmo service, em `libs/shared/data-access`, consumido pelos dois apps — cada um usa só os métodos relevantes à sua feature.

## Modelo de dados

```ts
// libs/shared/models/calendar-connection.model.ts
export interface CalendarConnection {
  userId: string;
  provider: 'google';
  connected: boolean;
  calendarId?: string;      // id da agenda do Google conectada
  connectedAt?: string;
}

// libs/shared/models/booking.model.ts
export interface Booking {
  id: string;
  userId: string;
  professionalId: string;
  serviceId: string;
  startAt: string;          // ISO 8601
  endAt: string;             // ISO 8601
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  calendarEventId?: string;  // id do evento criado no Google Agenda do profissional
  contactTriggeredAt?: string;
}
```

## `CalendarMcpService` (`libs/shared/data-access`)

Responsabilidade: expor a integração de agenda às features de agendamento dos dois apps, sem vazar detalhes de MCP/OAuth para os componentes.

```ts
@Injectable({ providedIn: 'root' })
export class CalendarMcpService {
  private readonly http = inject(HttpClient);

  connectionStatus(): Observable<CalendarConnection> {
    // userId vem da sessão (cookie), nunca passado explicitamente pelo client
    return this.http.get<CalendarConnection>('/api/me/calendar-connection');
  }

  startConnection(): Observable<{ authUrl: string }> {
    // backend inicia o fluxo OAuth do usuário logado e retorna a URL de consentimento do Google
    return this.http.post<{ authUrl: string }>('/api/me/calendar-connection/start', {});
  }

  getAvailability(professionalId: string, from: string, to: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`/api/professionals/${professionalId}/availability`, {
      params: { from, to },
    });
  }

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>('/api/bookings', request);
  }

  confirmBooking(bookingId: string): Observable<Booking> {
    return this.http.post<Booking>(`/api/bookings/${bookingId}/confirm`, {});
  }

  cancelBooking(bookingId: string): Observable<Booking> {
    return this.http.post<Booking>(`/api/bookings/${bookingId}/cancel`, {});
  }
}
```

Regras:
- Nenhum método deste service fala diretamente com `googleapis` ou qualquer SDK do Google no frontend — tudo passa pela API própria.
- Nenhum método recebe `userId`/`professionalId` do usuário logado como parâmetro explícito para identificar "de quem" é a conexão — isso vem da sessão (cookie), resolvida no backend. `professionalId` só aparece como parâmetro quando se refere a *outro* profissional sendo consultado (ex.: `getAvailability`).
- `startConnection` apenas retorna uma URL para redirecionar o usuário ao consentimento OAuth do Google; o callback e a troca de token acontecem no backend.
- `getAvailability` reflete o que o MCP leu da agenda real do profissional — o frontend nunca infere disponibilidade a partir de dados locais desatualizados; sempre busca fresco ao abrir a tela de agendamento.

## Tempo real: status do `Booking` via SignalR

Como o mesmo `Booking` é relevante para os dois apps (o usuário quer saber se foi confirmado, o profissional quer ver o pedido chegar), o status é propagado por **SignalR** (`@microsoft/signalr`), não por polling:

- Um `BookingHubService` (`libs/shared/data-access/booking-hub.service.ts`) conecta ao hub da API .NET (`/hubs/bookings`) autenticado pela mesma sessão (cookie `httpOnly` — SignalR com `withCredentials`/`accessTokenFactory` não é necessário aqui, a conexão usa o cookie de sessão como o resto das chamadas).
- Expõe um `Observable<BookingStatusEvent>` (ou converte para signal no store consumidor) que a feature `booking` do `client-app` e `incoming-bookings` do `professional-portal` escutam para atualizar a UI sem reload.
- A conexão do hub é aberta/fechada pelo `SessionStore` (conecta quando autenticado, desconecta no logout) — nenhuma feature gerencia o ciclo de vida da conexão diretamente.
- Fallback: se o SignalR cair, a UI não trava — ao reabrir/focar a tela, o store recarrega o estado via a chamada HTTP normal (`GET /api/bookings/:id`) como fonte de verdade.

## Fluxo de agendamento na UI

1. `client-app`, feature `booking`: chama `getAvailability` para o profissional escolhido e exibe apenas horários livres.
2. Usuário seleciona horário → `createBooking` é chamado, com estado `pending` até confirmação.
3. `professional-portal`, feature `incoming-bookings`: recebe o novo `Booking` `pending` via SignalR, profissional aceita (`confirmBooking`) ou recusa (`cancelBooking`).
4. Ao confirmar (resposta com `status: 'confirmed'` e `calendarEventId` preenchido), ambos os apps recebem o evento via SignalR; o `client-app` mostra confirmação clara ao usuário, incluindo que o profissional entrará em contato.
5. O disparo do contato (telefonema/mensagem) é responsabilidade do backend/profissional, **não** do Angular — nenhum dos dois apps faz ligações nem envia SMS diretamente. A UI apenas reflete o status (`contactTriggeredAt`) quando disponível, ex. "o profissional vai te contatar em breve".

## Tratamento de erro (obrigatório, não opcional)

- Agenda do profissional não conectada → no `client-app`, UI orienta o usuário a tentar outro profissional; no `professional-portal`, a feature `availability` destaca isso com destaque e ação clara para reconectar.
- Conflito de horário (slot ocupado entre a consulta e a confirmação) → backend retorna erro específico; UI recarrega a disponibilidade automaticamente.
- Falha de rede na criação do booking → nunca assumir sucesso; exibir erro e permitir retry sem duplicar o booking (idempotência via um `requestId` gerado no client).

## Dados sensíveis no evento de agenda

- Título/descrição do evento no Google Agenda do profissional deve conter o necessário para identificar o serviço (nome do usuário, endereço do serviço, tipo de serviço) mas evitar campos desnecessários como telefone completo na descrição pública do evento, já que o profissional já recebe esse dado pelo canal de contato da aplicação.

## Teste

- Teste do `CalendarMcpService` com `HttpTestingController`/mocks para cada método.
- Teste do `BookingHubService` mockando a conexão SignalR, verificando que eventos recebidos chegam como `Observable`/atualizam o store esperado.
- Teste do componente de agendamento (`client-app`) cobrindo: agenda não conectada, sem horários disponíveis, conflito ao confirmar, sucesso.
- Teste da tela de pedidos recebidos (`professional-portal`) cobrindo: recebimento de novo pedido via evento simulado, aceitar, recusar.
- Não é necessário (nem recomendado) mockar a Google Calendar API real em testes de frontend — isso é responsabilidade dos testes do backend/camada MCP.
