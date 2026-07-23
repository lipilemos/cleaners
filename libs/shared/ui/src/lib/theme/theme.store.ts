import { Injectable, signal } from '@angular/core';

export const APP_THEMES = ['light', 'dark'] as const;

export type AppTheme = (typeof APP_THEMES)[number];

const STORAGE_KEY = 'cleaners-app-theme';

// Mesmo padrão do LanguageStore (localStorage -> preferência do sistema -> default), mas para tema.
// providedIn: 'root' -> cada app (client-app/professional-portal) tem sua própria instância (bundles
// separados), sem estado compartilhado em runtime, mesmo princípio da secao 7 do CLAUDE.md.
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _current = signal<AppTheme>(this.readInitialTheme());

  readonly current = this._current.asReadonly();

  constructor() {
    this.applyTheme(this._current());
  }

  setTheme(theme: AppTheme): void {
    this._current.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this._current() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(theme: AppTheme): void {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme === 'light');
  }

  private readInitialTheme(): AppTheme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if ((APP_THEMES as readonly string[]).includes(saved ?? '')) {
      return saved as AppTheme;
    }
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)',
    ).matches;
    return prefersDark ? 'dark' : 'light';
  }
}
