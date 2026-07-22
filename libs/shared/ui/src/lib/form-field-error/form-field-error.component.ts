import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

// Centraliza a chave de tradução por tipo de erro de validação, reaproveitado por qualquer form
// dos dois apps (ver angular-material-ui: "texto centralizado, não strings soltas duplicadas por form").
export interface FormFieldErrorMessages {
  readonly [validatorKey: string]: string;
}

const DEFAULT_ERROR_KEYS: FormFieldErrorMessages = {
  required: 'formFieldError.required',
  email: 'formFieldError.email',
  pattern: 'formFieldError.pattern',
  minlength: 'formFieldError.minlength',
  maxlength: 'formFieldError.maxlength',
  min: 'formFieldError.outOfRange',
  max: 'formFieldError.outOfRange',
};

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [MatFormFieldModule, TranslocoPipe],
  providers: [provideTranslocoScope('formFieldError')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (activeErrorKey(); as key) {
      <mat-error>{{ key | transloco }}</mat-error>
    }
  `,
})
export class FormFieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();
  // Permite um form estender/sobrescrever a chave de tradução para uma validação específica (ex.: telefone).
  readonly messages = input<FormFieldErrorMessages>({});

  // AbstractControl não é reativo por padrão: markAsTouched()/markAllAsTouched() não emite
  // statusChanges, então sem isso o computed() abaixo nunca reavaliaria após o primeiro render
  // (OnPush + nenhum signal real como dependência). control.events cobre touched/dirty/status/value.
  private readonly controlTick = signal(0);

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      if (!control) return;
      const subscription = control.events.subscribe(() =>
        this.controlTick.update((n) => n + 1),
      );
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected readonly activeErrorKey = computed(() => {
    this.controlTick();
    const control = this.control();
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return null;
    }

    const allMessages = { ...DEFAULT_ERROR_KEYS, ...this.messages() };
    const firstErrorKey = Object.keys(control.errors)[0];
    return allMessages[firstErrorKey] ?? null;
  });
}
