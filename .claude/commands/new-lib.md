---
description: Gera uma nova lib Nx dentro de libs/shared/* com as tags/boundaries corretas
---

Crie uma nova lib Nx chamada `$ARGUMENTS` (primeiro argumento o nome em kebab-case, segundo argumento o tipo: `ui`, `data-access`, `models`, `auth` ou `util`).

Siga a skill `nx-workspace-standards` (`.claude/skills/nx-workspace-standards/SKILL.md`) e o `CLAUDE.md` da raiz (seção 1.2):

1. Confirme que a lib realmente se justifica: só crie uma lib nova quando o conteúdo for reaproveitado por `client-app` e `professional-portal`, ou quando isolar uma responsabilidade que vale a pena versionar/testar separadamente (ex.: `models`). Se for específico de um único app, oriente a usar `/new-component` ou `/new-service` dentro do próprio app em vez de criar uma lib.
2. Gere via `nx g @nx/angular:library libs/shared/<nome> --tags=scope:shared,type:<tipo>` (ajustando o generator conforme o tipo — `ui` gera lib com suporte a componentes standalone, `data-access`/`util`/`models` podem ser libs mais simples sem Angular runtime quando fizer sentido).
3. Aplique as tags corretas (`scope:shared,type:<tipo>`) no `project.json` gerado — não há enforcement automatizado de module boundaries (sem ESLint neste projeto, ver `CLAUDE.md` seção 2), então confirme manualmente que a combinação de tags está coerente com as regras da skill `nx-workspace-standards`.
4. Não deixe a lib depender de `apps/*` nem, se for `type:ui`, de uma lib `type:data-access` (e vice-versa) — ver as regras de boundary na skill.
5. Adicione um `README.md` mínimo na lib só se o propósito não for óbvio pelo nome — não é obrigatório por padrão.

Ao final, rode `nx graph` (ou reporte a intenção de rodar) para confirmar que as dependências ficaram como esperado antes de começar a preencher a lib com código.
