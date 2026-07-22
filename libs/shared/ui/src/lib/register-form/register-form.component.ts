import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
import { RegisterFormCredentials } from './register-form-credentials';

function passwordsMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

// Componente apresentacional puro (CLAUDE.md secao 3), mesmo padrão do LoginFormComponent: não conhece
// SessionStore nem faz HTTP. Reaproveitado pelo RegisterComponent de client-app (cadastro de User) e de
// professional-portal (cadastro de Professional) — os campos são idênticos nos dois casos.
@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormFieldErrorComponent,
    PhoneInputComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('registerForm')],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly titleKey = input('registerForm.title');
  readonly loading = input(false);
  readonly errorKey = input<string | null>(null);

  readonly submitted = output<RegisterFormCredentials>();

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, phone, password } = this.form.getRawValue();
    this.submitted.emit({ name, email, phone, password });
  }
}
