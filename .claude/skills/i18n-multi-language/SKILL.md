---
name: i18n-multi-language
description: Use sempre que uma feature ou componente exibir qualquer texto visível ao usuário (label, botão, mensagem de erro, placeholder, título) no client-app ou no professional-portal. Define a biblioteca de i18n adotada, a estrutura de arquivos JSON por idioma (pt-BR, en, es), a convenção de chaves e o mecanismo de troca de idioma em runtime. Nenhum texto pode ser hardcoded em template ou `.ts`.
---

# Internacionalização (i18n) — CleanersApp

O CleanersApp suporta três idiomas selecionáveis pelo usuário **em runtime**, sem precisar recarregar/reinstalar o app: **português do Brasil (`pt-BR`, padrão)**, **inglês (`en`)** e **espanhol (`es`)**. Isso vale para os dois apps (`client-app` e `professional-portal`), que mantêm arquivos de tradução próprios, mais os textos de componentes compartilhados em `libs/shared/ui`.

## Regra central (não negociável)

**Nenhum texto visível ao usuário é hardcoded** em `.html` ou `.ts` — nem labels, nem placeholders, nem mensagens de erro/validação, nem `aria-label`/`title` de acessibilidade, nem texto passado para `MatSnackBar`/`MatDialog`. Todo texto vem de uma chave de tradução. Strings puramente técnicas (nomes de rota, valores de enum enviados à API, chaves de log) não são texto de UI e ficam fora do escopo desta regra.

## Biblioteca: Transloco

Adotamos **`@jsverse/transloco`** (antigo `@ngneat/transloco`) em vez de `@angular/localize`. Motivo: `@angular/localize` é resolvido em **build-time** (um bundle por idioma), o que não atende ao requisito de troca de idioma **em runtime** pelo usuário dentro da mesma sessão/instalação do PWA. Transloco carrega os JSONs como assets HTTP e troca o idioma ativo instantaneamente via signal/observable, sem rebuild.

- `@jsverse/transloco` — core (pipe, diretiva, service).
- `@jsverse/transloco-messageformat` — pluralização e formatação ICU (ex.: "1 agendamento" vs "3 agendamentos") nos três idiomas.
- `@jsverse/transloco-locale` — formatação de data/moeda/número por locale, para complementar (não substituir) `DatePipe`/`CurrencyPipe` do Angular quando o formato precisar variar por idioma escolhido (não necessariamente pelo locale do navegador).

## Estrutura de arquivos

```
libs/shared/i18n/                        # lib nova: config central + estado de idioma
  src/lib/
    transloco-root.config.ts             # provideTransloco(), idiomas suportados, idioma padrão
    supported-languages.ts               # ('pt-BR' | 'en' | 'es')[] + labels para o seletor
    language.store.ts                    # signal-based store: idioma atual + persistência (ver seção "Estado do idioma")
    common/
      pt-BR.json                         # textos genéricos reaproveitados pelos dois apps
      en.json
      es.json

libs/shared/ui/src/lib/<componente>/i18n/   # cada componente compartilhado com texto próprio
  pt-BR.json
  en.json
  es.json

apps/client-app/public/assets/i18n/
  pt-BR.json                             # textos específicos das features do client-app
  en.json
  es.json

apps/professional-portal/public/assets/i18n/
  pt-BR.json
  en.json
  es.json
```

- Cada `.json` é **plano por namespace de feature**, aninhado só um nível (ver convenção de chaves abaixo) — evite aninhamento profundo, dificulta encontrar a chave.
- Textos usados pelos dois apps (botões genéricos: "Cancelar", "Confirmar", "Voltar", mensagens de erro HTTP genéricas) vivem em `libs/shared/i18n/common`, não duplicados em cada app.
- Um componente de `libs/shared/ui` que tem texto próprio (não recebido via `input()`) carrega seu próprio JSON como **scope** do Transloco — assim ele continua reaproveitável pelos dois apps sem depender da estrutura de assets do app hospedeiro.

## Convenção de chaves

`<namespace>.<elemento>`, `camelCase`, namespace = nome do feature folder ou do componente:

```json
// apps/client-app/public/assets/i18n/pt-BR.json
{
  "professionalsList": {
    "title": "Profissionais perto de você",
    "emptyState": "Nenhum profissional encontrado na sua região.",
    "distanceLabel": "{{distance}} km de você"
  },
  "booking": {
    "confirmButton": "Confirmar agendamento",
    "cancelButton": "Cancelar",
    "successMessage": "Agendamento confirmado! O profissional entrará em contato."
  }
}
```

```json
// apps/client-app/public/assets/i18n/en.json
{
  "professionalsList": {
    "title": "Professionals near you",
    "emptyState": "No professionals found in your area.",
    "distanceLabel": "{{distance}} km away"
  },
  "booking": {
    "confirmButton": "Confirm booking",
    "cancelButton": "Cancel",
    "successMessage": "Booking confirmed! The professional will contact you."
  }
}
```

```json
// apps/client-app/public/assets/i18n/es.json
{
  "professionalsList": {
    "title": "Profesionales cerca de ti",
    "emptyState": "No se encontraron profesionales en tu zona.",
    "distanceLabel": "A {{distance}} km de ti"
  },
  "booking": {
    "confirmButton": "Confirmar reserva",
    "cancelButton": "Cancelar",
    "successMessage": "¡Reserva confirmada! El profesional se pondrá en contacto contigo."
  }
}
```

- Interpolação de valores dinâmicos (contagem, distância, nome) sempre via `{{param}}` do Transloco — **nunca concatenação de string** (`'Olá ' + name`), porque a ordem das palavras muda entre idiomas.
- Pluralização usa ICU MessageFormat (via `transloco-messageformat`), não `if`/`switch` manual escrito no componente:

```json
"bookingsCount": "{count, plural, =0 {Nenhum agendamento} one {1 agendamento} other {# agendamentos}}"
```

## Uso em componente

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-professionals-list',
  standalone: true,
  imports: [TranslocoPipe /* ... */],
  templateUrl: './professionals-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalsListComponent {
  private readonly transloco = inject(TranslocoService);
}
```

```html
<h1>{{ 'professionalsList.title' | transloco }}</h1>

@if (professionals().length === 0) {
<p>{{ 'professionalsList.emptyState' | transloco }}</p>
}

<span
  >{{ 'professionalsList.distanceLabel' | transloco: { distance: pro.distanceKm
  } }}</span
>
```

- Prefira o pipe `transloco` no template (declarativo). Use `TranslocoService.translate()` no `.ts` apenas quando o texto for necessário fora do template (ex.: título passado a `MatSnackBar.open()`, mensagem de um `MatDialog` aberto imperativamente).
- Um componente de `libs/shared/ui` com texto próprio declara seu scope:

```ts
@Component({
  selector: 'app-star-rating',
  standalone: true,
  providers: [provideTranslocoScope('starRating')],
  // ...
})
export class StarRatingComponent {}
```

## Estado do idioma (`libs/shared/i18n/language.store.ts`)

Segue o mesmo padrão signal-based de store descrito na skill [angular-signals-state](../angular-signals-state/SKILL.md), mas é **estado global** (assim como `SessionStore`, é uma exceção explícita da seção 7 do CLAUDE.md):

```ts
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly transloco = inject(TranslocoService);
  private readonly storageKey = 'cleaners-app-language';

  readonly current = signal<SupportedLanguage>(this.readInitialLanguage());

  setLanguage(lang: SupportedLanguage): void {
    this.transloco.setActiveLang(lang);
    localStorage.setItem(this.storageKey, lang);
    this.current.set(lang);
  }

  private readInitialLanguage(): SupportedLanguage {
    const saved = localStorage.getItem(
      this.storageKey,
    ) as SupportedLanguage | null;
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
    const browserLang = navigator.language.slice(0, 2);
    return (SUPPORTED_LANGUAGES.find((l) => l.startsWith(browserLang)) ??
      'pt-BR') as SupportedLanguage;
  }
}
```

- **`localStorage` aqui é permitido**: a restrição da seção 6.1 do CLAUDE.md a `localStorage`/`document.cookie` é especificamente sobre **token de autenticação**, que nunca fica acessível ao JavaScript. Preferência de idioma não é dado sensível nem de sessão — persistir localmente é o padrão esperado.
- `client-app` e `professional-portal` têm cada um sua própria instância de `LanguageStore` (mesmo princípio da seção 7 do CLAUDE.md para `SessionStore`: são processos de browser separados, sem estado compartilhado em runtime).
- Fallback de idioma inicial: idioma salvo → idioma do navegador (`navigator.language`) se suportado → `pt-BR` como padrão final.
- Se o `User`/`Professional` tiver um campo de idioma preferido persistido no backend (ex.: para notificações), isso é uma decisão do time de backend/produto fora do escopo desta skill — **assunção**: por ora, o idioma é só uma preferência de UI local, sincronize com o backend apenas se/quando isso for pedido explicitamente.

## Seletor de idioma (`libs/shared/ui/language-switcher`)

Componente compartilhado pelos dois apps, reaproveitando Angular Material (`MatMenu` ou `MatSelect`, ver skill [angular-material-ui](../angular-material-ui/SKILL.md)) em vez de um dropdown customizado:

```html
<button
  mat-icon-button
  [matMenuTriggerFor]="langMenu"
  [attr.aria-label]="'common.changeLanguage' | transloco"
>
  <mat-icon>language</mat-icon>
</button>
<mat-menu #langMenu="matMenu">
  @for (lang of supportedLanguages; track lang.code) {
  <button mat-menu-item (click)="languageStore.setLanguage(lang.code)">
    {{ lang.label }}
  </button>
  }
</mat-menu>
```

- `lang.label` ("Português (Brasil)", "English", "Español") é exibido **no próprio idioma nativo**, não traduzido — é assim que seletores de idioma funcionam universalmente, para que o usuário reconheça sua língua mesmo se o idioma ativo atual não for o dele.

## Configuração raiz (`transloco-root.config.ts`)

```ts
export const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function provideTranslocoConfig() {
  return provideTransloco({
    config: {
      availableLangs: SUPPORTED_LANGUAGES,
      defaultLang: 'pt-BR',
      fallbackLang: 'pt-BR',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      missingHandler: {
        // em dev, chave faltando quebra visualmente (texto entre colchetes) para ser notada em code review;
        // nunca falha silenciosamente mostrando a chave crua em produção sem log.
        useFallbackTranslation: true,
        logMissingKey: true,
      },
    },
    loader: TranslocoHttpLoader, // busca de /assets/i18n/{lang}.json, ver TranslocoHttpLoader por app
  });
}
```

- `missingHandler` com `logMissingKey: true` é o mecanismo primário para pegar chave esquecida — não existe hoje um lint automático de "texto hardcoded" no ecossistema Angular/Nx; a revisão (`angular-code-reviewer`, `/review-angular`) é a segunda linha de defesa (ver checklist abaixo).

## Testes

- Teste de cada `.json` novo/editado: as três variantes (`pt-BR`, `en`, `es`) têm exatamente o mesmo conjunto de chaves (teste utilitário simples comparando `Object.keys` recursivamente) — evita idioma "quebrado" por chave faltante.
- Teste de `LanguageStore`: idioma salvo é lido corretamente no boot; `setLanguage()` persiste e atualiza `current()`.
- Componente com texto: teste não precisa afirmar o texto traduzido literal (isso é fragilidade desnecessária) — afirme que a chave correta foi passada ao pipe/service, ou use o `TranslocoTestingModule` com um JSON de teste mínimo.

## Checklist antes de finalizar

- [ ] Nenhuma string literal de texto visível em `.html` fora de um pipe/diretiva `transloco`.
- [ ] Nenhuma string literal de texto visível montada em `.ts` (snackbar, dialog, erro de validação) fora de `TranslocoService.translate()`.
- [ ] Chave nova adicionada nos **três** arquivos (`pt-BR.json`, `en.json`, `es.json`), nunca só no idioma que o desenvolvedor estava usando.
- [ ] Texto compartilhado pelos dois apps está em `libs/shared/i18n/common`, não duplicado.
- [ ] Componente de `libs/shared/ui` com texto próprio declara seu `provideTranslocoScope`.
- [ ] Interpolação usa `{{param}}`/ICU, nunca concatenação de string.
- [ ] `aria-label`/`title` de acessibilidade também traduzidos, não esquecidos por não serem texto visível "óbvio".
