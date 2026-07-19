---
description: Gera um novo service Angular (camada HTTP) seguindo os padrões do CleanersApp
---

Crie um novo service Angular chamado `$ARGUMENTS` (primeiro argumento é o nome em kebab-case sem o sufixo `.service`; se o service é específico de infraestrutura de um único app em vez de um agregado de domínio compartilhado, passe o app como segundo argumento, ex.: `pwa-install client-app`).

Siga rigorosamente a skill `angular-service-http-layer` (`.claude/skills/angular-service-http-layer/SKILL.md`) e o `CLAUDE.md` da raiz:

1. Determine o local:
   - Agregado de domínio consumido pela API .NET (profissionais, avaliações, agendamento, usuário) → `libs/shared/data-access/<nome>.service.ts`, mesmo que só um app o use hoje — é o padrão para tudo que fala com a API.
   - Infraestrutura específica de um único app (ex.: `GeolocationService` só faz sentido no `client-app`, `PwaInstallService` idem) → `apps/<app>/src/app/core/<nome>.service.ts`.
2. `@Injectable({ providedIn: 'root' })` salvo justificativa explícita para escopo diferente.
3. Todo método público retorna `Observable<T>` com `T` vindo de `libs/shared/models` — nunca `any`. O DTO bruto da API vem de um tipo gerado do OpenAPI (seção 6.2 do CLAUDE.md); o mapeamento DTO → model é explícito dentro do service. Se o model não existir ainda, crie-o.
4. Nomeie métodos seguindo a convenção da skill (`getX`, `getXById`, `createX`, ou verbo de negócio explícito como `confirmBooking`).
5. Nunca leia cookies/token manualmente nem monte um header `Authorization` — a sessão é por cookie `httpOnly` enviado automaticamente via `withCredentials` (interceptor central). Não implemente tratamento de erro genérico dentro do service — isso é responsabilidade dos interceptors centrais (`credentials.interceptor.ts`, `csrf.interceptor.ts`, `error.interceptor.ts`). Use `catchError` apenas para fallback específico de domínio, se aplicável.
6. Gere `<nome>.service.spec.ts` usando `provideHttpClientTesting`/`HttpTestingController`, cobrindo cada método público: URL, params/body esperados e o mapeamento DTO → model.

Se a integração envolver Google Agenda/MCP ou o `Booking`, use a skill `google-calendar-mcp-scheduling` em vez desta, e considere delegar ao agente `calendar-mcp-integrator` para decisões de arquitetura.
