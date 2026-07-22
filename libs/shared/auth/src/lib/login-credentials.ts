// Corpo enviado a POST /login. A API .NET responde com a conta autenticada e seta o cookie
// httpOnly de sessão — o Angular nunca lê nem guarda um token a partir desta chamada.
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}
