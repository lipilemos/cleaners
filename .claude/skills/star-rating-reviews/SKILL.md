---
name: star-rating-reviews
description: Use ao implementar o componente de estrelas (exibição de nota média ou input de avaliação) e o fluxo de avaliações de profissionais após um serviço concluído. Cobre o componente genérico reutilizável de estrelas e a regra de que a nota é sempre derivada da lista de reviews.
---

# Sistema de estrelas e avaliações

## Regra central de domínio

A nota de um profissional **nunca** é um campo solto e editável. Ela é sempre `computed()` a partir da lista de `Review`:

```ts
readonly reviews = input.required<Review[]>();

readonly averageRating = computed(() => {
  const list = this.reviews();
  if (list.length === 0) return 0;
  const sum = list.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / list.length) * 10) / 10; // 1 casa decimal
});

readonly reviewCount = computed(() => this.reviews().length);
```

Isso vale tanto no card da lista (ver skill [professional-list-card](../professional-list-card/SKILL.md), `client-app`) quanto na tela de perfil do profissional (`client-app`) e na tela de avaliações recebidas no `professional-portal` (feature `reviews-received`, ver CLAUDE.md seção 1.2). Se o backend já envia uma média pronta por performance, trate-a como um valor de exibição vindo da API (`Professional.rating`), mas a lógica de cálculo local, quando existir no frontend, segue sempre esta fórmula — nunca duas fórmulas divergentes em lugares diferentes.

## Componente `star-rating` (genérico, `libs/shared/ui/star-rating`)

Este componente **não conhece** `Professional` nem `Review`. Ele só sabe exibir/receber um número de estrelas. É reaproveitado pelos dois apps (`client-app` e `professional-portal`), por isso vive em `libs/shared/ui`, não dentro de um app específico. Usa `MatIcon` para os ícones de estrela (ver skill [angular-material-ui](../angular-material-ui/SKILL.md)) em vez de SVGs/fontes próprias.

```ts
@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './star-rating.component.html',
})
export class StarRatingComponent {
  readonly value = input.required<number>();      // 0–5, aceita decimais para exibição
  readonly max = input(5);
  readonly readonly = input(true);                // true = exibição; false = input do usuário avaliando
  readonly valueChange = output<number>();

  readonly stars = computed(() =>
    Array.from({ length: this.max() }, (_, i) => this.starState(i + 1))
  );

  private starState(position: number): 'full' | 'half' | 'empty' {
    const v = this.value();
    if (v >= position) return 'full';
    if (v >= position - 0.5) return 'half';
    return 'empty';
  }

  select(position: number): void {
    if (this.readonly()) return;
    this.valueChange.emit(position);
  }
}
```

- Modo `readonly` (padrão): usado em cards e perfis para exibir a média, nos dois apps.
- Modo interativo (`readonly: false`): usado exclusivamente na tela de avaliação pós-serviço no `client-app`, onde o usuário atribui uma nota de 1 a 5.
- Nunca duplique este componente — todo lugar de qualquer um dos dois apps que mostra estrelas reusa `app-star-rating` de `libs/shared/ui`.

## Fluxo de avaliação pós-serviço (`client-app`, feature `reviews`)

- Uma `Review` só pode ser criada vinculada a um `Booking` com status concluído — o backend valida isso, e o frontend não deve exibir a tela de avaliação para bookings não concluídos.
- Formulário de avaliação usa Reactive Forms + `MatFormField` (nota via `star-rating` em modo interativo, `Validators.required`, min 1) + comentário opcional (`maxLength`).
- Após envio, invalidar/recarregar a nota média do profissional exibida nas telas afetadas (perfil, e possivelmente cache da lista). Como o `professional-portal` também exibe reviews recebidas, o novo dado chega lá via a atualização em tempo real (SignalR) ou no próximo carregamento da tela — ver skill [google-calendar-mcp-scheduling](../google-calendar-mcp-scheduling/SKILL.md) para o padrão de tempo real já usado no agendamento.

## Modelo de dados

```ts
// libs/shared/models/review.model.ts
export interface Review {
  id: string;
  bookingId: string;
  authorUserId: string;
  professionalId: string;
  rating: number;     // 1–5, inteiro
  comment?: string;
  createdAt: string;  // ISO date
}
```

## Teste

- Teste de `averageRating` com: lista vazia (0), uma review, múltiplas reviews, arredondamento.
- Teste do `star-rating` em modo readonly (não emite ao clicar) e em modo interativo (emite a posição clicada).
- Teste do formulário de avaliação: inválido sem nota, válido com nota + comentário opcional vazio.
