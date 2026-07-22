import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from './session.store';

// Cada app chama isso em app.config.ts para resolver a sessão (GET /me) antes da primeira renderização de rota protegida.
export function provideSessionBootstrap(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const sessionStore = inject(SessionStore);
    return firstValueFrom(sessionStore.bootstrap());
  });
}
