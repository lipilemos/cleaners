import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { REGISTER_PATH, provideSessionBootstrap } from '@cleaners/auth';
import {
  provideTranslocoConfig,
  provideTranslocoLocaleConfig,
} from '@cleaners/i18n';
import { API_BASE_URL } from '@cleaners/util';
import { provideTranslocoScope } from '@jsverse/transloco';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { csrfInterceptor } from './core/interceptors/csrf.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    // Requerido pelo mat-calendar da aba Calendário de incoming-bookings (locale sincronizado com
    // LanguageStore em tempo de execução, ver IncomingBookingsComponent).
    provideNativeDateAdapter(),
    provideHttpClient(
      withInterceptors([
        credentialsInterceptor,
        csrfInterceptor,
        errorInterceptor,
      ]),
    ),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: REGISTER_PATH, useValue: 'professional-register' },
    provideTranslocoConfig(),
    provideTranslocoLocaleConfig(),
    provideTranslocoScope('common'),
    provideSessionBootstrap(),
  ],
};
