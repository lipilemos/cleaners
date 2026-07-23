# CleanersApp — Guia de Desenvolvimento

Este arquivo direciona qualquer trabalho feito neste repositório com Claude Code. Ele descreve o domínio do produto, a stack, a arquitetura esperada e os padrões de código Angular que **devem** ser seguidos. Os agentes, skills e comandos referenciados aqui vivem em [.claude/agents](.claude/agents), [.claude/skills](.claude/skills) e [.claude/commands](.claude/commands).

> Estado atual: o workspace Nx/Angular (`apps/`, `libs/`) já existe neste repositório — ver seções 1.2 e 3 para a estrutura. O backend (`cleaners-api`, repositório irmão) também já está em desenvolvimento ativo — ver seção 1.3 para o índice atualizado da sua estrutura (entidades, DTOs, endpoints).
>
> ⚠️ **Git**: neste repositório, `apps/`, `libs/` e a maior parte da config do workspace (`nx.json`, `package.json`, `tsconfig*.json` etc.) ainda estão **não commitados** — só `.claude/`, este `CLAUDE.md`, `TASKS.md` e alguns outros arquivos estão versionados (`git status` mostrando "up to date" é enganoso). O mesmo vale no `cleaners-api`: boa parte do trabalho de auth/login ainda não foi commitada lá. **Nunca rode `git stash`/`git clean`/`git checkout --`/`git reset --hard` sem antes checar `git status` com cuidado** — "untracked" aqui não significa "descartável", significa "única cópia em disco".

## 1. Visão geral do produto

CleanersApp é um marketplace de serviços de faxina/limpeza que conecta usuários a profissionais autônomos.

Fluxo principal do usuário (app cliente):

1. **Login** — usuário autenticado vê uma lista de profissionais em formato de cards.
2. **Descoberta** — a lista carrega profissionais **mais próximos** (geolocalização), exibindo os **serviços oferecidos**, **avaliações** de clientes anteriores e uma **nota em estrelas** (média das avaliações).
3. **Agendamento** — o usuário agenda um horário integrado ao **Google Agenda** do profissional (ver seção 5.3).
4. **Contato** — após a confirmação do agendamento, o profissional entra em contato com o usuário por telefonema ou mensagem, usando os dados de contato informados no cadastro do usuário.

Fluxo principal do profissional (portal do profissional, ver seção 1.2):

1. **Login** — em app próprio, separado do app do cliente.
2. **Conectar agenda** — autoriza o acesso à sua Google Agenda.
3. **Gerenciar disponibilidade e agendamentos** — vê pedidos de agendamento, aceita/recusa, consulta histórico e avaliações recebidas.

Entidades de domínio centrais (nomes a usar de forma consistente no código):

| Entidade       | Descrição                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `User`         | Cliente que contrata o serviço. Possui dados de contato (telefone, endereço/geolocalização).                      |
| `Professional` | Prestador de serviço de limpeza. Possui `services[]`, `rating`, `reviews[]`, localização, e uma agenda conectada. |
| `Service`      | Um tipo de serviço oferecido por um profissional (ex.: limpeza residencial, pós-obra, passadoria).                |
| `Review`       | Avaliação de um `User` sobre um `Professional` após um serviço concluído (nota 1–5 + comentário).                 |
| `Booking`      | Agendamento entre `User` e `Professional`, vinculado a um evento no Google Agenda do profissional.                |

## 1.1 Arquitetura geral: este repositório é o frontend (monorepo Nx)

Este repositório contém **apenas o frontend**. Toda regra de negócio, persistência e autenticação vivem em uma **API separada, em repositório próprio**:

- **Backend**: .NET Core (C#), em outro repositório (não neste) — **[lipilemos/cleaners-api](https://github.com/lipilemos/cleaners-api)** (privado). Localmente vive como repositório irmão deste, em `../cleaners-api` (ex.: `C:\Users\<usuário>\source\repos\cleaners-api`). Estrutura em Clean Architecture (`Domain`/`Application`/`Infrastructure`/`Api`); ver `README.md` e `TASKS.md` desse repositório para arquitetura e plano de implementação em andamento. Ao planejar uma feature que depende de um endpoint novo (ver marcações 🔗 **API** no [TASKS.md](TASKS.md) deste repositório), verifique o `TASKS.md` do `cleaners-api` para desenvolver em par — o endpoint e o consumo no Angular tendem a evoluir juntos. **Ver seção 1.3** para um índice detalhado (entidades, DTOs, endpoints) da estrutura atual do backend, mantido atualizado neste arquivo.
- **Banco de dados**: gerenciado inteiramente pelo backend .NET; o Angular nunca acessa dados diretamente, sempre via a API HTTP.
- **Regra de negócio**: decisões que dependem de fonte de verdade do servidor (confirmação de agendamento, disponibilidade real, vínculo de review a booking concluído) são resolvidas pela API .NET. O Angular pode replicar cálculos simples só para exibição/derivação de UI (ex.: média de estrelas a partir de uma lista já recebida), mas **nunca decide sozinho** se uma ação é permitida.
- **Autenticação**: JWT emitido pela API .NET e entregue como **cookie `httpOnly`, `Secure`, `SameSite`** — nunca como token manipulável por JavaScript (nem `localStorage`, nem header montado manualmente). Ver seção 6.1.

Consequência prática: qualquer service Angular é um cliente HTTP fino da API .NET (ver seção 6) — não deve conter regra de negócio, apenas orquestrar chamadas e mapear DTOs para os models do frontend.

## 1.2 Dois aplicativos, um workspace Nx

O produto tem **dois frontends distintos**, cada um com login e propósito próprios, organizados como um **monorepo Nx** para compartilhar design system, models e camada de dados sem duplicar código:

```
apps/
  client-app/            # PWA do usuário final: descoberta, agendamento, avaliação
  professional-portal/   # portal do profissional: agenda, disponibilidade, pedidos de agendamento
libs/
  shared/
    ui/                  # design system (wrappers sobre Angular Material): star-rating, professional-card, etc.
    data-access/         # services HTTP por agregado de domínio, consumidos pelos dois apps
    models/              # interfaces de domínio (User, Professional, Service, Review, Booking)
    auth/                 # guards de rota, sessão (bootstrap via cookie), tipos de sessão
    util/                  # funções puras: cálculo de distância, formatação, etc.
    i18n/                   # config central de tradução (Transloco), LanguageStore, textos comuns aos dois apps
```

Regras de dependência (ver skill [nx-workspace-standards](.claude/skills/nx-workspace-standards/SKILL.md) para a convenção de tags):

- `apps/*` pode depender de `libs/shared/*`. `libs/shared/*` **nunca** depende de `apps/*`.
- `libs/shared/ui` não depende de `libs/shared/data-access` (componentes de UI não fazem HTTP).
- `libs/shared/data-access` não depende de `libs/shared/ui`.
- Nenhuma lib importa código específico de um app.
- Assumido por padrão, sinalize se não for o caso: os dois apps autenticam de forma **independente** (login separado para `User` e para `Professional`) — não há SSO entre eles nesta fase.

## 1.3 Índice da estrutura atual do backend (`cleaners-api`)

> **Regra de manutenção**: esta seção é o índice único e vivo da estrutura do backend, para consulta rápida ao planejar/implementar uma feature no frontend sem precisar reexplorar o outro repositório do zero. Sempre que uma mudança em `cleaners-api` for feita (entidade, campo, DTO, endpoint) — inclusive como parte de uma feature deste repositório — **atualize esta seção no mesmo commit/sessão**. Nunca crie arquivos de memória separados para isso; a fonte de verdade sobre a estrutura do backend, para fins de planejamento de features do frontend, é este CLAUDE.md.

**Caminho local**: `../cleaners-api` (repositório irmão, .NET 10). Rodar localmente: `dotnet run --project src/CleanersApi.Api` (ver `README.md` do `cleaners-api` para connection string/user-secrets).

**Camadas** (Clean Architecture):

```
src/
  CleanersApi.Domain/         # entidades (abaixo) + enum BookingStatus
  CleanersApi.Application/    # Dtos/, Abstractions/Repositories/, Abstractions/Services/, Services/ (regra de negócio), DependencyInjection.cs (AddApplication)
  CleanersApi.Infrastructure/ # Persistence/ (EF Core + Migrations), Repositories/ (Ef*Repository), Services/ (Jwt, PasswordHasher, ImageCompressor — dependem de tecnologia externa), ExternalServices/ (GoogleCalendarMcpService — integração real via Google.Apis.Calendar.v3/Google.Apis.Auth)
  CleanersApi.Api/            # Controllers/, Hubs/ (BookingsHub, ClaimsUserIdProvider, SignalRBookingNotifier), Middleware/ (CsrfMiddleware), Program.cs
tests/
  CleanersApi.Application.Tests/
```

> **Regra obrigatória de fluxo entre camadas** (vale para todo controller novo ou existente): `Controller → IService (Application/Abstractions/Services) → Service (Application/Services) → IRepository (Application/Abstractions/Repositories) → Ef*Repository (Infrastructure/Repositories)`. Um controller **nunca** injeta um `I*Repository` nem contém regra de negócio (validação de conflito, verificação de senha, montagem de DTO a partir de entidade, limites/validação de upload etc.) — ele só faz três coisas: (1) extrai dado de HTTP puro (claims do JWT, corpo da requisição, `IFormFile`/stream, `Request.Scheme`/`Host` quando a URL de retorno precisa de origem absoluta), (2) chama exatamente um método de um `IService`, (3) traduz o resultado (DTO, enum de outcome, `null`) em status HTTP/cookie. Toda regra de negócio, incluindo mapeamento entidade→DTO, vive na implementação do service em `Application/Services` — nunca no controller nem no repository. Services de `Application/Services` são registrados via `AddApplication()` (`CleanersApi.Application/DependencyInjection.cs`), chamado a partir do `Program.cs` junto com `AddInfrastructure()`. Hoje: `AuthService` (login/registro), `SessionService` (bootstrap `GET /api/me`), `ProfessionalService` (busca, detalhe, "meus dados"/account-data, CRUD de `Service` do profissional dono), `UserService` (perfil do `User`, upload/compressão/limites de foto), `BookingService` (visita de estimativa: criação idempotente, confirmação/cancelamento, mapeamento para `BookingDto`) e `AvailabilityService` (conexão da Google Agenda, regras semanais, cálculo de slots livres). Exceção pontual à regra de "um `IService` por controller": `ProfessionalsController` injeta tanto `IProfessionalService` quanto `IAvailabilityService`, já que `GET /{id}/availability` é uma leitura pública sobre o profissional que faz mais sentido no mesmo controller que já expõe `GetById` do que num controller novo só para isso.

**Entidades de domínio** (`Domain/Entities`, campos atuais):

- `User`: `Id, Name, Email, Phone, PhotoData, PhotoContentType, PhotoUpdatedAt, Address, Number, City, State, ZipCode, Latitude, Longitude, PasswordHash, Bookings[], Reviews[]`. `PhotoData` (`byte[]?`, `varbinary(max)`) guarda a foto de perfil **em bytes direto no banco** (decisão explícita — diferente do padrão de URL externa usado em `Professional.PhotoUrl`), sempre já recomprimida para JPEG e no máximo ~100KB antes de chegar aqui (`IImageCompressor`, ver seção abaixo); `PhotoContentType` guarda o content-type a devolver (`image/jpeg`) e `PhotoUpdatedAt` só serve de cache-buster na URL exposta ao frontend. `Address/Number/City/State/ZipCode` foram adicionados para casar com o form estruturado do `client-app` (feature `user-profile`, model `UserAddress`), consistente com o padrão já usado em `Professional`.
- `Professional`: `Id, Name, Email, Phone, PhotoUrl, Latitude, Longitude, Address, City, State, ZipCode, IsFeatured, HasConnectedCalendar, PasswordHash, Services[], Reviews[], Bookings[], AvailabilityRules[]`, `AverageRating` (computed a partir de `Reviews`, ignorado pelo EF). Conexão da Google Agenda (só o `Professional` conecta — **decisão registrada**, ver seção 5.3): `GoogleAccessTokenEncrypted, GoogleRefreshTokenEncrypted, GoogleTokenExpiresAtUtc, GoogleCalendarId, GoogleCalendarConnectedAtUtc` — os dois tokens sempre criptografados via `IDataProtector` (`GoogleCalendarMcpService`), nunca em texto puro; `HasConnectedCalendar` é setado por `AvailabilityService`/`GoogleCalendarMcpService.CompleteConnectionAsync`, não é mais um campo solto.
- `Service`: `Id, ProfessionalId, Name, Description, Price, Currency, DurationMinutes` — CRUD completo (`professionals/me/services*`, ver tabela de endpoints) restrito ao profissional dono via claim `sub`, nunca por `ProfessionalId` no corpo. `Currency` (enum `Domain.Enums.Currency`: `BRL/USD/EUR`, migration `AddServiceCurrency`) armazenado como `int` no banco (mesma convenção de `BookingStatus`, sem `HasConversion<string>`) e achatado para o código ISO 4217 (`"BRL"/"USD"/"EUR"`) em `ServiceDto`/`CreateServiceRequestDto` — parse/achatamento vive em `ProfessionalService` (`Enum.Parse<Currency>`/`.ToString()`), nunca no controller; `CreateServiceRequestDto.Currency` é validado com `[EnumDataType(typeof(Currency))]`. Default `Currency.BRL` (coerente com pt-BR como idioma padrão, CLAUDE.md seção 2).
- `Review`: `Id, UserId, ProfessionalId, BookingId` (vínculo único e obrigatório a um `Booking`), `Rating, Comment, CreatedAt`
- `Booking`: `Id, UserId, ProfessionalId, ScheduledStart, ScheduledEnd, Status` (enum `BookingStatus`: `PendingConfirmation/Confirmed/Rejected/CancelledByUser/CancelledByProfessional/Completed`), `GoogleCalendarEventId?, RequestId?` (idempotência da criação — único por `UserId`, ver `BookingsController.Create`), `CreatedAt, ConfirmedAt?`. **Decisão registrada**: não referencia mais `Service`/`ServiceId` (removido, migration `UpdateBookingAndProfessionalForFreeEstimate`) — é uma visita de estimativa gratuita (free estimate), não a contratação de um serviço específico; o preço é combinado pessoalmente após a visita (ver seção 5.3).
- `ProfessionalAvailabilityRule`: `Id, ProfessionalId, DayOfWeek` (`int`, 0=domingo..6=sábado, mesma convenção de `Date.getDay()`), `Enabled, StartTime, EndTime` (`TimeOnly`, trafegam como string `"HH:mm"` nos DTOs, nunca o formato `TimeOnly` default do System.Text.Json) — janelas semanais recorrentes de disponibilidade do profissional para visitas de estimativa.

**DTOs expostos hoje** (`Application/Dtos`):

- `ProfessionalSummaryDto(Id, Name, PhotoUrl, Services[ServiceDto], AverageRating, ReviewCount, IsFeatured, City, State)` — usado por `GET /api/professionals` (listagem).
- `ProfessionalDetailDto(Id, Name, PhotoUrl, Services[ServiceDto], AverageRating, ReviewCount, IsFeatured, City, State, HasConnectedCalendar, Reviews[ProfessionalReviewDto])` e `ProfessionalReviewDto(Id, AuthorName, Rating, Comment, CreatedAt)` — usado por `GET /api/professionals/{id}` (feature `professional-detail`), com as avaliações já embutidas na resposta (evita depender de um endpoint `/reviews` próprio, que ainda não existe — ver pendências abaixo). Ainda não expõe `Address`/`ZipCode`/`Phone` do profissional (mesma decisão de privacidade do `ProfessionalSummaryDto`, ver seção 5.4) — decisão registrada, não uma pendência.
- `ProfessionalAccountDto(Id, Name, Email, PhotoUrl)` — login/registro/`me` de `Professional`.
- `UserAccountDto(Id, Name, Email, Phone, Address, Latitude, Longitude)` — login/registro/`me` de `User` (forma resumida/flat, igual antes; `Address` continua uma única string aqui, não confundir com `UserProfileDto` abaixo).
- `UserProfileDto(Id, Name, Email, Phone, PhotoUrl, Address: UserProfileAddressDto)` e `UserProfileAddressDto(Street, Number, City, State, ZipCode, Latitude, Longitude)` — forma completa de "meus dados" (`GET/PUT /api/users/me`), endereço já estruturado por campo para casar com o form Angular. `UpdateUserProfileRequestDto(Name, Phone, Address: UserProfileAddressDto)` é o corpo do PUT.
- `ProfessionalAccountDataDto(Id, Name, Email, Phone, PhotoUrl, Address: ProfessionalAccountAddressDto)` e `ProfessionalAccountAddressDto(Street, City, State, ZipCode)` — forma de "meus dados" do `Professional` (`GET/PUT /api/professionals/me/account-data`, professional-portal feature `professional-profile`, aba "Meus dados"), distinta de `ProfessionalDetailDto`/`GET /professionals/me` (aba "Meus serviços", que expõe `Services[]`/`Reviews[]` mas não dados de contato). Sem `Number` (`Professional.Address` é uma única string, diferente de `User`) e sem latitude/longitude (não editados nesta tela). `UpdateProfessionalAccountDataRequestDto(Name, Phone, Address: ProfessionalAccountAddressDto)` é o corpo do PUT — `Email` não é editável por este endpoint (mesma restrição de `UpdateUserProfileRequestDto`).
- `ServiceDto(Id, Name, Description, Price, Currency, DurationMinutes)` — `Currency` é o código ISO 4217 (`string`, um de `"BRL"/"USD"/"EUR"`), achatado a partir do enum `Domain.Enums.Currency` (ver `Service` acima).
- `CreateServiceRequestDto(Name, Description, Price, Currency, DurationMinutes)` — corpo de `POST`/`PUT /api/professionals/me/services*`; mesmo shape para criar e atualizar. `Currency` obrigatório, validado contra o enum via `[EnumDataType]`.
- `LoginRequestDto(Email, Password)`, `RegisterUserRequestDto(Name, Email, Password, Phone)`, `RegisterProfessionalRequestDto(Name, Email, Password, Phone)`.
- `BookingDto(Id, UserId, ProfessionalId, StartAt, EndAt, Status, CalendarEventId?, CustomerContact: BookingCustomerContactDto?)` — `Status` já achatado para os 4 valores que o frontend conhece (`"pending"/"confirmed"/"completed"/"cancelled"`; `Rejected`/`CancelledByUser`/`CancelledByProfessional` do domínio colapsam em `"cancelled"`). `CustomerContactDto(Name, Phone)` só vem preenchido quando quem pede é o `Professional` dono **e** o status já é `Confirmed`/`Completed` (CLAUDE.md 5.4) — mapeamento em `BookingService.ToDto`.
- `CreateBookingRequestDto(ProfessionalId, StartAt, EndAt, RequestId)` — corpo de `POST /api/bookings`; sem `ServiceId` (ver decisão acima). `RequestId` garante retry seguro sem duplicar (`IBookingRepository.GetByUserIdAndRequestIdAsync`).
- `TimeSlotDto(StartAt, EndAt)` — usado por `GET /api/professionals/{id}/availability`.
- `CalendarConnectionDto(UserId, Provider, Connected, CalendarId?, ConnectedAt?)` — espelha `CalendarConnection` do frontend; `UserId` aqui é sempre o `ProfessionalId` (só ele conecta agenda nesta fase).
- `StartCalendarConnectionResponseDto(AuthUrl)` — resposta de `POST /api/me/calendar-connection/start`.
- `WeeklyAvailabilityRuleDto(DayOfWeek, Enabled, StartTime, EndTime)` e `AvailabilityRulesDto(Rules: WeeklyAvailabilityRuleDto[])` — mesmo shape para `GET` e `PUT /api/me/availability-rules` (o frontend sempre envia/recebe o array completo das 7 regras).

**Endpoints existentes**:

| Endpoint                                           | Auth                                        | Observação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/login`                                  | —                                           | único endpoint para `User` e `Professional`, resolvido por e-mail (sem SSO — ver seção 1.2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `POST /api/logout`                                 | —                                           | limpa o cookie no servidor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `POST /api/register`                               | —                                           | cria `User`, auto-login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /api/professional-register`                  | —                                           | cria `Professional`, auto-login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `GET /api/me`                                      | `[Authorize]`                               | bootstrap de sessão (200 autenticado / 401 deslogado) — ver seção 6.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `GET /api/professionals?search&take`               | —                                           | busca por nome **ou** cidade (`Contains` case-insensitive em memória de string, não Haversine — ver `EfProfessionalRepository.SearchAsync`), ordenada por destaque > nota média > nome. `search` vazio/ausente retorna lista vazia. Substituiu o antigo `?lat&lng` (proximidade): a busca inicial do `client-app` agora resolve a cidade a partir da geolocalização **no próprio Angular** (reverse geocoding client-side via Nominatim/OpenStreetMap, `ReverseGeocodingService` em `apps/client-app/src/app/core/geolocation`) e envia essa cidade como `search`; buscas seguintes (nome ou cidade digitados) usam o mesmo endpoint com o termo digitado. |
| `GET /api/professionals/{id}`                      | —                                           | detalhe do profissional (feature `professional-detail`), retorna `ProfessionalDetailDto` com `reviews[]` embutidas (`EfProfessionalRepository.GetByIdAsync` já inclui `Reviews.User` para resolver `AuthorName`) e `hasConnectedCalendar`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `GET /api/professionals/me`                        | `[Authorize]` + `account_type=Professional` | "meu perfil" do `Professional` logado (feature `professional-profile`, aba "Meus serviços", T31/B21), mesmo shape de `GET /professionals/{id}` (`ProfessionalDetailDto`) mas resolvido pela claim `sub`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `GET /api/professionals/me/account-data`           | `[Authorize]` + `account_type=Professional` | "meus dados" do `Professional` logado (feature `professional-profile`, aba "Meus dados") — dados de cadastro/contato (`ProfessionalAccountDataDto`), distinto do perfil público acima                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `PUT /api/professionals/me/account-data`           | `[Authorize]` + `account_type=Professional` | atualiza Nome/Telefone/Endereço do `Professional` logado — corpo `UpdateProfessionalAccountDataRequestDto`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `POST /api/professionals/me/services`              | `[Authorize]` + `account_type=Professional` | cria um `Service` do profissional logado — corpo `CreateServiceRequestDto`, retorna `ServiceDto`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `PUT /api/professionals/me/services/{id}`          | `[Authorize]` + `account_type=Professional` | atualiza um `Service` do profissional logado — 404 tanto se o serviço não existe quanto se pertence a outro profissional (não distingue os dois casos)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `DELETE /api/professionals/me/services/{id}`       | `[Authorize]` + `account_type=Professional` | remove um `Service` do profissional logado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `GET /api/users/me`                                | `[Authorize]`                               | "meus dados" completos do `User` logado (feature `user-profile`), resolvido pela claim `sub` — retorna `UserProfileDto`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `PUT /api/users/me`                                | `[Authorize]`                               | atualiza `Name/Phone/Address` (estruturado) do `User` logado — corpo `UpdateUserProfileRequestDto`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `POST /api/users/me/photo`                         | `[Authorize]`                               | upload da foto de perfil (`multipart/form-data`, campo `file`; aceita jpeg/png/webp até 5MB de upload original). Recomprime via `IImageCompressor` (`ImageSharpImageCompressor`, pacote `SixLabors.ImageSharp` — reduz qualidade JPEG e, se preciso, dimensões, em passos, até caber em ~100KB) e persiste o resultado direto em `User.PhotoData`/`PhotoContentType` — **decisão registrada**: bytes no banco, não arquivo/URL externa (diferente de `Professional.PhotoUrl`, que continua sendo só uma URL, sem endpoint de upload ainda).                                                                                                                |
| `GET /api/users/me/photo`                          | `[Authorize]`                               | serve os bytes da foto do próprio usuário logado (`FileResult`, content-type `image/jpeg`); `404` se não houver foto. Autenticado pelo mesmo cookie de sessão — um `<img src>` da SPA funciona porque cookie `SameSite=Lax` é enviado em requisições same-site (mesmo domínio, ignorando porta/scheme conforme já vale para o resto da API), não precisa de URL assinada. `UserProfileDto.PhotoUrl` (`GET/PUT /api/users/me`) é montado apontando pra cá, com `?v={PhotoUpdatedAt}` só como cache-buster.                                                                                                                                                  |
| `GET /api/professionals/{id}/availability?from&to` | —                                           | slots livres de 60min (visita de estimativa) para o profissional, combinando `ProfessionalAvailabilityRule` + `Booking`s locais ativos + `GetBusyPeriodsAsync` real da Google Agenda (`ProfessionalsController`, injeta `IAvailabilityService`) — lista vazia (nunca erro) se `HasConnectedCalendar` é `false`                                                                                                                                                                                                                                                                                                                                             |
| `POST /api/bookings`                               | `[Authorize]` + `account_type=User`         | cliente solicita uma visita de estimativa gratuita — corpo `CreateBookingRequestDto`, idempotente por `(UserId, RequestId)`, `409 Conflict` se o horário já não está mais livre para esse profissional                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `GET /api/bookings`                                | `[Authorize]`                               | lista os bookings do chamador — como `User` (cliente) ou como `Professional` (destinatário dos pedidos), conforme `account_type` na sessão                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `POST /api/bookings/{id}/confirm`                  | `[Authorize]` + `account_type=Professional` | só o profissional dono, só a partir de `PendingConfirmation` — cria o evento real na própria Google Agenda (`ICalendarSchedulingService.CreateEventAsync`) antes de marcar `Confirmed`; propaga via `BookingsHub`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `POST /api/bookings/{id}/cancel`                   | `[Authorize]`                               | `User` ou `Professional` dono — status resultante depende de quem chama e do status atual (`BookingService.CancelAsync`); cancela o evento na Google Agenda se já existir; propaga via `BookingsHub`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `GET /api/me/calendar-connection`                  | `[Authorize]` + `account_type=Professional` | status da conexão da própria Google Agenda — `CalendarConnectionDto`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `POST /api/me/calendar-connection/start`           | `[Authorize]` + `account_type=Professional` | retorna só a URL de consentimento OAuth do Google (`StartCalendarConnectionResponseDto`); o code/token nunca passam pelo Angular                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `GET /api/calendar/oauth-callback`                 | —                                           | alvo do redirect do Google após o consentimento (navegação de topo do navegador, não fetch/XHR — `state` carrega o `professionalId`); sempre redireciona de volta para `{professional-portal}/availability?calendarConnected=true\|false`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `GET/PUT /api/me/availability-rules`               | `[Authorize]` + `account_type=Professional` | regras semanais de disponibilidade do profissional logado (`AvailabilityRulesDto`) — `PUT` sempre substitui o array inteiro (`IAvailabilityRuleRepository.ReplaceAllAsync`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Tempo real**: hub SignalR `BookingsHub` em `/hubs/bookings` (`[Authorize]`), `ClaimsUserIdProvider` resolve `Clients.User(id)` pela claim `sub`; `SignalRBookingNotifier` (implementa `IBookingNotifier` da Application) é chamado por `BookingService.ConfirmAsync`/`CancelAsync` e envia o evento `bookingStatusChanged` (`{ bookingId, status }`) para o `User` e o `Professional` do booking. `CsrfMiddleware` isenta qualquer path iniciando com `/hubs/` (o negotiate do SignalR não ecoa o header `X-XSRF-TOKEN`).

**Auth**: JWT (HS256, `Jwt:SigningKey` via user-secrets) entregue como cookie `httpOnly`+`Secure`+`SameSite=Lax` (nunca no corpo — ver `AuthCookieNames`/`AuthController`). Claims: `sub`, `email`, `name`, `account_type` (`User`/`Professional`). CORS com `AllowCredentials` liberado só para `localhost:4200/4201` (http e https). CSRF via `CsrfMiddleware` (double-submit: cookie `XSRF-TOKEN` não-httpOnly + header, ver seção 6.1 deste arquivo) — vale também para o upload multipart de foto, sem tratamento especial. Autorização por tipo de conta (claim `account_type`) além do `[Authorize]` padrão (autenticação) é checada manualmente por controller quando o endpoint é exclusivo de um tipo — ex.: `ProfessionalsController.ResolveProfessionalId()` retorna 401 se não autenticado e 403 (`Forbid()`) se autenticado como `User` tentando gerenciar `services` de profissional; ainda não existe um mecanismo central (policy/middleware) para isso — cada controller que precisar replica o mesmo padrão até essa necessidade aparecer de novo. Credenciais do Google OAuth (`Google:ClientId`/`ClientSecret`/`RedirectUri`, via user-secrets) são lidas em `Program.cs` **sem** `throw` no startup (diferente de `Jwt:SigningKey`) — a API sobe normalmente sem elas; o erro só aparece, claro e acionável, quando um endpoint que realmente precisa do Google é chamado (`GoogleCalendarMcpService.EnsureConfigured`). Nenhuma credencial real do Google foi configurada neste ambiente ainda — quem for testar a conexão de agenda de ponta a ponta precisa criar um projeto OAuth (tipo "Web application") no Google Cloud Console.

**Persistência**: SQL Server local (`PC_LIPE\SQLEXPRESS`, banco `cleaners_dev`), EF Core, connection string nunca commitada (`appsettings.Development.json` local ou user-secrets). Migrations aplicadas até o momento: `InitialCreate`, `AddPasswordHash`, `AddProfessionalAddress`, `AddUserProfileDetails` (adiciona `Number/City/State/ZipCode` em `Users`, e um `PhotoUrl` de arquivo em disco — abordagem já revertida), `ReplaceUserPhotoUrlWithPhotoData` (troca `PhotoUrl` por `PhotoData/PhotoContentType/PhotoUpdatedAt`, foto guardada em bytes no banco), `UpdateBookingAndProfessionalForFreeEstimate` (remove `Booking.ServiceId`, adiciona `Booking.RequestId` + índice único `(UserId, RequestId)`, adiciona os campos de conexão Google em `Professional`, cria a tabela `ProfessionalAvailabilityRules`), `AddServiceCurrency` (adiciona `Service.Currency`, `int NOT NULL DEFAULT 0` = `Currency.BRL`). Fluxo padrão para uma mudança de schema:

```
dotnet ef migrations add <Nome> --project src/CleanersApi.Infrastructure --startup-project src/CleanersApi.Api --output-dir Persistence/Migrations
dotnet ef database update --project src/CleanersApi.Infrastructure --startup-project src/CleanersApi.Api
```

**Pendências conhecidas relevantes ao planejar uma feature do frontend** (ver `TASKS.md` do `cleaners-api` para o plano completo):

- Credenciais reais do Google OAuth ainda não existem neste ambiente — a integração (`GoogleCalendarMcpService`) está implementada de ponta a ponta (OAuth, freebusy, criação/cancelamento de evento), mas não foi testada contra uma agenda Google real. Sem isso configurado, `POST /api/me/calendar-connection/start` e `POST /api/bookings/{id}/confirm` retornam um erro claro (não crasham a API) em vez de funcionar de fato.
- Não existem ainda endpoints de `reviews` (CRUD) — `bookings` já existe por completo (ver tabela de endpoints acima, B17/B18/B22). Escrever uma nova avaliação (T24) e a tela `reviews-received` do `professional-portal` (T30) ainda vão precisar de `POST/GET /api/reviews` dedicado, incluindo a regra "só para `Booking` `Completed` e ainda não avaliado" (B19/B20, não implementada). `services` (CRUD) já existe, ver tabela de endpoints acima (T31/B21).
- Não existe ainda um jeito de marcar um `Booking` como `Completed` (a visita aconteceu) — hoje o enum tem o valor mas nenhum endpoint transiciona pra ele; provavelmente vai ser necessário para desbloquear B19/B20 (review só após conclusão).
- Não existe seed de dados formal (script versionado); os profissionais hoje no banco de dev são registros manuais de teste.

## 2. Stack

- **Nx** como gerenciador do monorepo (build, test, dependency graph, module boundaries).
- **Angular** (última versão estável) com **standalone components** — não usar `NgModule` para features novas.
- **Angular Material + CDK** como base do design system (ver skill [angular-material-ui](.claude/skills/angular-material-ui/SKILL.md)). Componentes de domínio em `libs/shared/ui` envolvem/compõem Material, não recriam do zero o que o Material já resolve (dialog, date-picker, form-field, etc.).
- **Signals** para estado local e derivado (`signal`, `computed`, `effect`). Evitar `BehaviorSubject` como store de estado de UI quando um signal resolve.
- **RxJS** reservado para fluxos assíncronos reais (HTTP, WebSocket/SignalR, eventos contínuos), não como substituto de signals para estado.
- **Change detection**: `OnPush` em todos os componentes.
- **Controle de fluxo em template**: sintaxe nativa (`@if`, `@for`, `@switch`), nunca `*ngIf`/`*ngFor`.
- **PWA**: `client-app` é instalável e funciona offline para navegação básica (`@angular/service-worker`). Ver skill [pwa-shell-and-offline](.claude/skills/pwa-shell-and-offline/SKILL.md). `professional-portal` é responsivo; torná-lo PWA é opcional e não prioritário nesta fase (assunção — revisar se o profissional usar majoritariamente mobile).
- **Tempo real**: atualização de status de agendamento via SignalR (`@microsoft/signalr`), natural por o backend ser .NET — não usar polling como padrão.
- **i18n**: `@jsverse/transloco` (não `@angular/localize`, que é build-time e não permite o usuário trocar de idioma em runtime). Três idiomas suportados: `pt-BR` (padrão), `en`, `es`, com JSON por idioma. Nenhum texto de UI é hardcoded. Ver skill [i18n-multi-language](.claude/skills/i18n-multi-language/SKILL.md).
- **Testes**: Jasmine/Karma (ou Vitest, se adotado) para unitários; Playwright/Cypress para e2e dos fluxos críticos (login → lista → agendamento; login profissional → aceitar agendamento).
- **Estilo**: SCSS por componente + tema Material central, mobile-first.
- **Acessibilidade**: WCAG AA como piso — Material ajuda mas não garante sozinho, especialmente nos cards de profissional e no fluxo de agendamento.
- **Qualidade/tooling**: Prettier + Husky + lint-staged + commitlint (Conventional Commits). Sem ESLint neste projeto — decisão explícita, não lacuna a preencher; module boundaries e demais convenções de código são responsabilidade da revisão (`angular-code-reviewer`, `/review-angular`), não de um linter automatizado. Ver skill [nx-workspace-standards](.claude/skills/nx-workspace-standards/SKILL.md).
- **Contrato com a API**: tipos TypeScript gerados a partir do OpenAPI/Swagger da API .NET (ver seção 6.2) — nunca DTOs escritos manualmente por adivinhação.

## 3. Arquitetura de pastas (dentro de cada app)

```
apps/client-app/src/app/
  core/
    interceptors/
      credentials.interceptor.ts   # garante withCredentials em toda chamada à API
      csrf.interceptor.ts          # anexa header anti-CSRF em requisições mutáveis
      error.interceptor.ts         # normaliza erros HTTP, trata 401 (sessão expirada)
  features/
    professionals-list/            # lista + busca por cidade/nome (geolocalização resolve a cidade inicial)
    professional-detail/           # perfil, serviços, avaliações
    booking/                       # criação de agendamento (cliente)
    reviews/
    user-profile/                  # cadastro/edição de dados de contato
  app.routes.ts

apps/professional-portal/src/app/
  core/
    interceptors/                  # mesma estrutura do client-app
  features/
    availability/                  # gerenciar disponibilidade / conexão de agenda
    incoming-bookings/             # aceitar/recusar/gerenciar agendamentos
    reviews-received/
    professional-profile/
  app.routes.ts
```

Regras:

- Cada feature é standalone e lazy-loaded via rotas (`loadComponent`/`loadChildren`).
- Um componente específico de domínio só fica dentro de `apps/*/features` se **não** for reaproveitável pelo outro app; caso contrário vai para `libs/shared/ui`.
- `core/` de cada app não depende de `features/` do mesmo app.
- Um componente de `libs/shared/ui` (ex.: `star-rating`) não conhece o domínio (`Review`, `Professional`) diretamente; recebe um ViewModel simples via `input()`.

## 4. Padrões de código Angular

- **Naming**: `kebab-case` para arquivos e seletores (`app-professional-card`), `PascalCase` para classes, `camelCase` para métodos/propriedades.
- **Inputs/Outputs**: usar `input()`/`output()` (signal-based) em vez dos decorators `@Input()`/`@Output()` em código novo.
- **Injeção de dependência**: usar `inject()` no corpo da classe em vez de injeção via construtor.
- **Um componente, uma responsabilidade**: se um componente passa de ~200 linhas de template+lógica, considerar quebrar em subcomponentes.
- **Sem lógica de negócio em templates**: cálculos (ex.: distância, média de estrelas) ficam em `computed()` ou em serviços, nunca inline no HTML.
- **UI base**: prefira componentes Angular Material a construir do zero (dialog, form-field, date-picker, snackbar, table). Só construa um componente customizado quando o Material não cobrir o caso.
- **Formulários**: Reactive Forms (`FormGroup`/`FormControl` tipados) integrados a `MatFormField` — nunca template-driven forms.
- **Sem `any`**: TypeScript estrito; todo dado vindo de API tem um tipo gerado a partir do OpenAPI (seção 6.2) ou uma interface em `libs/shared/models`.
- **Nx module boundaries**: respeitar as tags/regras da skill [nx-workspace-standards](.claude/skills/nx-workspace-standards/SKILL.md); não há enforcement automatizado (sem ESLint) — uma violação de boundary é pego na revisão (`angular-code-reviewer`/`/review-angular`), não por uma ferramenta, então tratar com o mesmo rigor de um erro bloqueante.
- **Sem texto hardcoded**: todo texto visível ao usuário (label, botão, mensagem de erro, `aria-label`) vem de uma chave de tradução via `transloco` — nunca uma string literal no template ou no `.ts`. Ver skill [i18n-multi-language](.claude/skills/i18n-multi-language/SKILL.md).

## 5. Funcionalidades específicas do domínio

### 5.1 Lista de profissionais (cards) — `client-app`

- Busca inicial pela cidade do usuário: geolocalização via `navigator.geolocation` (com fallback manual de lat/lng) resolvida para uma cidade por geocoding reverso client-side (`ReverseGeocodingService`, Nominatim/OpenStreetMap); essa cidade é enviada ao backend como termo de busca (seção 6, `ProfessionalsService.search`).
- Cada card exibe: foto, nome, lista de serviços, nota média em estrelas, distância aproximada, selo de destaque se aplicável.
- Ver skill [professional-list-card](.claude/skills/professional-list-card/SKILL.md).

### 5.2 Avaliações e estrelas — compartilhado (`libs/shared/ui`)

- Nota é sempre derivada (`computed`) da lista de `reviews`, nunca armazenada como campo editável solto no `Professional`.
- Componente de estrelas é genérico e reutilizável entre os dois apps (exibição no `client-app`/`professional-portal`, e input de nota pelo usuário no `client-app`).
- Ver skill [star-rating-reviews](.claude/skills/star-rating-reviews/SKILL.md).

### 5.3 Agendamento via Google Agenda (MCP) — dividido entre os dois apps

- **Decisão registrada**: o `Booking` criado pelo `User` é uma **visita de estimativa gratuita (free estimate)** — não referencia um `Service`/preço específico. O profissional visita o local, avalia o serviço a fazer e informa o preço pessoalmente; o `Booking` em si é só o agendamento do horário da visita.
- **Decisão registrada**: só o `Professional` conecta a própria Google Agenda nesta fase (tokens OAuth isolados por conta, criptografados e geridos inteiramente pelo backend .NET — nunca pelo Angular). O `User` não tem esse conceito hoje, nem no domínio (`Professional.HasConnectedCalendar`/tokens) nem no frontend (só `professional-portal`/`availability` chama `connectionStatus`/`startConnection`).
- `client-app` (feature `booking`): consulta disponibilidade do profissional (`GET /api/professionals/{id}/availability`) e cria o `Booking` (`POST /api/bookings`), sem selecionar um serviço.
- `professional-portal` (feature `availability` + `incoming-bookings`): conecta a agenda, define regras semanais de disponibilidade e aceita/recusa/gerencia agendamentos recebidos.
- Após a confirmação, o status do `Booking` é propagado em tempo real via SignalR (`BookingsHub`, `/hubs/bookings`) para os dois apps (ver seção 2 e skill de agendamento).
- Após o `Booking` ser confirmado, o disparo de contato (telefonema/mensagem) usa o telefone cadastrado no perfil do `User`, exposto ao profissional via `BookingDto.CustomerContact` só a partir da confirmação — nunca expor esse dado em cards públicos nem antes disso.
- Ver skill [google-calendar-mcp-scheduling](.claude/skills/google-calendar-mcp-scheduling/SKILL.md) e o agente [calendar-mcp-integrator](.claude/agents/calendar-mcp-integrator.md).

### 5.4 Dados sensíveis

- Telefone, endereço exato e histórico de agendamento são dados sensíveis: nunca logar em console/analytics, nunca serializar em query params, mascarar em telas que não sejam do próprio usuário ou do profissional após confirmação do agendamento.

## 6. Camada de serviços/API

Ver skill [angular-service-http-layer](.claude/skills/angular-service-http-layer/SKILL.md). Resumo:

- Um service por agregado de domínio (`ProfessionalsService`, `BookingsService`, `ReviewsService`, `CalendarMcpService`) em `libs/shared/data-access`, reaproveitado pelos dois apps.
- Serviços retornam `Observable<T>` tipado; conversão para signal (`toSignal`) acontece no componente/facade, não dentro do service.
- Sem chamadas HTTP diretamente em componentes.

### 6.1 Autenticação: cookie httpOnly, não Bearer manual

O JWT emitido pela API .NET é entregue como cookie `httpOnly` + `Secure` + `SameSite` no login. Consequências para o Angular:

- **Nenhum código Angular lê, guarda ou anexa o token manualmente** — não há acesso via `document.cookie` (é `httpOnly` de propósito) nem armazenamento em `localStorage`/`sessionStorage`.
- Toda chamada à API é feita com `withCredentials: true` (garantido por `core/interceptors/credentials.interceptor.ts`), para o navegador enviar o cookie automaticamente.
- O estado "estou logado" nunca é inferido localmente (ex.: "existe um token?"). Ele é obtido chamando um endpoint `GET /me` no bootstrap da aplicação; sucesso = sessão válida, `401` = deslogado. Isso fica encapsulado no `SessionStore` (`libs/shared/auth`), ver skill [angular-signals-state](.claude/skills/angular-signals-state/SKILL.md).
- Requisições que mutam estado (`POST`/`PUT`/`PATCH`/`DELETE`) levam um header anti-CSRF (`csrf.interceptor.ts`), já que cookie `httpOnly` sozinho não protege contra CSRF — o valor desse header vem de um endpoint/cookie não-httpOnly dedicado a isso, definido pelo backend.
- Logout chama um endpoint da API que invalida a sessão e limpa o cookie no servidor — o Angular não "apaga um token local" porque não tem acesso a ele.
- CORS: a API .NET precisa permitir explicitamente as origens de `client-app` e `professional-portal` com `Access-Control-Allow-Credentials: true` (nunca `*` combinado com credentials).

### 6.2 Contrato com a API

- Os tipos TypeScript consumidos pelos services em `libs/shared/data-access` são **gerados a partir do OpenAPI/Swagger** exposto pela API .NET (ex.: `openapi-typescript` ou `NSwag`), não escritos manualmente por adivinhação de shape.
- Regenerar os tipos é um passo explícito (script `nx run api-types:generate` ou equivalente) sempre que o contrato do backend mudar — nunca editar os tipos gerados à mão.
- Os `models/` de domínio em `libs/shared/models` podem diferir levemente dos DTOs gerados (são a forma "de UI"); o mapeamento DTO → model de domínio acontece explicitamente no service, nunca implícito.

## 7. Estado

Ver skill [angular-signals-state](.claude/skills/angular-signals-state/SKILL.md). Resumo:

- Estado de feature em um `*.store.ts` baseado em signals, injetável no escopo da rota da feature (não global, salvo sessão/localização/idioma).
- Estado global mínimo por app: sessão do usuário autenticado (via `/me`, seção 6.1), localização atual e idioma ativo (`LanguageStore`, `libs/shared/i18n`, ver skill [i18n-multi-language](.claude/skills/i18n-multi-language/SKILL.md)).
- `client-app` e `professional-portal` têm cada um sua própria instância de `SessionStore` e `LanguageStore` — não há estado compartilhado em runtime entre os dois apps (são processos de browser separados).

## 8. Agentes disponíveis (.claude/agents)

| Agente                                                                       | Quando usar                                                                                                                                       |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [angular-component-architect](.claude/agents/angular-component-architect.md) | Criar ou refatorar componentes/features Angular seguindo os padrões deste arquivo, incluindo boundaries Nx e uso de Material.                     |
| [angular-code-reviewer](.claude/agents/angular-code-reviewer.md)             | Revisar um diff/PR Angular quanto a aderência a estes padrões (não é revisão geral de segurança).                                                 |
| [calendar-mcp-integrator](.claude/agents/calendar-mcp-integrator.md)         | Desenhar ou revisar a integração de agendamento via MCP com Google Agenda, incluindo o fluxo dividido entre `client-app` e `professional-portal`. |

## 9. Comandos disponíveis (.claude/commands)

| Comando                               | Uso                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/new-component <nome> [app\|shared]` | Gera um standalone component seguindo o padrão do projeto, no app certo ou em `libs/shared/ui`. |
| `/new-service <nome>`                 | Gera um service HTTP em `libs/shared/data-access` seguindo o padrão de camada de serviços.      |
| `/new-feature <nome> <app>`           | Gera a estrutura completa de uma feature dentro de `client-app` ou `professional-portal`.       |
| `/new-lib <nome> <tipo>`              | Gera uma lib Nx nova (`ui`, `data-access`, `util`, `models`) com as tags/boundaries corretas.   |
| `/review-angular`                     | Roda o checklist de revisão Angular deste projeto sobre as mudanças atuais.                     |

## 10. Qualidade e definição de pronto

Uma mudança só é considerada pronta quando:

- Segue a arquitetura de pastas/libs da seção 3 e os module boundaries do Nx (seção 4).
- Não introduz `NgModule`, `*ngIf`/`*ngFor`, `@Input()`/`@Output()` decorators, `any`, `localStorage`/`document.cookie` para auth, ou chamada HTTP sem `withCredentials`.
- Reaproveita componentes Angular Material em vez de recriá-los, salvo justificativa.
- Não introduz texto de UI hardcoded — toda chave nova existe nos três idiomas (`pt-BR`, `en`, `es`), ver skill [i18n-multi-language](.claude/skills/i18n-multi-language/SKILL.md).
- Tem teste unitário para lógica não trivial (cálculo de distância, média de estrelas, regras de agendamento).
- Não expõe dados sensíveis (seção 5.4) fora do contexto permitido.
- Passa `nx test`/`nx affected --target=test` sem novas falhas, incluindo formatação via Prettier e as regras de commit (Conventional Commits via commitlint). Não há `nx lint` neste projeto (ver seção 2).
