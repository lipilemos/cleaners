---
description: Roda o checklist de revisão de padrões Angular do CleanersApp sobre as mudanças atuais (working tree ou PR)
---

Revise as mudanças Angular atuais do repositório contra os padrões definidos em `CLAUDE.md` e as skills em `.claude/skills/`.

Passos:

1. Rode `git status` e `git diff` (ou `git diff <base>...HEAD` se `$ARGUMENTS` indicar uma branch/PR) para identificar os arquivos `.ts`/`.html`/`.scss` alterados; opcionalmente `nx show projects --affected` para saber quais apps/libs foram tocados.
2. Delegue a análise detalhada ao agente `angular-code-reviewer`, passando a lista de arquivos/projetos alterados como contexto.
3. Consolide o retorno do agente em um relatório com dois blocos: **Bloqueante** (viola regra não-negociável do CLAUDE.md, ex.: `NgModule`, `@Input()` decorator, violação de module boundary do Nx, acesso manual a cookie/token para auth, exposição de dado sensível) e **Sugestão** (estilo/legibilidade), cada item com `arquivo:linha`.
4. Se não houver arquivos alterados, informe isso e não invente achados.

Não corrija o código automaticamente neste comando — apenas reporte. Para aplicar correções, peça explicitamente ou use o agente `angular-component-architect` em seguida.
