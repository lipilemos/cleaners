import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { LANG_TO_LOCALE_MAPPING } from './supported-languages.js';

// Mapeia os idiomas suportados (chaves do Transloco) para o locale ICU usado por
// TranslocoDatePipe/TranslocoDecimalPipe, para que a formatação acompanhe o idioma
// ativo (LanguageStore), não o locale padrão do navegador/Angular.
export function provideTranslocoLocaleConfig() {
  return provideTranslocoLocale({
    langToLocaleMapping: LANG_TO_LOCALE_MAPPING,
  });
}
