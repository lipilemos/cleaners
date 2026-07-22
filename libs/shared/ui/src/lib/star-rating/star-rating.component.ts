import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';

type StarState = 'full' | 'half' | 'empty';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [MatIconModule, TranslocoPipe],
  providers: [provideTranslocoScope('starRating')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  // 0–5, aceita decimais para exibição (nunca armazenada — sempre computada pelo chamador a partir de reviews[]).
  readonly value = input.required<number>();
  readonly max = input(5);
  // true = exibição (client-app e professional-portal); false = input do usuário avaliando (só client-app, pós-serviço).
  readonly readonly = input(true);
  readonly valueChange = output<number>();

  protected readonly starPositions = computed(() =>
    Array.from({ length: this.max() }, (_, i) => i + 1),
  );

  protected starState(position: number): StarState {
    const currentValue = this.value();
    if (currentValue >= position) return 'full';
    if (currentValue >= position - 0.5) return 'half';
    return 'empty';
  }

  protected starIcon(position: number): string {
    const state = this.starState(position);
    if (state === 'full') return 'star';
    if (state === 'half') return 'star_half';
    return 'star_outline';
  }

  protected select(position: number): void {
    if (this.readonly()) return;
    this.valueChange.emit(position);
  }
}
