import { Injectable, computed, inject, signal } from '@angular/core';
import { ReviewsService } from '@cleaners/data-access';
import { Review } from '@cleaners/models';
import { SessionStore } from '@cleaners/auth';
import { calculateAverageRating } from '@cleaners/util';
import { ProfessionalAccount } from '../../core/session/professional-account';

// Estado da feature `reviews-received` (T30), injetado no escopo da rota. Reaproveita
// ReviewsService.getByProfessional (mesmo endpoint público usado pelo client-app na tela de perfil),
// passando o id do profissional logado (ProfessionalAccount.id na sessão, o mesmo id de domínio de
// Professional.id — suposição documentada no resumo da tarefa) em vez de assumir um endpoint
// autenticado "meus reviews" dedicado que ainda não existe. A nota média nunca vem pronta da API —
// é sempre computed() a partir da lista (CLAUDE.md secao 5.2).
@Injectable()
export class ReviewsReceivedStore {
  private readonly reviewsService = inject(ReviewsService);
  private readonly sessionStore =
    inject<SessionStore<ProfessionalAccount>>(SessionStore);

  private readonly _reviews = signal<Review[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly reviews = this._reviews.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly averageRating = computed(() =>
    calculateAverageRating(this._reviews()),
  );
  readonly reviewCount = computed(() => this._reviews().length);

  load(): void {
    const professionalId = this.sessionStore.account()?.id;
    if (!professionalId) {
      this._error.set('reviewsReceived.loadErrorMessage');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.reviewsService.getByProfessional(professionalId).subscribe({
      next: (reviews) => {
        this._reviews.set(reviews);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('reviewsReceived.loadErrorMessage');
        this._loading.set(false);
      },
    });
  }
}
