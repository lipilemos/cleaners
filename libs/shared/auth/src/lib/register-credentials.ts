// Corpo enviado ao endpoint de cadastro (ver REGISTER_PATH). A API .NET responde com a conta recém-criada
// já autenticada (mesmo contrato de LoginCredentials/POST /login) e seta o cookie httpOnly de sessão.
export interface RegisterCredentials {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone: string;
}
