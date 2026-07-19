---
name: nx-workspace-standards
description: Use ao criar uma nova lib/app no monorepo Nx do CleanersApp, ao configurar tooling (lint, format, commits, CI), ou ao decidir onde um arquivo deve morar entre apps/client-app, apps/professional-portal e libs/shared/*. Cobre module boundaries, convenção de tags e o pipeline mínimo de qualidade.
---

# Padrões do workspace Nx

## Estrutura

```
apps/
  client-app/            # PWA do usuário final (marketplace)
  professional-portal/    # portal do profissional
libs/
  shared/
    ui/                   # design system (wrappers sobre Angular Material)
    data-access/           # services HTTP por agregado, consumidos pelos dois apps
    models/                 # interfaces de domínio
    auth/                    # SessionStore, guards de rota, tipos de sessão
    util/                     # funções puras (cálculo de distância, formatação, etc.)
```

Não crie uma lib nova para algo usado por um único app — isso fica dentro do próprio app em `features/`. Uma lib só se justifica quando: (a) é reaproveitada pelos dois apps, ou (b) isola uma responsabilidade que vale a pena testar/versionar separadamente mesmo com um único consumidor (ex.: `models`).

## Tags e module boundaries

Cada projeto Nx (app ou lib) declara tags em `project.json`:

- `scope:client` | `scope:professional` | `scope:shared`
- `type:app` | `type:feature` | `type:ui` | `type:data-access` | `type:util` | `type:models` | `type:auth`

Regra de ESLint (`@nx/enforce-module-boundaries`) a manter configurada em `.eslintrc.json` na raiz:

- `scope:shared` nunca depende de `scope:client` ou `scope:professional`.
- `type:ui` não depende de `type:data-access` (componentes de apresentação não fazem HTTP).
- `type:data-access` não depende de `type:ui`.
- `type:util` e `type:models` não dependem de nada além de outras libs `type:util`/`type:models`.
- Apps (`type:app`) podem depender de qualquer lib `scope:shared`, mas nenhuma lib depende de um app.

Uma violação de boundary é **erro de lint**, não aviso — tratar como bloqueante em qualquer revisão (ver agente `angular-code-reviewer`).

## Tooling obrigatório

- **ESLint** (`@nx/eslint-plugin` + regras Angular) — inclui a regra de module boundaries acima.
- **Prettier** com config única na raiz do workspace, aplicada a todos os projetos (sem config divergente por app).
- **Husky + lint-staged**: hook de `pre-commit` rodando lint+format apenas nos arquivos staged.
- **commitlint** com Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`) — hook de `commit-msg`.
- Rodar tudo via `nx affected` (`nx affected --target=lint`, `nx affected --target=test`) em vez de rodar em todo o workspace a cada commit, para manter o ciclo rápido.

## CI mínimo (GitHub Actions)

Pipeline mínimo antes de permitir merge:

1. `nx affected --target=lint`
2. `nx affected --target=test`
3. `nx affected --target=build`
4. (opcional, quando e2e existir) `nx affected --target=e2e`

Usar `nx affected` com base no commit de merge da branch alvo, não rodar os quatro apps/libs inteiros a cada PR pequeno.

## Ambientes

Cada app tem seus próprios arquivos de ambiente (`apps/<app>/src/environments/environment.ts` e `environment.prod.ts`) contendo, no mínimo: URL base da API .NET e chave/config de mapas (se usada). Nenhuma URL de API ou chave é hardcoded fora desses arquivos.

## Geração de artefatos

Sempre gere apps/libs via `nx g @nx/angular:application` / `nx g @nx/angular:library` (com as flags de standalone e as tags corretas), depois ajuste aos padrões deste guia — não crie a estrutura de pastas manualmente por fora do generator, para manter `project.json`/`tsconfig` consistentes com o resto do workspace.
