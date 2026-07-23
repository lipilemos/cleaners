import { HttpClient } from '@angular/common/http';
import { Injectable, inject, isDevMode } from '@angular/core';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@jsverse/transloco';
import { SUPPORTED_LANGUAGES } from './supported-languages.js';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

// Cada app registra seu próprio TranslocoHttpLoader (busca em /assets/i18n/{lang}.json daquele app);
// libs/shared/i18n só define a config comum reaproveitada pelos dois.
export function provideTranslocoConfig() {
  return provideTransloco({
    config: {
      availableLangs: [...SUPPORTED_LANGUAGES],
      defaultLang: 'pt-BR',
      fallbackLang: 'pt-BR',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      missingHandler: {
        useFallbackTranslation: true,
        logMissingKey: true,
      },
    },
    loader: TranslocoHttpLoader,
  });
}
