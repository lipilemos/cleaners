import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { GeoPoint } from '@cleaners/util';
import { Observable, map } from 'rxjs';

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

interface NominatimReverseResponseDto {
  readonly address?: {
    readonly city?: string;
    readonly town?: string;
    readonly village?: string;
    readonly municipality?: string;
  };
}

export class ReverseGeocodingFailure extends Error {}

// Único ponto que fala com a API pública do Nominatim/OpenStreetMap — serviço externo à cleaners-api,
// por isso fora de @cleaners/data-access (CLAUDE.md secao 6). Resolve a cidade a partir de um GeoPoint
// para a busca inicial da lista de profissionais (ver professionals-list.store.ts), que passa a buscar
// por cidade em vez de enviar lat/lng cru ao backend.
@Injectable({ providedIn: 'root' })
export class ReverseGeocodingService {
  private readonly http = inject(HttpClient);

  resolveCity(point: GeoPoint): Observable<string> {
    return this.http
      .get<NominatimReverseResponseDto>(NOMINATIM_REVERSE_URL, {
        params: {
          format: 'jsonv2',
          lat: point.latitude,
          lon: point.longitude,
          zoom: 10,
          addressdetails: 1,
        },
      })
      .pipe(
        map((response) => {
          const address = response.address;
          const city =
            address?.city ??
            address?.town ??
            address?.village ??
            address?.municipality;

          if (!city) {
            throw new ReverseGeocodingFailure(
              'Não foi possível identificar a cidade a partir da localização informada.',
            );
          }

          return city;
        }),
      );
  }
}
