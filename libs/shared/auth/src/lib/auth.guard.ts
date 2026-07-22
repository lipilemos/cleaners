import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

// loginPath é passado por cada app (rota de login própria e separada entre client-app e professional-portal).
export function createAuthGuard(loginPath: string): CanActivateFn {
  return () => {
    const sessionStore = inject(SessionStore);
    const router = inject(Router);

    if (sessionStore.isAuthenticated()) {
      return true;
    }

    return router.parseUrl(loginPath);
  };
}
