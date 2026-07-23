import {
  Currency,
  Professional,
  ProfessionalReview,
  ProfessionalSummary,
} from '@cleaners/models';

// Shape real de GET /professionals/{id} hoje (ver ProfessionalDetailDto em /openapi/v1.json da API):
// igual ao ProfessionalSummaryDto da listagem, mais reviews[] e hasConnectedCalendar para a tela de
// perfil (client-app feature professional-detail) — não expõe endereço/CEP/telefone (CLAUDE.md 5.4/1.3).
export interface ProfessionalDetailDto {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly services: readonly ProfessionalDetailServiceDto[];
  readonly averageRating: number;
  readonly reviewCount: number;
  readonly isFeatured: boolean;
  readonly city: string;
  readonly state: string;
  readonly hasConnectedCalendar: boolean;
  readonly reviews: readonly ProfessionalReviewDto[];
}

export interface ProfessionalDetailServiceDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly currency: Currency;
  readonly durationMinutes: number;
}

export interface ProfessionalReviewDto {
  readonly id: string;
  readonly authorName: string;
  readonly rating: number;
  readonly comment: string;
  readonly createdAt: string;
}

export function toProfessionalModel(dto: ProfessionalDetailDto): Professional {
  return {
    id: dto.id,
    name: dto.name,
    photoUrl: dto.photoUrl,
    services: dto.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceFrom: service.price,
      currency: service.currency,
      durationMinutes: service.durationMinutes,
    })),
    reviews: dto.reviews.map(toProfessionalReviewModel),
    city: dto.city,
    state: dto.state,
    isFeatured: dto.isFeatured,
    hasConnectedCalendar: dto.hasConnectedCalendar,
  };
}

function toProfessionalReviewModel(
  dto: ProfessionalReviewDto,
): ProfessionalReview {
  return {
    id: dto.id,
    authorName: dto.authorName,
    rating: Math.min(
      5,
      Math.max(1, Math.round(dto.rating)),
    ) as ProfessionalReview['rating'],
    comment: dto.comment || undefined,
    createdAt: dto.createdAt,
  };
}

// Shape real de GET /professionals hoje (ver ProfessionalSummaryDto em /openapi/v1.json da API) — não
// tem endereço completo/reviews/hasConnectedCalendar, por isso usa ProfessionalSummary em vez de forçar
// o Professional completo (que exigiria inventar esses campos).
export interface ProfessionalSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly services: readonly { readonly id: string; readonly name: string }[];
  readonly averageRating: number;
  readonly reviewCount: number;
  readonly isFeatured: boolean;
  readonly city: string;
  readonly state: string;
}

export function toProfessionalSummary(
  dto: ProfessionalSummaryDto,
): ProfessionalSummary {
  return dto;
}
