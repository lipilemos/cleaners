# CleanersApp — Guia de Desenvolvimento

Este arquivo direciona qualquer trabalho feito neste repositório com Claude Code. Ele descreve o domínio do produto, a stack, a arquitetura esperada e os padrões de código Angular que **devem** ser seguidos. Os agentes, skills e comandos referenciados aqui vivem em [.claude/agents](.claude/agents), [.claude/skills](.claude/skills) e [.claude/commands](.claude/commands).

> Estado atual: este repositório contém apenas os padrões de desenvolvimento (.claude/) e este CLAUDE.md. O workspace Nx/Angular ainda não foi criado. Ao iniciar o projeto (`npx create-nx-workspace`), mantenha as convenções descritas abaixo.

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

| Entidade | Descrição |
|---|---|
| `User` | Cliente que contrata o serviço. Possui dados de contato (telefone, endereço/geolocalização). |
| `Professional` | Prestador de serviço de limpeza. Possui `services[]`, `rating`, `reviews[]`, localização, e uma agenda conectada. |
| `Service` | Um tipo de serviço oferecido por um profissional (ex.: limpeza residencial, pós-obra, passadoria). |
| `Review` | Avaliação de um `User` sobre um `Professional` após um serviço concluído (nota 1–5 + comentário). |
| `Booking` | Agendamento entre `User` e `Professional`, vinculado a um evento no Google Agenda do profissional. |

## 1.1 Arquitetura geral: este repositório é o frontend (monorepo Nx)

Este repositório contém **apenas o frontend**. Toda regra de negócio, persistência e autenticação vivem em uma **API separada, em repositório próprio**:

- **Backend**: .NET Core (C#), em outro repositório (não neste).
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

Regras de dependência (ver skill [nx-workspace-standards](.claude/skills/nx-workspace-standards/SKILL.md) para a configuração de boundaries via ESLint/tags):

- `apps/*` pode depender de `libs/shared/*`. `libs/shared/*` **nunca** depende de `apps/*`.
- `libs/shared/ui` não depende de `libs/shared/data-access` (componentes de UI não fazem HTTP).
- `libs/shared/data-access` não depende de `libs/shared/ui`.
- Nenhuma lib importa código específico de um app.
- Assumido por padrão, sinalize se não for o caso: os dois apps autenticam de forma **independente** (login separado para `User` e para `Professional`) — não há SSO entre eles nesta fase.

## 2. Stack

- **Nx** como gerenciador do monorepo (build, lint, test, dependency graph, module boundaries).
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
- **Qualidade/tooling**: ESLint + Prettier + Husky + lint-staged + commitlint (Conventional Commits). Ver skill [nx-workspace-standards](.claude/skills/nx-workspace-standards/SKILL.md).
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
    professionals-list/            # lista + busca por proximidade
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
- **Nx module boundaries**: respeitar as tags/regras da skill [nx-workspace-standards](.claude/skills/nx-workspace-standards/SKILL.md); um `nx lint`/`nx graph` com violação de boundary é tratado como erro, não como aviso.
- **Sem texto hardcoded**: todo texto visível ao usuário (label, botão, mensagem de erro, `aria-label`) vem de uma chave de tradução via `transloco` — nunca uma string literal no template ou no `.ts`. Ver skill [i18n-multi-language](.claude/skills/i18n-multi-language/SKILL.md).

## 5. Funcionalidades específicas do domínio

### 5.1 Lista de profissionais (cards) — `client-app`
- Ordenação padrão por proximidade (geolocalização do usuário via `navigator.geolocation`, com fallback manual de endereço).
- Cada card exibe: foto, nome, lista de serviços, nota média em estrelas, distância aproximada, selo de destaque se aplicável.
- Ver skill [professional-list-card](.claude/skills/professional-list-card/SKILL.md).

### 5.2 Avaliações e estrelas — compartilhado (`libs/shared/ui`)
- Nota é sempre derivada (`computed`) da lista de `reviews`, nunca armazenada como campo editável solto no `Professional`.
- Componente de estrelas é genérico e reutilizável entre os dois apps (exibição no `client-app`/`professional-portal`, e input de nota pelo usuário no `client-app`).
- Ver skill [star-rating-reviews](.claude/skills/star-rating-reviews/SKILL.md).

### 5.3 Agendamento via Google Agenda (MCP) — dividido entre os dois apps
- Cada usuário (tanto `User` quanto `Professional`) conecta sua própria Google Agenda, de forma independente (tokens OAuth isolados por conta, geridos inteiramente pelo backend .NET via MCP — nunca pelo Angular).
- `client-app` (feature `booking`): consulta disponibilidade do profissional e cria o `Booking`.
- `professional-portal` (feature `availability` + `incoming-bookings`): conecta a agenda, define regras de disponibilidade e aceita/recusa/gerencia agendamentos recebidos.
- Após a confirmação, o status do `Booking` é propagado em tempo real via SignalR para os dois apps (ver seção 2 e skill de agendamento).
- Após o `Booking` ser confirmado, o disparo de contato (telefonema/mensagem) usa o telefone cadastrado no perfil do `User` — nunca expor esse dado em cards públicos, apenas ao profissional após a confirmação.
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

| Agente | Quando usar |
|---|---|
| [angular-component-architect](.claude/agents/angular-component-architect.md) | Criar ou refatorar componentes/features Angular seguindo os padrões deste arquivo, incluindo boundaries Nx e uso de Material. |
| [angular-code-reviewer](.claude/agents/angular-code-reviewer.md) | Revisar um diff/PR Angular quanto a aderência a estes padrões (não é revisão geral de segurança). |
| [calendar-mcp-integrator](.claude/agents/calendar-mcp-integrator.md) | Desenhar ou revisar a integração de agendamento via MCP com Google Agenda, incluindo o fluxo dividido entre `client-app` e `professional-portal`. |

## 9. Comandos disponíveis (.claude/commands)

| Comando | Uso |
|---|---|
| `/new-component <nome> [app\|shared]` | Gera um standalone component seguindo o padrão do projeto, no app certo ou em `libs/shared/ui`. |
| `/new-service <nome>` | Gera um service HTTP em `libs/shared/data-access` seguindo o padrão de camada de serviços. |
| `/new-feature <nome> <app>` | Gera a estrutura completa de uma feature dentro de `client-app` ou `professional-portal`. |
| `/new-lib <nome> <tipo>` | Gera uma lib Nx nova (`ui`, `data-access`, `util`, `models`) com as tags/boundaries corretas. |
| `/review-angular` | Roda o checklist de revisão Angular deste projeto sobre as mudanças atuais. |

## 10. Qualidade e definição de pronto

Uma mudança só é considerada pronta quando:
- Segue a arquitetura de pastas/libs da seção 3 e os module boundaries do Nx (seção 4).
- Não introduz `NgModule`, `*ngIf`/`*ngFor`, `@Input()`/`@Output()` decorators, `any`, `localStorage`/`document.cookie` para auth, ou chamada HTTP sem `withCredentials`.
- Reaproveita componentes Angular Material em vez de recriá-los, salvo justificativa.
- Não introduz texto de UI hardcoded — toda chave nova existe nos três idiomas (`pt-BR`, `en`, `es`), ver skill [i18n-multi-language](.claude/skills/i18n-multi-language/SKILL.md).
- Tem teste unitário para lógica não trivial (cálculo de distância, média de estrelas, regras de agendamento).
- Não expõe dados sensíveis (seção 5.4) fora do contexto permitido.
- Passa `nx lint`, `nx test` e `nx run-many --target=lint --target=test` (afetados) sem novos warnings, incluindo Prettier e as regras de commit (Conventional Commits via commitlint).
