import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { User } from '@cleaners/models';
import { API_BASE_URL } from '@cleaners/util';
import { Observable, map } from 'rxjs';
import {
  UpdateUserProfileRequest,
  UserProfileDto,
  toUserModel,
} from './user-profile.dto';

// "Meus dados" é sempre resolvido pela sessão (cookie httpOnly) — nenhum id de usuário é passado
// explicitamente. Dados sensíveis (telefone, endereço) só trafegam no corpo da requisição, nunca em
// query params (CLAUDE.md secao 5.4), e este service nunca loga o payload.
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getMine(): Observable<User> {
    return this.http
      .get<UserProfileDto>(`${this.apiBaseUrl}/users/me`)
      .pipe(map(toUserModel));
  }

  updateMine(request: UpdateUserProfileRequest): Observable<User> {
    return this.http
      .put<UserProfileDto>(`${this.apiBaseUrl}/users/me`, request)
      .pipe(map(toUserModel));
  }

  // multipart/form-data: nunca setar o header Content-Type manualmente aqui — o HttpClient monta o
  // boundary sozinho a partir do FormData (ver core/interceptors, que só cuidam de credentials/CSRF).
  uploadMinePhoto(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<UserProfileDto>(`${this.apiBaseUrl}/users/me/photo`, formData)
      .pipe(map(toUserModel));
  }
}
