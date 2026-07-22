import { Injectable, computed, inject, signal } from '@angular/core';
import { GeoPoint } from '@cleaners/util';
import { environment } from '../../../environments/environment';
import {
  GeolocationFailure,
  GeolocationService,
} from '../geolocation/geolocation.service';
import { LocationPermissionState } from './location-permission-state';

// Estado global mínimo do client-app (CLAUDE.md secao 7, junto de SessionStore): última posição
// conhecida do usuário, usada pela lista de profissionais e pelo agendamento. Nunca reordena/decide
// disponibilidade sozinho — só guarda a posição usada para chamar o backend.
@Injectable({ providedIn: 'root' })
export class LocationStore {
  private readonly geolocationService = inject(GeolocationService);

  private readonly _position = signal<GeoPoint | null>(null);
  private readonly _permissionState = signal<LocationPermissionState>('idle');

  readonly position = this._position.asReadonly();
  readonly permissionState = this._permissionState.asReadonly();
  readonly hasPosition = computed(() => this._position() !== null);
  readonly needsManualFallback = computed(() =>
    ['denied', 'unavailable'].includes(this._permissionState()),
  );

  requestCurrentPosition(): void {
    this._permissionState.set('requesting');

    this.geolocationService.getCurrentPosition().subscribe({
      next: (point) => {
        this._position.set(point);
        this._permissionState.set('granted');
      },
      error: (error: unknown) => {
        const reason =
          error instanceof GeolocationFailure ? error.reason : 'unavailable';

        if (environment.defaultTestLocation) {
          this.setManualPosition(environment.defaultTestLocation);
          return;
        }

        this._position.set(null);
        this._permissionState.set(reason);
      },
    });
  }

  // Fallback quando a geolocalização automática é negada/indisponível — o usuário informa a posição
  // manualmente (ver T21: não faz geocoding real, apenas emite o GeoPoint informado).
  setManualPosition(point: GeoPoint): void {
    this._position.set(point);
    this._permissionState.set('manual');
  }
}
