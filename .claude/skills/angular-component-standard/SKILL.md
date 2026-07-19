---
name: angular-component-standard
description: Use ao criar qualquer componente Angular novo no CleanersApp, ou ao refatorar um existente para os padrões do projeto (standalone, signals, OnPush, controle de fluxo nativo). Cobre a estrutura de arquivos, convenções de nomenclatura e o esqueleto padrão de .ts/.html/.scss/.spec.ts a seguir.
---

# Padrão de componente Angular (CleanersApp)

Esta skill define o formato canônico de um componente Angular neste projeto. Consulte `CLAUDE.md` na raiz para a arquitetura de pastas completa.

## Estrutura de arquivos

Cada componente vive em sua própria pasta:

```
professional-card/
  professional-card.component.ts
  professional-card.component.html
  professional-card.component.scss
  professional-card.component.spec.ts
```

- Seletor: `app-<nome-em-kebab-case>` (ex.: `app-professional-card`).
- Um componente = uma pasta. Não misture múltiplos componentes não relacionados no mesmo arquivo.

## Esqueleto do `.component.ts`

```ts
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-professional-card',
  standalone: true,
  imports: [/* apenas o que for usado no template */],
  templateUrl: './professional-card.component.html',
  styleUrl: './professional-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalCardComponent {
  // Inputs/outputs baseados em signals — nunca @Input()/@Output()
  readonly professional = input.required<ProfessionalCardViewModel>();
  readonly selected = output<string>();

  // Derivações via computed(), nunca no template
  readonly averageRating = computed(() => this.professional().rating);

  private readonly router = inject(Router); // inject(), não constructor injection
}
```

## Esqueleto do `.component.html`

```html
@if (professional(); as pro) {
  <article class="professional-card">
    <span>{{ pro.name }}</span>
    <!-- @for sempre com track -->
    @for (service of pro.services; track service.id) {
      <span>{{ service.name }}</span>
    }
  </article>
} @else {
  <!-- texto vem de chave i18n, nunca string literal — ver skill i18n-multi-language -->
  <p>{{ 'professionalCard.notFound' | transloco }}</p>
}
```

## Regras obrigatórias

1. `standalone: true` sempre (é o padrão nas versões recentes, mas declare explicitamente se o CLI gerar `false`).
2. `changeDetection: ChangeDetectionStrategy.OnPush` sempre.
3. `input()`/`input.required()`/`output()` no lugar dos decorators clássicos.
4. `inject()` para toda dependência.
5. `@if`/`@for`/`@switch` no template — nunca `*ngIf`/`*ngFor`/`*ngSwitch`. `@for` sempre com `track` por um identificador estável (id), nunca por índice quando a lista pode reordenar.
6. Nenhum cálculo (distância, formatação de preço, média de estrelas) inline no template — use `computed()` no componente ou um `pipe` puro em `shared/`.
7. Nomeie o tipo de dado recebido via `input()` como um ViewModel específico do componente quando ele não for a entidade de domínio crua (ex.: `ProfessionalCardViewModel` em vez de expor `Professional` inteiro com campos sensíveis).
8. Nenhum texto visível hardcoded — use o pipe `transloco` no template (ver skill [i18n-multi-language](../i18n-multi-language/SKILL.md)).

## Teste (`.spec.ts`)

Todo componente com lógica derivada (`computed`) ou interação (`output`) tem teste cobrindo:
- Renderização com input mínimo válido.
- O valor de cada `computed()` exposto indiretamente pelo template.
- Emissão correta do(s) `output()` ao interagir.

## Checklist antes de finalizar

- [ ] Pasta e seletor seguem kebab-case.
- [ ] `OnPush` presente.
- [ ] `input()`/`output()`, não decorators.
- [ ] `inject()`, não constructor injection.
- [ ] `@if`/`@for` com `track`, nunca diretivas estruturais antigas.
- [ ] Sem lógica de negócio no template.
- [ ] Nenhum texto visível hardcoded — chaves `transloco` presentes nos três idiomas.
- [ ] Teste unitário cobrindo lógica não trivial.
