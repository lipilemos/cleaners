import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StarRatingComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { PortalToolbarComponent } from '../../core/shell/portal-toolbar/portal-toolbar.component';
import { ReviewsReceivedStore } from './reviews-received.store';

// Container da feature `reviews-received` (T30): histórico de avaliações recebidas pelo profissional
// logado. StarRatingComponent (@cleaners/ui) recebe só a nota, nunca a entidade Review inteira.
@Component({
  selector: 'app-reviews-received',
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    PortalToolbarComponent,
    StarRatingComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  templateUrl: './reviews-received.component.html',
  styleUrl: './reviews-received.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsReceivedComponent {
  protected readonly store = inject(ReviewsReceivedStore);

  constructor() {
    this.store.load();
  }
}
