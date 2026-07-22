import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CalendarMcpService } from '@cleaners/data-access';
import {
  CalendarConnection,
  WeekDay,
  WeeklyAvailabilityRule,
} from '@cleaners/models';

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '18:00';

// Ordem de exibição: segunda a domingo (mais natural para uma agenda de trabalho). Os dados seguem a
// convenção dayOfWeek 0=domingo..6=sábado (Date#getDay(), ver libs/shared/models/availability-rules.model.ts).
export const DISPLAY_DAY_ORDER: readonly WeekDay[] = [1, 2, 3, 4, 5, 6, 0];

function buildDefaultRules(): WeeklyAvailabilityRule[] {
  return DISPLAY_DAY_ORDER.map((dayOfWeek) => ({
    dayOfWeek,
    enabled: false,
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
  }));
}

// Preenche os 7 dias mesmo se o backend devolver uma lista parcial (ex.: só os dias já configurados
// pelo profissional) — nunca deixa a UI com menos de 7 linhas. Função pura, testada isoladamente.
export function mergeWithDefaultRules(
  rules: readonly WeeklyAvailabilityRule[],
): WeeklyAvailabilityRule[] {
  const byDay = new Map(rules.map((rule) => [rule.dayOfWeek, rule]));
  return buildDefaultRules().map(
    (fallback) => byDay.get(fallback.dayOfWeek) ?? fallback,
  );
}

// Estado da feature `availability` (T27), injetado no escopo da rota (skill angular-signals-state).
// Conexão de agenda e regras de disponibilidade são dois fluxos independentes do mesmo
// CalendarMcpService (skill google-calendar-mcp-scheduling) — nunca decide disponibilidade real
// sozinho, só edita a preferência que o backend/MCP usa para calcular slots.
@Injectable()
export class AvailabilityStore {
  private readonly calendarMcpService = inject(CalendarMcpService);
  private readonly document = inject(DOCUMENT);

  private readonly _connection = signal<CalendarConnection | null>(null);
  private readonly _connectionLoading = signal(false);
  private readonly _connectionError = signal<string | null>(null);
  private readonly _connecting = signal(false);

  private readonly _rules =
    signal<WeeklyAvailabilityRule[]>(buildDefaultRules());
  private readonly _rulesLoading = signal(false);
  private readonly _rulesError = signal<string | null>(null);
  private readonly _saving = signal(false);
  private readonly _saveError = signal<string | null>(null);
  private readonly _savedAt = signal<number | null>(null);

  readonly connection = this._connection.asReadonly();
  readonly connectionLoading = this._connectionLoading.asReadonly();
  readonly connectionError = this._connectionError.asReadonly();
  readonly connecting = this._connecting.asReadonly();
  readonly isConnected = computed(() => this._connection()?.connected ?? false);

  readonly rules = this._rules.asReadonly();
  readonly rulesLoading = this._rulesLoading.asReadonly();
  readonly rulesError = this._rulesError.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();
  readonly savedAt = this._savedAt.asReadonly();

  loadConnectionStatus(): void {
    this._connectionLoading.set(true);
    this._connectionError.set(null);

    this.calendarMcpService.connectionStatus().subscribe({
      next: (connection) => {
        this._connection.set(connection);
        this._connectionLoading.set(false);
      },
      error: () => {
        this._connectionError.set('availability.connectionLoadErrorMessage');
        this._connectionLoading.set(false);
      },
    });
  }

  // Redireciona para o consentimento OAuth do Google (URL retornada pelo backend); o callback e a
  // troca de token acontecem inteiramente no backend/MCP (skill google-calendar-mcp-scheduling).
  connectCalendar(): void {
    this._connecting.set(true);
    this._connectionError.set(null);

    this.calendarMcpService.startConnection().subscribe({
      next: ({ authUrl }) => {
        this._connecting.set(false);
        this.document.location.href = authUrl;
      },
      error: () => {
        this._connecting.set(false);
        this._connectionError.set('availability.connectionStartErrorMessage');
      },
    });
  }

  loadRules(): void {
    this._rulesLoading.set(true);
    this._rulesError.set(null);

    this.calendarMcpService.getAvailabilityRules().subscribe({
      next: (result) => {
        this._rules.set(mergeWithDefaultRules(result.rules));
        this._rulesLoading.set(false);
      },
      error: () => {
        this._rulesError.set('availability.rulesLoadErrorMessage');
        this._rulesLoading.set(false);
      },
    });
  }

  saveRules(rules: readonly WeeklyAvailabilityRule[]): void {
    this._saving.set(true);
    this._saveError.set(null);

    this.calendarMcpService.updateAvailabilityRules({ rules }).subscribe({
      next: (result) => {
        this._rules.set(mergeWithDefaultRules(result.rules));
        this._saving.set(false);
        this._savedAt.set(Date.now());
      },
      error: () => {
        this._saving.set(false);
        this._saveError.set('availability.rulesSaveErrorMessage');
      },
    });
  }
}
