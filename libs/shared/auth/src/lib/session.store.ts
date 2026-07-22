import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_BASE_URL } from '@cleaners/util';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { LoginCredentials } from './login-credentials';
import { REGISTER_PATH } from './register-path.token';
import { RegisterCredentials } from './register-credentials';
import { SessionAccount, SessionStatus } from './session-account';

// Estado global (exceção da secao 7 do CLAUDE.md). "Logado" nunca é inferido localmente
// (não há token pra checar) — é sempre o resultado de GET /me: sucesso = sessão válida, 401 = deslogado.
@Injectable({ providedIn: 'root' })
export class SessionStore<TAccount extends SessionAccount = SessionAccount> {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly registerPath = inject(REGISTER_PATH);

  private readonly _account = signal<TAccount | null>(null);
  private readonly _status = signal<SessionStatus>('idle');

  readonly account = this._account.asReadonly();
  readonly status = this._status.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');

  // Chamado uma vez no bootstrap do app (ver provideSessionBootstrap()).
  bootstrap(): Observable<TAccount | null> {
    this._status.set('loading');
    return this.http.get<TAccount>(`${this.apiBaseUrl}/me`).pipe(
      tap((account) => {
        this._account.set(account);
        this._status.set('authenticated');
      }),
      catchError(() => {
        this._account.set(null);
        this._status.set('unauthenticated');
        return of(null);
      }),
    );
  }

  // POST /login com as credenciais informadas. O cookie httpOnly de sessão é setado pelo servidor
  // na resposta (ver CLAUDE.md secao 6.1) — o Angular só reflete a conta/erro devolvidos.
  login(credentials: LoginCredentials): Observable<TAccount> {
    this._status.set('loading');
    return this.http
      .post<TAccount>(`${this.apiBaseUrl}/login`, credentials)
      .pipe(
        tap((account) => {
          this._account.set(account);
          this._status.set('authenticated');
        }),
        catchError((error: unknown) => {
          this._account.set(null);
          this._status.set('unauthenticated');
          return throwError(() => error);
        }),
      );
  }

  // Cadastro público (User em client-app, Professional em professional-portal — REGISTER_PATH difere
  // por app). Sucesso já autentica: mesmo contrato de resposta do login (conta + cookie httpOnly).
  register(credentials: RegisterCredentials): Observable<TAccount> {
    this._status.set('loading');
    return this.http
      .post<TAccount>(`${this.apiBaseUrl}/${this.registerPath}`, credentials)
      .pipe(
        tap((account) => {
          this._account.set(account);
          this._status.set('authenticated');
        }),
        catchError((error: unknown) => {
          this._account.set(null);
          this._status.set('unauthenticated');
          return throwError(() => error);
        }),
      );
  }

  // O servidor invalida a sessão e limpa o cookie httpOnly; o Angular só reflete o novo estado local.
  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiBaseUrl}/logout`, {})
      .pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this._account.set(null);
    this._status.set('unauthenticated');
  }
}
