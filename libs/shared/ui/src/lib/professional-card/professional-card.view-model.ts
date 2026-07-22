// ViewModel apresentacional — nunca o Professional inteiro (evita expor dados sensíveis futuros no card).
export interface ProfessionalCardViewModel {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly serviceNames: string[];
  // Computado pelo container a partir de reviews[] — nunca um campo solto editável.
  readonly averageRating: number;
  readonly reviewCount: number;
  // Ausente até a API expor coordenadas do profissional na listagem-resumo (ver ProfessionalSummaryDto).
  readonly distanceKm?: number;
  readonly isFeatured: boolean;
  // Exibidos como alternativa quando distanceKm ainda não está disponível (ver comentário acima).
  readonly city: string;
  readonly state: string;
}
