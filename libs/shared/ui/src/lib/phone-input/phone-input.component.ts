import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

// Wrapper reutilizável sobre MatFormField+MatInput para telefone — usado por qualquer form dos
// dois apps (cadastro de User em client-app, perfil de Professional em professional-portal).
@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, TranslocoPipe],
  providers: [
    provideTranslocoScope('phoneInput'),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phone-input.component.html',
})
export class PhoneInputComponent implements ControlValueAccessor {
  // Chave de tradução, nunca o texto já traduzido — quem chama (ex.: RegisterFormComponent) deve
  // passar algo como 'registerForm.phoneLabel', e a tradução acontece aqui dentro. Passar o resultado
  // já traduzido de fora (`'x' | transloco` no template do pai) fixava o texto na primeira chamada:
  // se essa chamada acontecesse antes do escopo daquele form carregar, a label ficava presa mostrando
  // a chave crua para sempre (o rebind do input não reavaliava o pipe do lado de fora).
  readonly labelKey = input<string>();
  readonly disabled = input(false);

  protected readonly resolvedLabelKey = computed(
    () => this.labelKey() ?? 'phoneInput.label',
  );

  protected value = '';
  protected isDisabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  protected handleInput(rawValue: string): void {
    this.value = formatBrazilianPhone(rawValue);
    this.onChange(this.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}

function formatBrazilianPhone(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
