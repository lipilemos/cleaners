// Função pura de manipulação de data, reaproveitada por qualquer feature (ex.: booking, ao montar o
// intervalo `from`/`to` consultado em CalendarMcpService.getAvailability). Nunca usa lógica de fuso
// horário implícita além da do próprio `Date` do JS — o backend é a fonte de verdade sobre disponibilidade real.
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}
