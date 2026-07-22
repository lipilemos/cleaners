import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Lógica pura e testável (CLAUDE.md secao 4: "sem lógica de negócio em templates"): compara os
// horários HH:mm de início/fim de uma regra de disponibilidade. Comparação lexicográfica é segura
// aqui porque o formato é sempre "HH:mm" (24h, dois dígitos), preenchido pelo input nativo type="time".
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return startTime < endTime;
}

// Validador de FormGroup por dia da semana: um dia desabilitado nunca bloqueia o salvamento, mesmo
// com horários vazios/default — só valida o intervalo quando o profissional efetivamente o ativa.
export const timeRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const enabled = control.get('enabled')?.value as boolean;
  const startTime = control.get('startTime')?.value as string;
  const endTime = control.get('endTime')?.value as string;

  if (!enabled) {
    return null;
  }

  if (!startTime || !endTime || !isValidTimeRange(startTime, endTime)) {
    return { invalidTimeRange: true };
  }

  return null;
};
