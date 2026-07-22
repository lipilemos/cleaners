import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials, SessionStore } from '@cleaners/auth';
import { LoginFormComponent, LoginFormCredentials } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProfessionalAccount } from '../../../core/session/professional-account';

// Rota pós-login do profissional — placeholder até a feature `availability` existir (Fase 5).
const HOME_PATH = '/availability';

// Login separado e independente do client-app (CLAUDE.md secao 1.2): mesmo endpoint /login da
// API, mas fluxo/tela próprios do portal do profissional. O form em si (LoginFormComponent,
// @cleaners/ui) é compartilhado e apresentacional; este container injeta o SessionStore<ProfessionalAccount>
// do professional-portal, trata loading/erro e decide para onde navegar após o login.
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
  private readonly sessionStore =
    inject<SessionStore<ProfessionalAccount>>(SessionStore);

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
