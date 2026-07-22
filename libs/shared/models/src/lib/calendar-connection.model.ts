export interface CalendarConnection {
  readonly userId: string;
  readonly provider: 'google';
  readonly connected: boolean;
  readonly calendarId?: string;
  readonly connectedAt?: string;
}
