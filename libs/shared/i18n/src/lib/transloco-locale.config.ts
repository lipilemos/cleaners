import { provideTranslocoLocale } from '@jsverse/transloco-locale';

// Mapeia os idiomas suportados (chaves do Transloco) para o locale ICU usado por
// TranslocoDatePipe/TranslocoDecimalPipe, para que a formatação acompanhe o idioma
// ativo (LanguageStore), não o locale padrão do navegador/Angular.
export function provideTranslocoLocaleConfig() {
  return provideTranslocoLocale({
    langToLocaleMapping: {
      'pt-BR': 'pt-BR',
      en: 'en-US',
      es: 'es-ES',
    },
  });
}
