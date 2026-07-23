import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  isSupportedLanguage,
} from './supported-languages.js';

const STORAGE_KEY = 'cleaners-app-language';

// Estado global (exceção da secao 7 do CLAUDE.md, mesmo padrão do SessionStore).
// client-app e professional-portal têm cada um sua própria instância — sem estado compartilhado em runtime.
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly transloco = inject(TranslocoService);

  readonly current = signal<SupportedLanguage>(this.readInitialLanguage());

  constructor() {
    this.transloco.setActiveLang(this.current());
  }

  setLanguage(lang: SupportedLanguage): void {
    this.transloco.setActiveLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.current.set(lang);
  }

  private readInitialLanguage(): SupportedLanguage {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isSupportedLanguage(saved)) {
      return saved;
    }

    const browserLang = navigator.language.slice(0, 2);
    const matched = SUPPORTED_LANGUAGES.find((lang) =>
      lang.startsWith(browserLang),
    );
    return matched ?? 'pt-BR';
  }
}
