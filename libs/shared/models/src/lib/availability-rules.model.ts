// 🔗 API (suposição — endpoint ainda não existe em cleaners-api, ver TASKS.md T27): modela as regras
// semanais básicas de disponibilidade que o profissional define no professional-portal (dias/horários
// de trabalho). O MCP/backend usa isso para restringir os slots retornados por
// CalendarMcpService.getAvailability aos horários realmente livres na Google Agenda dentro dessa janela
// — o Angular nunca decide disponibilidade sozinho (CLAUDE.md secao 1.1), só edita a preferência.
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo ... 6 = sábado (Date#getDay()).

export interface WeeklyAvailabilityRule {
  readonly dayOfWeek: WeekDay;
  readonly enabled: boolean;
  // formato "HH:mm", 24h.
  readonly startTime: string;
  readonly endTime: string;
}

export interface AvailabilityRules {
  readonly rules: readonly WeeklyAvailabilityRule[];
}
