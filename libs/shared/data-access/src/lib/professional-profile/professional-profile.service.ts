import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Professional, ProfessionalAccount, Service } from '@cleaners/models';
import { API_BASE_URL } from '@cleaners/util';
import { Observable, map } from 'rxjs';
import {
  CreateServiceRequest,
  ProfessionalAccountDataDto,
  ProfessionalProfileDto,
  ServiceDto,
  UpdateProfessionalAccountDataRequest,
  UpdateServiceRequest,
  toProfessionalAccountModel,
  toProfessionalProfileModel,
  toServiceModel,
} from './professional-profile.dto';

// "Meu perfil profissional" (T31) é sempre resolvido pela sessão (cookie httpOnly) — nenhum
// professionalId é passado explicitamente por este service (mesmo padrão de UserProfileService).
// Endpoints implementados em cleaners-api (B21): GET /professionals/me,
// POST/PUT/DELETE /professionals/me/services[/{id}].
@Injectable({ providedIn: 'root' })
export class ProfessionalProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getMine(): Observable<Professional> {
    return this.http
      .get<ProfessionalProfileDto>(`${this.apiBaseUrl}/professionals/me`)
      .pipe(map(toProfessionalProfileModel));
  }

  // "Meus dados" (aba própria, distinta do perfil público retornado por getMine acima) — dados
  // sensíveis (telefone, endereço, CLAUDE.md secao 5.4) só trafegam no corpo da requisição.
  getMineAccountData(): Observable<ProfessionalAccount> {
    return this.http
      .get<ProfessionalAccountDataDto>(
        `${this.apiBaseUrl}/professionals/me/account-data`,
      )
      .pipe(map(toProfessionalAccountModel));
  }

  updateMineAccountData(
    request: UpdateProfessionalAccountDataRequest,
  ): Observable<ProfessionalAccount> {
    return this.http
      .put<ProfessionalAccountDataDto>(
        `${this.apiBaseUrl}/professionals/me/account-data`,
        request,
      )
      .pipe(map(toProfessionalAccountModel));
  }

  addService(request: CreateServiceRequest): Observable<Service> {
    return this.http
      .post<ServiceDto>(`${this.apiBaseUrl}/professionals/me/services`, request)
      .pipe(map(toServiceModel));
  }

  updateService(
    serviceId: string,
    request: UpdateServiceRequest,
  ): Observable<Service> {
    return this.http
      .put<ServiceDto>(
        `${this.apiBaseUrl}/professionals/me/services/${serviceId}`,
        request,
      )
      .pipe(map(toServiceModel));
  }

  removeService(serviceId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/professionals/me/services/${serviceId}`,
    );
  }
}
