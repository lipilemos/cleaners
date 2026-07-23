// Função pura de manipulação de data, reaproveitada por qualquer feature (ex.: booking, ao montar o
// intervalo `from`/`to` consultado em CalendarMcpService.getAvailability). Nunca usa lógica de fuso
// horário implícita além da do próprio `Date` do JS — o backend é a fonte de verdade sobre disponibilidade real.
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

// Chave local "YYYY-MM-DD" (fuso do próprio navegador, sem UTC) usada para agrupar/comparar itens por
// dia de calendário (ex.: Bookings num mês, feature incoming-bookings/calendar). Não serve para cálculo
// de disponibilidade real — isso é sempre responsabilidade do backend/MCP.
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ISO 8601 com o offset LOCAL do navegador preservado (ex.: "2026-07-23T00:00:00-03:00"), ao contrário
// de Date.toISOString() que sempre normaliza para UTC ("Z"). Usado ao consultar
// GET /api/professionals/{id}/availability (CalendarMcpService.getAvailability): o backend
// (AvailabilityService, cleaners-api) combina o offset de `from`/`to` com os horários "de parede" das
// ProfessionalAvailabilityRule para montar as janelas de disponibilidade — se `from`/`to` chegam em UTC,
// as regras de horário de funcionamento acabam interpretadas como se já estivessem em UTC, deslocando
// todos os horários pelo offset local do profissional (ex.: 09:00–18:00 vira 06:00–15:00 em UTC-3).
export function toLocalIsoString(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const offsetMins = pad(Math.abs(offsetMinutes) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMins}`;
}
