import { ProfessionalSummary } from '@cleaners/models';
import { ProfessionalCardViewModel } from '@cleaners/ui';

// Mapeamento explícito ProfessionalSummary -> ProfessionalCardViewModel (nunca um `as` silencioso —
// CLAUDE.md secao 6): a listagem-resumo do backend já traz averageRating/reviewCount prontos (sem
// reviews[] por item) e ainda não expõe coordenadas do profissional, então distanceKm fica ausente
// até a API passar a devolver essa informação.
export function toProfessionalCardViewModel(
  professional: ProfessionalSummary,
): ProfessionalCardViewModel {
  return {
    id: professional.id,
    name: professional.name,
    photoUrl: professional.photoUrl,
    serviceNames: professional.services.map((service) => service.name),
    averageRating: professional.averageRating,
    reviewCount: professional.reviewCount,
    isFeatured: professional.isFeatured,
    city: professional.city,
    state: professional.state,
  };
}
