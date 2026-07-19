---
name: angular-service-http-layer
description: Use ao criar ou revisar qualquer service Angular que fale com a API do CleanersApp (profissionais, avaliações, agendamento, usuário). Cobre convenção de nomenclatura, tipagem de retorno via OpenAPI, autenticação por cookie httpOnly + CSRF, tratamento de erro centralizado e a separação entre service (Observable) e estado (signal).
---

# Camada de serviços HTTP

## Backend consumido

Todo service deste Angular consome a **API .NET Core (C#), em repositório separado deste**, autenticada por **cookie `httpOnly`** (não por header `Authorization: Bearer` montado no cliente — ver CLAUDE.md seção 6.1). Isso significa:

- Nenhuma regra de negócio é implementada no service Angular — ele só chama o endpoint e mapeia a resposta (DTO da API) para os models de domínio em `libs/shared/models`. Decisões como "esse horário está disponível", "esse booking pode ser avaliado" vêm sempre da resposta da API, nunca de uma checagem local antecipada.
- Nenhum service lê, guarda ou anexa um token — o cookie de sessão é enviado automaticamente pelo navegador desde que a requisição use `withCredentials: true` (garantido pelo interceptor central, não por cada service).
- Um `401`/`403` da API é tratado pelo interceptor central (ver "Autenticação e tratamento de erro" abaixo), não pelo service individual.

## Onde vivem os services

- `libs/shared/data-access/`: services por agregado de domínio (`ProfessionalsService`, `ReviewsService`, `BookingsService`, `CalendarMcpService`, `UserProfileService`) — reaproveitados por `client-app` e `professional-portal`.
- `apps/<app>/src/app/core/`: services específicos de infraestrutura do próprio app (ex.: `GeolocationService` no `client-app`, `PwaInstallService`) que não fazem sentido compartilhar.
- `@Injectable({ providedIn: 'root' })` a menos que exista uma razão explícita para escopo de rota.

## Forma do service

```ts
@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private readonly http = inject(HttpClient);

  getNearby(lat: number, lng: number, radiusKm: number): Observable<Professional[]> {
    return this.http.get<ProfessionalDto[]>('/api/professionals/nearby', {
      params: { lat, lng, radiusKm },
    }).pipe(map((dtos) => dtos.map(toProfessionalModel)));
  }

  getById(id: string): Observable<Professional> {
    return this.http.get<ProfessionalDto>(`/api/professionals/${id}`)
      .pipe(map(toProfessionalModel));
  }
}
```

Regras:
- Método retorna `Observable<T>` **tipado**, `T` sendo um model de `libs/shared/models`. Nunca `Observable<any>`.
- `ProfessionalDto` (e equivalentes) vêm do gerador de tipos a partir do OpenAPI da API .NET (ver "Contrato com a API" abaixo) — não são escritos manualmente à mão.
- O mapeamento DTO → model de domínio é explícito (`toProfessionalModel`), nunca um `as Professional` silencioso — protege contra o shape do DTO divergir do model de UI sem quebrar em tempo de compilação.
- Nenhuma lógica de apresentação (formatação, cálculo de distância/média) dentro do service — isso é responsabilidade do componente/store consumidor via `computed()`.
- Nenhum componente chama `HttpClient` diretamente; sempre passa por um service.
- Conversão de `Observable` para `signal` (via `toSignal`) acontece no componente ou no store da feature, não dentro do service — o service permanece testável de forma isolada com `Observable`.

## Autenticação e tratamento de erro

Interceptors em `apps/<app>/src/app/core/interceptors/` (mesma estrutura nos dois apps), com responsabilidades separadas:

- `credentials.interceptor.ts`: garante `withCredentials: true` em toda requisição para a API .NET, para o cookie `httpOnly` de sessão ser enviado pelo navegador. Nenhum service precisa fazer isso individualmente.
- `csrf.interceptor.ts`: anexa o header anti-CSRF (valor obtido de um endpoint/cookie não-`httpOnly` dedicado, definido pelo backend) em toda requisição mutável (`POST`/`PUT`/`PATCH`/`DELETE`).
- `error.interceptor.ts`: centraliza tratamento de erro, responsável por:
  - Normalizar o formato de erro exposto aos componentes.
  - Tratar `401` (sessão expirada/inválida) atualizando o `SessionStore` para deslogado e redirecionando para login.
  - Logar erros de forma segura (nunca logar payloads com dados sensíveis do usuário — telefone, endereço).

Services individuais não fazem `try/catch` para tratamento de erro genérico nem lidam com `401`; usam `catchError` apenas quando precisam de um fallback específico do domínio (ex.: retornar lista vazia em vez de propagar erro em uma busca não crítica).

## Contrato com a API (OpenAPI)

- Os tipos `*Dto` usados pelos services são gerados a partir do OpenAPI/Swagger publicado pela API .NET (ex.: `openapi-typescript`), via um alvo Nx dedicado (ex.: `nx run api-types:generate`) — nunca escritos manualmente por adivinhação de shape.
- Regenerar após qualquer mudança de contrato no backend, antes de ajustar os services que o consomem.
- Arquivos gerados não são editados manualmente; se um DTO gerado não serve, o mapeamento (`toXModel`) é o lugar para adaptar, não o arquivo gerado.

## Nomenclatura de métodos

- `getX` / `getXById` para leitura.
- `createX` / `updateX` / `deleteX` para escrita.
- Ações de domínio que não são CRUD puro têm nome de verbo de negócio, não genérico: `confirmBooking`, `cancelBooking`, `startCalendarConnection` — não `doAction` ou `process`.

## Teste

- Todo service é testado com `HttpTestingController` (`provideHttpClientTesting`), verificando: URL/params/body da requisição, o mapeamento DTO → model, e que a chamada não injeta headers de auth manualmente (isso é responsabilidade do interceptor, testado à parte).
- Não testar os interceptors dentro do teste de cada service — cada interceptor tem teste próprio isolado.
