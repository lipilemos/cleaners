export const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface SupportedLanguageOption {
  readonly code: SupportedLanguage;
  readonly label: string;
}

// Label no próprio idioma nativo — não traduzido, ver skill i18n-multi-language.
export const SUPPORTED_LANGUAGE_OPTIONS: readonly SupportedLanguageOption[] = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
