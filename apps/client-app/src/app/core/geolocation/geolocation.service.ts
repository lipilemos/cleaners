import { Injectable } from '@angular/core';
import { GeoPoint } from '@cleaners/util';
import { Observable } from 'rxjs';

export type GeolocationFailureReason = 'denied' | 'unavailable';

export class GeolocationFailure extends Error {
  constructor(readonly reason: GeolocationFailureReason) {
    super(reason);
  }
}

// Único ponto que fala com `navigator.geolocation` no client-app — nunca chamado direto de um
// componente (skill professional-list-card), para manter LocationStore/componentes testáveis.
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  getCurrentPosition(): Observable<GeoPoint> {
    return new Observable<GeoPoint>((subscriber) => {
      if (!navigator.geolocation) {
        subscriber.error(new GeolocationFailure('unavailable'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          subscriber.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          subscriber.complete();
        },
        (error) => {
          const reason: GeolocationFailureReason =
            error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable';
          subscriber.error(new GeolocationFailure(reason));
        },
        // Sem timeout, uma prompt de permissão sem resposta trava a Observable indefinidamente
        // (o timeout do spec conta a partir da chamada, cobrindo a prompt pendente).
        { timeout: 8000 },
      );
    });
  }
}
