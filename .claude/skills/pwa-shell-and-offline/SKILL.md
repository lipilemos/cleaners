---
name: pwa-shell-and-offline
description: Use ao configurar ou revisar o comportamento de PWA do client-app do CleanersApp — manifest, service worker, estratégia de cache, instalabilidade e comportamento offline. O professional-portal não é PWA por padrão nesta fase (ver CLAUDE.md seção 2); só aplique esta skill lá se essa decisão mudar.
---

# PWA — `client-app`

## Escopo desta decisão

`client-app` (o app do usuário final) é uma PWA instalável. `professional-portal` é responsivo, mas **não** é PWA por padrão nesta fase do produto — decisão registrada no CLAUDE.md seção 2 como assunção a revisar se o uso do profissional for majoritariamente mobile.

## Setup

- Gerado via `nx g @angular/pwa:pwa --project=client-app` (adiciona `@angular/service-worker`, `manifest.webmanifest`, `ngsw-config.json`).
- `manifest.webmanifest`: nome, ícones (múltiplos tamanhos, incluindo maskable), `theme_color`/`background_color` alinhados ao tema Material central (ver skill [angular-material-ui](../angular-material-ui/SKILL.md)), `display: standalone`, `start_url` apontando para a rota de lista de profissionais (pós-login) ou login se deslogado.

## Estratégia de cache (`ngsw-config.json`)

- **App shell** (JS/CSS/assets do build): `installMode: prefetch` — sempre disponível offline após a primeira visita.
- **Chamadas à API** (`/api/**`): **nunca** `performance`/cache-first para dados que mudam com frequência (lista de profissionais, disponibilidade, status de booking) — use `freshness` (network-first com timeout curto e fallback a cache) apenas para dados não críticos de leitura (ex.: perfil do profissional já visitado); nunca cachear respostas de agendamento/booking, pois dado desatualizado ali pode enganar o usuário sobre uma confirmação.
- Nenhuma resposta contendo dados sensíveis (seção 5.4 do CLAUDE.md — telefone, endereço) é cacheada pelo service worker além do necessário para a sessão corrente.
- Como a autenticação é por cookie `httpOnly` (seção 6.1 do CLAUDE.md), o service worker não intercepta nem cacheia nada relacionado a login/sessão — cada chamada autenticada deve ir à rede.

## Instalabilidade e atualização

- Prompt de instalação (`beforeinstallprompt`) tratado por um serviço dedicado (`core/pwa-install.service.ts`), nunca lógica solta em um componente de UI — a UI só consome um signal `canInstall`/`promptInstall()`.
- Atualização de versão: usar `SwUpdate` do Angular para detectar nova versão disponível e notificar o usuário (via `MatSnackBar`, ver skill `angular-material-ui`) oferecendo recarregar — nunca forçar reload sem avisar, pois pode interromper um fluxo de agendamento em andamento.

## Offline

- Definir explicitamente o que funciona offline: navegação pelo app shell e conteúdo já visitado em cache (ex.: reabrir um perfil de profissional visto antes). Ações que exigem rede (buscar profissionais próximos, criar/confirmar agendamento) mostram um estado de "sem conexão" claro em vez de falhar silenciosamente ou parecer travado.
- Nenhuma escrita (booking, avaliação) é enfileirada para sincronizar depois offline nesta fase — isso exigiria fila de sincronização e resolução de conflito fora de escopo do MVP; se aparecer essa necessidade, tratar como uma decisão de produto nova, não assumir background sync silenciosamente.

## Teste

- Verificar manualmente (Lighthouse PWA audit) instalabilidade, ícones e `start_url` a cada mudança no manifest.
- Teste automatizado do `pwa-install.service.ts` cobre a lógica de exposição do prompt, não o comportamento real do browser (que não é testável em unit test).
