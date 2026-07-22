import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Professional, ProfessionalSummary } from '@cleaners/models';
import { API_BASE_URL } from '@cleaners/util';
import { Observable, map } from 'rxjs';
import {
  ProfessionalDetailDto,
  ProfessionalSummaryDto,
  toProfessionalModel,
  toProfessionalSummary,
} from './professional.dto';

@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  // Busca por nome ou cidade do profissional, decidida inteiramente pelo backend (CLAUDE.md secao 1.1) —
  // usada tanto para a busca inicial (cidade resolvida a partir da geolocalização, ver
  // ReverseGeocodingService no client-app) quanto para a busca por texto digitada pelo usuário.
  search(term: string): Observable<ProfessionalSummary[]> {
    return this.http
      .get<ProfessionalSummaryDto[]>(`${this.apiBaseUrl}/professionals`, {
        params: { search: term },
      })
      .pipe(map((dtos) => dtos.map(toProfessionalSummary)));
  }

  getById(id: string): Observable<Professional> {
    return this.http
      .get<ProfessionalDetailDto>(`${this.apiBaseUrl}/professionals/${id}`)
      .pipe(map(toProfessionalModel));
  }
}
