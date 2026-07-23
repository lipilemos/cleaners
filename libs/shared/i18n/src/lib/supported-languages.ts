export const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Locale ICU correspondente a cada idioma suportado — fonte única reaproveitada tanto por
// TranslocoDatePipe/TranslocoDecimalPipe (provideTranslocoLocaleConfig) quanto por qualquer
// DateAdapter do Angular Material (ex.: mat-calendar), para que a formatação de data acompanhe o
// idioma ativo (LanguageStore) em vez do locale padrão do navegador/Angular.
export const LANG_TO_LOCALE_MAPPING: Record<SupportedLanguage, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};

export interface SupportedLanguageOption {
  readonly code: SupportedLanguage;
  readonly label: string;
  readonly flag: string;
}

// Label no próprio idioma nativo — não traduzido, ver skill i18n-multi-language.
export const SUPPORTED_LANGUAGE_OPTIONS: readonly SupportedLanguageOption[] = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
