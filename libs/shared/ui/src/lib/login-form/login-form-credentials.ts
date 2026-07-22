// Payload emitido no submit do formulário de login. Tipo local ao design system: libs/shared/ui
// não pode depender de libs/shared/auth (ver eslint.config.mjs, type:ui não inclui type:auth), então
// não importamos LoginCredentials daqui. É estruturalmente compatível com LoginCredentials de
// @cleaners/auth — cada LoginComponent (container, em apps/*) faz a ponte explícita para o SessionStore.
export interface LoginFormCredentials {
  readonly email: string;
  readonly password: string;
}
