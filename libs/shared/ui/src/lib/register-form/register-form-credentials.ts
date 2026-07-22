// Payload emitido no submit do formulário de cadastro. Tipo local ao design system (libs/shared/ui não
// depende de libs/shared/auth, ver eslint.config.mjs) — estruturalmente compatível com RegisterCredentials
// de @cleaners/auth; cada RegisterComponent (container, em apps/*) faz a ponte para o SessionStore.
export interface RegisterFormCredentials {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
}
