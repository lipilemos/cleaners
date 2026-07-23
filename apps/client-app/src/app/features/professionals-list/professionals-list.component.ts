import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import {
  FormFieldErrorComponent,
  ProfessionalCardComponent,
  ProfessionalCardViewModel,
} from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LocationStore } from '../../core/location/location.store';
import { ProfessionalsListStore } from './professionals-list.store';

// Busca dispara uma requisição real ao backend a cada termo (ver ProfessionalsListStore) — debounce
// evita uma chamada por tecla digitada.
const SEARCH_DEBOUNCE_MS = 400;

// Container da lista (só existe no client-app, ver skill professional-list-card): resolve
// geolocalização/fallback manual, delega a busca ao ProfessionalsListStore e monta os
// ProfessionalCardViewModel exibidos pelo componente apresentacional (@cleaners/ui).
@Component({
  selector: 'app-professionals-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    FormFieldErrorComponent,
    ProfessionalCardComponent,
    TranslocoPipe,
  ],
  templateUrl: './professionals-list.component.html',
  styleUrl: './professionals-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalsListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly store = inject(ProfessionalsListStore);
  protected readonly locationStore = inject(LocationStore);

  // Fallback manual quando a geolocalização automática é negada/indisponível (T21): sem geocoding
  // real, o usuário informa lat/lng diretamente — decisão documentada no resumo da tarefa.
  protected readonly manualLocationForm = this.formBuilder.nonNullable.group({
    latitude: [
      0,
      [Validators.required, Validators.min(-90), Validators.max(90)],
    ],
    longitude: [
      0,
      [Validators.required, Validators.min(-180), Validators.max(180)],
    ],
  });

  // Busca por nome/empresa ou cidade — Reactive Forms (CLAUDE.md secao 4), valor debounced e convertido
  // a signal, propagado à store via effect (padrão signals-first, ver skill angular-signals-state).
  // Cada mudança dispara uma nova busca no backend (ProfessionalsListStore.setSearchTerm), não mais um
  // filtro local.
  protected readonly searchControl = this.formBuilder.nonNullable.control('');
  private readonly searchTermSignal = toSignal(
    this.searchControl.valueChanges.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  constructor() {
    this.locationStore.requestCurrentPosition();

    effect(() => {
      if (this.locationStore.position()) {
        this.store.resolveLocationAndSearch();
      }
    });

    effect(() => {
      this.store.setSearchTerm(this.searchTermSignal());
    });
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
  }

  protected retryGeolocation(): void {
    this.locationStore.requestCurrentPosition();
  }

  protected submitManualLocation(): void {
    if (this.manualLocationForm.invalid) {
      this.manualLocationForm.markAllAsTouched();
      return;
    }

    const { latitude, longitude } = this.manualLocationForm.getRawValue();
    this.locationStore.setManualPosition({ latitude, longitude });
  }

  protected openProfessional(viewModel: ProfessionalCardViewModel): void {
    void this.router.navigate(['/professionals', viewModel.id]);
  }
}
