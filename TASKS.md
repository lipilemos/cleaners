# CleanersApp — Plano de Tarefas (Frontend)

Tarefas do monorepo Nx/Angular (`apps/client-app`, `apps/professional-portal`, `libs/shared/*`), ordenadas por execução. Prioridade: **P0** (bloqueante, sem isso nada mais funciona) → **P2** (pode esperar). "Depende de" lista os IDs que precisam estar concluídos antes.

O backend (.NET) tem seu próprio plano e repositório — ver referência na seção 1.1 do [CLAUDE.md](CLAUDE.md). Tarefas marcadas com 🔗 **API** precisam do endpoint correspondente já existir (ou de um mock/stub) para serem finalizadas ponta a ponta.

## Fase 0 — Fundação do workspace

| ID | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| T01 | Criar workspace Nx (`npx create-nx-workspace`) com os dois apps (`client-app`, `professional-portal`) e preset Angular standalone | P0 | — |
| T02 | Configurar libs vazias com tags corretas: `libs/shared/{ui,data-access,models,auth,util,i18n}` (skill `nx-workspace-standards`) | P0 | T01 |
| T03 | Configurar ESLint (module boundaries por tag), Prettier, Husky + lint-staged, commitlint (Conventional Commits) | P0 | T01 |
| T04 | Configurar tema Angular Material central + integração SCSS (skill `angular-material-ui`) | P0 | T01 |
| T05 | Configurar Transloco (`libs/shared/i18n`) com `pt-BR`/`en`/`es` e `LanguageStore` base (skill `i18n-multi-language`) | P0 | T02 |
| T06 | Configurar pipeline mínimo de CI (lint + test dos afetados via `nx affected`) | P1 | T03 |
| T07 | Gerar tipos TypeScript a partir do OpenAPI da API .NET (script `api-types:generate`) — 🔗 **API** precisa expor `/swagger` | P0 | T01 |

## Fase 1 — Modelos e camada de dados compartilhada

| ID | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| T08 | Definir interfaces de domínio em `libs/shared/models`: `User`, `Professional`, `Service`, `Review`, `Booking` | P0 | T02 |
| T09 | `SessionStore` em `libs/shared/auth` (bootstrap via `GET /me`, signals) — 🔗 **API** `/me`, `/login`, `/logout` | P0 | T08 |
| T10 | Interceptors `core/interceptors`: `credentials.interceptor.ts`, `csrf.interceptor.ts`, `error.interceptor.ts` (replicados nos dois apps) | P0 | T09 |
| T11 | `ProfessionalsService` em `libs/shared/data-access` — 🔗 **API** `GET /professionals?lat&lng` | P0 | T07, T08 |
| T12 | `ReviewsService` em `libs/shared/data-access` — 🔗 **API** `GET/POST /reviews` | P1 | T07, T08 |
| T13 | `BookingsService` em `libs/shared/data-access` — 🔗 **API** `GET/POST /bookings` | P0 | T07, T08 |
| T14 | `CalendarMcpService` em `libs/shared/data-access` (conexão de agenda, disponibilidade) — 🔗 **API** endpoints MCP | P1 | T07, T08 |

## Fase 2 — Design system compartilhado (`libs/shared/ui`)

| ID | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| T15 | Componente `star-rating` genérico (exibição + input), nota derivada de `reviews[]` (skill `star-rating-reviews`) | P0 | T04, T08 |
| T16 | Componente `professional-card` (foto, serviços, nota, distância, selo) — recebe ViewModel via `input()` (skill `professional-list-card`) | P0 | T04, T15 |
| T17 | Componentes de formulário reutilizáveis (wrappers `MatFormField` para endereço/telefone/etc.) | P1 | T04 |

## Fase 3 — Autenticação e sessão (ambos os apps)

| ID | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| T18 | Tela de login `client-app` (usuário) — 🔗 **API** `/login` | P0 | T09, T10 |
| T19 | Tela de login `professional-portal` (profissional, login separado) — 🔗 **API** `/login` (escopo profissional) | P0 | T09, T10 |
| T20 | Guards de rota autenticadas em `libs/shared/auth` (redirect se `/me` falhar) | P0 | T18, T19 |

## Fase 4 — `client-app`: fluxo principal do usuário

| ID | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| T21 | Feature `professionals-list`: busca por geolocalização + fallback manual de endereço, ordenação por proximidade | P0 | T11, T16, T20 |
| T22 | Feature `professional-detail`: perfil, serviços, lista de avaliações | P0 | T11, T12, T15 |
| T23 | Feature `booking` (cliente): consulta disponibilidade e cria `Booking` (skill `google-calendar-mcp-scheduling`) | P0 | T13, T14, T22 |
| T24 | Feature `reviews` (cliente): avaliar profissional após serviço concluído | P1 | T12, T23 |
| T25 | Feature `user-profile`: cadastro/edição de dados de contato (telefone, endereço) — atenção a dados sensíveis (seção 5.4) | P1 | T20 |
| T26 | Atualização em tempo real do status de `Booking` via SignalR no `client-app` | P1 | T23 |

## Fase 5 — `professional-portal`: fluxo do profissional

| ID | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| T27 | Feature `availability`: conectar Google Agenda + definir regras de disponibilidade (agente `calendar-mcp-integrator`) | P0 | T14, T20 |
| T28 | Feature `incoming-bookings`: listar, aceitar/recusar agendamentos | P0 | T13, T27 |
| T29 | Disparo de contato pós-confirmação (telefone do `User`, nunca exposto antes) — 🔗 **API** endpoint dedicado | P0 | T28 |
| T30 | Feature `reviews-received`: histórico de avaliações recebidas | P2 | T12, T20 |
| T31 | Feature `professional-profile`: gerenciar serviços oferecidos (`Service[]`) | P1 | T20 |
| T32 | Atualização em tempo real de novos pedidos de agendamento via SignalR no `professional-portal` | P1 | T28 |

## Fase 6 — Qualidade, PWA e acessibilidade

| ID | Tarefa | Prioridade | Depende de |
|---|---|---|---|
| T33 | Testes unitários para lógica não trivial (distância, média de estrelas, regras de agendamento) | P0 | T21, T23, T27, T28 |
| T34 | Configurar PWA do `client-app` (manifest, service worker, shell offline) (skill `pwa-shell-and-offline`) | P2 | T21 |
| T35 | Auditoria de acessibilidade WCAG AA nos cards e no fluxo de agendamento | P1 | T21, T23 |
| T36 | E2E críticos (Playwright/Cypress): login → lista → agendamento; login profissional → aceitar agendamento | P1 | T23, T28 |
| T37 | Revisão final com `/review-angular` e `angular-code-reviewer` antes de cada release | P0 | contínuo |

## Ordem sugerida de execução

```
T01 → T02 → (T03, T04, T05, T07 em paralelo) → T06
T08 → T09 → T10
T07 + T08 → T11, T12, T13, T14
T04 + T08 → T15 → T16, T17
T09+T10 → T18, T19 → T20
T20 + T11 + T16 → T21 → T22 → T23 → T24
T20 → T25
T23 → T26
T14 + T20 → T27 → T28 → T29
T20 → T30, T31
T28 → T32
(T21, T23, T27, T28) → T33 → T37
T21 → T34
(T21, T23) → T35
(T23, T28) → T36
```

Itens marcados 🔗 **API** bloqueiam a finalização ponta a ponta, mas a tarefa de frontend pode começar em paralelo com mocks/stubs enquanto o backend correspondente é implementado no repositório `cleaners-api` (ver [CLAUDE.md](CLAUDE.md) seção 1.1).
