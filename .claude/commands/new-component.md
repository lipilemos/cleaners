---
description: Gera um novo standalone component Angular seguindo os padrões do CleanersApp
---

Crie um novo componente Angular chamado `$ARGUMENTS` (primeiro argumento é o nome em kebab-case, segundo argumento opcional é `client-app`, `professional-portal` ou `shared`, terceiro argumento opcional é a feature de destino dentro do app, ex.: `professional-card shared` ou `booking-form client-app booking`).

Siga rigorosamente as skills `angular-component-standard`, `angular-material-ui` e `nx-workspace-standards` (`.claude/skills/`) e o `CLAUDE.md` da raiz:

1. Determine o app/lib correto:
   - Se `shared` foi passado, ou nenhum app foi passado e o componente é genérico/reutilizável entre `client-app` e `professional-portal` (ex.: rating, card, badge), coloque em `libs/shared/ui/<nome>/`.
   - Se `client-app` ou `professional-portal` foi passado com uma feature, coloque em `apps/<app>/src/app/features/<feature>/<nome>/`.
   - Se já existir uma pasta correspondente, pergunte antes de sobrescrever.
   - Em caso de dúvida sobre app vs. shared, pergunte antes de gerar — duplicar o mesmo componente nos dois apps é uma violação do padrão.
2. Gere os arquivos via `nx g @nx/angular:component` no projeto correto, depois ajuste ao padrão (o generator pode gerar `@Input()` em algumas configs — corrija).
3. Aplique todas as regras obrigatórias da skill `angular-component-standard`: `standalone: true`, `ChangeDetectionStrategy.OnPush`, `input()`/`output()`, `inject()`, controle de fluxo nativo (`@if`/`@for` com `track`) no template.
4. Prefira compor com componentes Angular Material (ver skill `angular-material-ui`) em vez de construir do zero.
5. Se o componente representa uma entidade de domínio (profissional, avaliação, agendamento), verifique se já existe um tipo correspondente em `libs/shared/models`; se não existir, crie-o lá, não inline no componente.
6. Escreva um teste unitário mínimo cobrindo renderização e qualquer `computed()`/`output()` exposto.
7. Ao final, rode o checklist da skill e reporte quaisquer itens que não puderam ser atendidos e por quê.

Se o workspace Nx ainda não existir (`apps/`/`libs/` ausentes), avise o usuário e não prossiga — este comando assume que o workspace já foi criado (`npx create-nx-workspace`).
