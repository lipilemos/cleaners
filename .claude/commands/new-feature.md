---
description: Gera a estrutura completa de uma feature Angular (rotas, componente, service, store, testes) dentro de um dos dois apps do CleanersApp
---

Crie a estrutura completa de uma nova feature chamada `$ARGUMENTS` (primeiro argumento o nome em kebab-case, segundo argumento obrigatório o app de destino: `client-app` ou `professional-portal`) em `apps/<app>/src/app/features/<nome>/`.

Se o app não for informado, pergunte antes de gerar — não assuma, já que as features de `client-app` (descoberta, agendamento, avaliação) e `professional-portal` (disponibilidade, pedidos recebidos) são bem diferentes (ver CLAUDE.md seção 1.2).

Antes de gerar qualquer arquivo, leia `CLAUDE.md` na raiz (seções 1.2, 3, 4, 6 e 7) e as skills: `angular-component-standard`, `angular-service-http-layer`, `angular-signals-state`, `nx-workspace-standards`.

Estrutura a criar:

```
apps/<app>/src/app/features/<nome>/
  <nome>.routes.ts            # rotas standalone da feature (loadComponent)
  <nome>.component.ts         # componente container principal
  <nome>.component.html
  <nome>.component.scss
  <nome>.component.spec.ts
  <nome>.store.ts             # estado da feature via signals, se houver estado compartilhado entre componentes da feature
  <nome>.store.spec.ts
```

Regras:

1. Rotas: standalone, usando `loadComponent` para lazy loading. Registre a feature no roteador do app (`app.routes.ts`) apontando para `<nome>.routes.ts`, sem criar `NgModule`.
2. Componente container segue a skill `angular-component-standard` (OnPush, `input()`/`output()`, `inject()`, controle de fluxo nativo, componentes Angular Material como base).
3. **Não** crie um service dentro da feature — se ela fala com a API, use um service já existente em `libs/shared/data-access` ou gere um novo lá com `/new-service` antes.
4. Store segue a skill `angular-signals-state` — só crie se houver estado a compartilhar entre mais de um componente da feature; para uma feature com um único componente simples, estado local no próprio componente é suficiente (não crie store desnecessário).
5. Toda entidade de domínio nova usada pela feature ganha um tipo em `libs/shared/models`, não interfaces locais duplicadas dentro da feature.
6. Gere testes mínimos para componente e store conforme aplicável.
7. Se a feature envolver agendamento/Google Agenda (`booking`, `availability`, `incoming-bookings`), use também a skill `google-calendar-mcp-scheduling` e considere envolver o agente `calendar-mcp-integrator` para as decisões de integração, incluindo a propagação de status via SignalR.

Ao final, rode a checklist da seção 10 do `CLAUDE.md` ("Qualidade e definição de pronto") sobre os arquivos criados e reporte o resultado.
