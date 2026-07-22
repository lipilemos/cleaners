import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { RegisterCredentials, SessionStore } from '@cleaners/auth';
import { RegisterFormComponent, RegisterFormCredentials } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProfessionalAccount } from '../../../core/session/professional-account';

// Rota pós-cadastro do profissional — mesmo destino do pós-login (LoginComponent).
const HOME_PATH = '/availability';

// Cadastro separado e independente do client-app (CLAUDE.md secao 1.2), mesmo padrão do LoginComponent
// deste app: RegisterFormComponent (@cleaners/ui) é compartilhado e apresentacional; este container
// injeta o SessionStore<ProfessionalAccount>, trata loading/erro e decide para onde navegar após o cadastro.
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RegisterFormComponent, RouterLink, TranslocoPipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly sessionStore =
    inject<SessionStore<ProfessionalAccount>>(SessionStore);

  protected readonly loading = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected handleSubmit(credentials: RegisterFormCredentials): void {
    this.loading.set(true);
    this.errorKey.set(null);

    const registerCredentials: RegisterCredentials = credentials;

    this.sessionStore.register(registerCredentials).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl(HOME_PATH);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        const isConflict =
          error instanceof HttpErrorResponse && error.status === 409;
        this.errorKey.set(
          isConflict
            ? 'registerForm.emailAlreadyRegisteredMessage'
            : 'registerForm.genericErrorMessage',
        );
      },
    });
  }
}
