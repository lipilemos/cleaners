// Código ISO 4217 das moedas suportadas hoje pelo cadastro de serviço (professional-profile).
export type Currency = 'BRL' | 'USD' | 'EUR';

export const SUPPORTED_CURRENCIES: readonly Currency[] = ['BRL', 'USD', 'EUR'];

export interface Service {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceFrom: number;
  readonly currency: Currency;
  // Usado hoje só pela feature `professional-profile` (portal do profissional), que precisa
  // coletar/exibir a duração para escrever o Service (POST/PUT /professionals/me/services) — as
  // demais features (professionals-list/professional-detail) só leem priceFrom para exibição.
  readonly durationMinutes: number;
}
