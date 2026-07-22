import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '@cleaners/util';

// Garante que o cookie httpOnly da sessão seja enviado em toda chamada à API .NET — ver CLAUDE.md secao 6.1.
// Escopado à apiBaseUrl: chamadas a serviços externos (ex.: ReverseGeocodingService, Nominatim/OSM) nunca
// devem levar withCredentials — o provedor terceiro não é a mesma origem e não devolve
// Access-Control-Allow-Credentials, o navegador bloquearia a resposta.
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (!req.url.startsWith(apiBaseUrl)) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};
