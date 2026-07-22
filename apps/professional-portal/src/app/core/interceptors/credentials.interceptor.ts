import { HttpInterceptorFn } from '@angular/common/http';

// Garante que o cookie httpOnly da sessão seja enviado em toda chamada à API — ver CLAUDE.md secao 6.1.
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
