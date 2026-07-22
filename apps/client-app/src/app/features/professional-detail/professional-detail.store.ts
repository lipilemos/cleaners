import { Injectable, computed, inject, signal } from '@angular/core';
import { ProfessionalsService } from '@cleaners/data-access';
import { Professional } from '@cleaners/models';
import { calculateAverageRating } from '@cleaners/util';

// Estado da feature (signals), injetado no escopo da rota. GET /professionals/{id} já traz reviews[]
// embutidas (ver ProfessionalDetailDto no cleaners-api) — a nota média segue sempre computed() a partir
// dessa lista, nunca um campo solto (CLAUDE.md secao 5.2).
@Injectable()
export class ProfessionalDetailStore {
  private readonly professionalsService = inject(ProfessionalsService);

  private readonly _professional = signal<Professional | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly professional = this._professional.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly reviews = computed(() => this._professional()?.reviews ?? []);
  readonly averageRating = computed(() =>
    calculateAverageRating(this.reviews()),
  );
  readonly reviewCount = computed(() => this.reviews().length);

  load(professionalId: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.professionalsService.getById(professionalId).subscribe({
      next: (professional) => {
        this._professional.set(professional);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('professionalDetail.loadError');
        this._loading.set(false);
      },
    });
  }
}
