import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component';
import { LoginFormCredentials } from './login-form-credentials';

// Componente apresentacional puro (CLAUDE.md secao 3): não conhece SessionStore nem domínio de auth,
// não faz HTTP, não decide para onde navegar. Reaproveitado pelo LoginComponent de client-app e de
// professional-portal — cada um injeta seu próprio SessionStore<TAccount>, trata loading/erro/redirect
// e passa esse estado via input()/escuta o output() de submit.
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormFieldErrorComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('loginForm')],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  // Chave de tradução do título. Padrão cobre o caso comum ("Entrar"); um app pode sobrescrever com
  // uma chave própria (ex.: professional-portal usa 'login.title' do seu assets/i18n) quando precisar
  // de um texto diferente sem duplicar o restante do form.
  readonly titleKey = input('loginForm.title');
  readonly loading = input(false);
  readonly errorKey = input<string | null>(null);

  readonly submitted = output<LoginFormCredentials>();

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }
}
