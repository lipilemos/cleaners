import { Professional, ProfessionalReview, Service } from '@cleaners/models';
import { ProfessionalReviewDto } from '../professionals/professional.dto';

// Shape real de GET /professionals/me hoje (ProfessionalDetailDto em cleaners-api, B21) — igual ao
// ProfessionalDetailDto consumido por professionals/professional.dto.ts (client-app), mas resolvido
// pela sessão (cookie httpOnly) em vez de {id} na rota, ver ProfessionalProfileService.getMine().
export interface ProfessionalProfileDto {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly services: readonly ServiceDto[];
  readonly averageRating: number;
  readonly reviewCount: number;
  readonly isFeatured: boolean;
  readonly city: string;
  readonly state: string;
  readonly hasConnectedCalendar: boolean;
  readonly reviews: readonly ProfessionalReviewDto[];
}

export function toProfessionalProfileModel(
  dto: ProfessionalProfileDto,
): Professional {
  return {
    id: dto.id,
    name: dto.name,
    photoUrl: dto.photoUrl,
    services: dto.services.map(toServiceModel),
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

// CRUD dos serviços oferecidos pelo profissional logado (T31 frontend / B21 backend), resolvido pela
// sessão (cookie), no mesmo padrão de "/me/..." usado por UserProfileService/CalendarMcpService.
// Shape real de ServiceDto/CreateServiceRequestDto em cleaners-api (src/CleanersApi.Application/Dtos):
// `price` (não `priceFrom`) e `durationMinutes` obrigatório — não reutilizar o model `Service` como DTO.
export interface ServiceDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly durationMinutes: number;
}

export interface CreateServiceRequest {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly durationMinutes: number;
}

export type UpdateServiceRequest = CreateServiceRequest;

export function toServiceModel(dto: ServiceDto): Service {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    priceFrom: dto.price,
    durationMinutes: dto.durationMinutes,
  };
}
