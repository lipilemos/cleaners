import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials, SessionStore } from '@cleaners/auth';
import { User } from '@cleaners/models';
import { LoginFormComponent, LoginFormCredentials } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';

// Rota pós-login do usuário — placeholder até a feature `professionals-list` existir (Fase 4).
const HOME_PATH = '/professionals';

// Container fino: LoginFormComponent (@cleaners/ui) é apresentacional e não conhece SessionStore/auth
// (CLAUDE.md secao 3) — este componente injeta o SessionStore<User> do client-app, trata loading/erro
// e decide para onde navegar após o login.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginFormComponent, RouterLink, TranslocoPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly sessionStore = inject<SessionStore<User>>(SessionStore);

  protected readonly loading = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected handleSubmit(credentials: LoginFormCredentials): void {
    this.loading.set(true);
    this.errorKey.set(null);

    const loginCredentials: LoginCredentials = credentials;

    this.sessionStore.login(loginCredentials).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl(HOME_PATH);
      },
      error: () => {
        this.loading.set(false);
        this.errorKey.set('loginForm.invalidCredentialsMessage');
      },
    });
  }
}
