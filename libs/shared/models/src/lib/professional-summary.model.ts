// Forma resumida devolvida por GET /professionals e GET /professionals/{id} (ver ProfessionalSummaryDto
// no /openapi/v1.json da API): a listagem já vem com nota/contagem de avaliações pré-calculadas
// (evita mandar reviews[] completo por item) e ainda não expõe coordenadas do profissional.
// city/state: campos novos, pendentes de expor no ProfessionalSummaryDto real da cleaners-api — servem
// à busca por cidade da lista (professionals-list) sem precisar do endereço/zipCode completo, que só
// existe no Professional detalhado (ProfessionalLocation).
export interface ProfessionalSummary {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly services: readonly ProfessionalSummaryService[];
  readonly averageRating: number;
  readonly reviewCount: number;
  readonly isFeatured: boolean;
  readonly city: string;
  readonly state: string;
}

export interface ProfessionalSummaryService {
  readonly id: string;
  readonly name: string;
}
