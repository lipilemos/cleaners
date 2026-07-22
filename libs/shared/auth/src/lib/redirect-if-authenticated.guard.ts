import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

// Guard inverso a createAuthGuard: impede que um usuário já autenticado veja a tela de login de
// novo (ex.: acesso manual a /login com sessão ainda válida) — redireciona para a home do app.
// homePath é passado por cada app (client-app -> /professionals, professional-portal -> /availability).
export function createRedirectIfAuthenticatedGuard(
  homePath: string,
): CanActivateFn {
  return () => {
    const sessionStore = inject(SessionStore);
    const router = inject(Router);

    if (sessionStore.isAuthenticated()) {
      return router.parseUrl(homePath);
    }

    return true;
  };
}
