import { SessionAccount } from '@cleaners/auth';

// Conta de sessão do profissional autenticado (GET/POST /me, /login) — um subconjunto enxuto,
// não o agregado `Professional` completo de @cleaners/models (que carrega services[]/reviews[]
// usados pelo card público do client-app e não fazem parte da resposta de sessão do próprio
// profissional). `Professional` também não modela `email`, exigido pela sessão para autenticação.
export interface ProfessionalAccount extends SessionAccount {
  readonly photoUrl: string;
}
