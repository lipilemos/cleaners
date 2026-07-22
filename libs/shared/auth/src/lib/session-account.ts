// Forma mínima comum ao /me de qualquer um dos dois apps.
// client-app tipa como User, professional-portal tipa como Professional (ambos de @cleaners/models).
export interface SessionAccount {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export type SessionStatus =
  'idle' | 'loading' | 'authenticated' | 'unauthenticated';
