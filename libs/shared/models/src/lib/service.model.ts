export interface Service {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceFrom: number;
  // Usado hoje só pela feature `professional-profile` (portal do profissional), que precisa
  // coletar/exibir a duração para escrever o Service (POST/PUT /professionals/me/services) — as
  // demais features (professionals-list/professional-detail) só leem priceFrom para exibição.
  readonly durationMinutes: number;
}
