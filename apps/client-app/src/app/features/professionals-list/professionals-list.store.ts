import { Injectable, computed, inject, signal } from '@angular/core';
import { ProfessionalsService } from '@cleaners/data-access';
import { ProfessionalSummary } from '@cleaners/models';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { LocationStore } from '../../core/location/location.store';
import { ReverseGeocodingService } from '../../core/geolocation/reverse-geocoding.service';
import { toProfessionalCardViewModel } from './professionals-list.mapper';

// Estado da feature (signals), injetado no escopo da rota (providers no Route, não em 'root') — ver
// skill angular-signals-state. A busca é sempre resolvida pelo backend (CLAUDE.md secao 1.1): a busca
// inicial usa a cidade resolvida a partir da geolocalização (ReverseGeocodingService, nunca lat/lng cru
// enviado à API — ver ProfessionalsService.search), buscas seguintes usam o termo digitado pelo usuário
// (nome ou cidade). `switchMap` cancela a busca anterior em andamento se uma nova chegar antes de
// responder, evitando que uma resposta antiga sobrescreva uma mais recente.
@Injectable()
export class ProfessionalsListStore {
  private readonly professionalsService = inject(ProfessionalsService);
  private readonly locationStore = inject(LocationStore);
  private readonly reverseGeocodingService = inject(ReverseGeocodingService);

  private readonly _city = signal<string | null>(null);
  private readonly _searchTerm = signal('');
  private readonly _professionals = signal<ProfessionalSummary[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly query$ = new Subject<string>();

  readonly searchTerm = this._searchTerm.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly professionals = computed(() =>
    this._professionals().map((professional) =>
      toProfessionalCardViewModel(professional),
    ),
  );

  readonly hasResults = computed(() => this.professionals().length > 0);
  // Distingue "nenhum profissional na cidade" (busca == cidade resolvida) de "busca digitada não
  // encontrou nada", para a mensagem certa na UI.
  readonly isUserSearching = computed(
    () => this._searchTerm().trim().length > 0,
  );

  constructor() {
    this.query$
      .pipe(
        tap(() => {
          this._loading.set(true);
          this._error.set(null);
        }),
        switchMap((term) =>
          this.professionalsService.search(term).pipe(
            catchError(() => {
              this._error.set('professionalsList.loadError');
              return of<ProfessionalSummary[] | null>(null);
            }),
          ),
        ),
      )
      .subscribe((list) => {
        this._loading.set(false);
        if (list) {
          this._professionals.set(list);
        }
      });
  }

  // Resolve a cidade a partir da posição atual (geolocalização automática ou fallback manual) e busca
  // profissionais nessa cidade — chamado quando a posição muda (ver ProfessionalsListComponent).
  resolveLocationAndSearch(): void {
    const position = this.locationStore.position();
    if (!position) {
      this._error.set('professionalsList.locationRequiredError');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.reverseGeocodingService.resolveCity(position).subscribe({
      next: (city) => {
        this._city.set(city);
        this.query$.next(this._searchTerm().trim() || city);
      },
      error: () => {
        this._loading.set(false);
        this._error.set('professionalsList.geocodingError');
      },
    });
  }

  // Termo digitado pelo usuário (nome ou cidade) — vazio volta a usar a cidade já resolvida.
  setSearchTerm(term: string): void {
    this._searchTerm.set(term);

    const effectiveTerm = term.trim() || this._city();
    if (effectiveTerm) {
      this.query$.next(effectiveTerm);
    }
  }

  retry(): void {
    const effectiveTerm = this._searchTerm().trim() || this._city();
    if (effectiveTerm) {
      this.query$.next(effectiveTerm);
    } else {
      this.resolveLocationAndSearch();
    }
  }
}
