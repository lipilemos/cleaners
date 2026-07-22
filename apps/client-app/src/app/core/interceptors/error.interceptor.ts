import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore } from '@cleaners/auth';
import { catchError, throwError } from 'rxjs';

// Normaliza erros HTTP e trata 401 como sessão expirada — nunca infere "deslogado" de outra forma
// (ver CLAUDE.md secao 6.1: estado de sessão só é resolvido via /me). Exceção: um 401 de POST /login
// é só "credenciais inválidas" nesta tentativa específica, não uma sessão expirada — tratar como tal
// dispararia clearSession()/redirect redundantes enquanto o próprio LoginFormComponent já mostra o erro.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isLoginRequest = req.url.endsWith('/login');

      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isLoginRequest
      ) {
        sessionStore.clearSession();
        void router.navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};
