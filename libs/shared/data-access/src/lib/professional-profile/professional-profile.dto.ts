import {
  Currency,
  Professional,
  ProfessionalAccount,
  ProfessionalReview,
  Service,
} from '@cleaners/models';
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
// `currency`: código ISO 4217 ("BRL"/"USD"/"EUR"), mesmo achatamento enum→string usado por BookingDto.status.
export interface ServiceDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly currency: Currency;
  readonly durationMinutes: number;
}

export interface CreateServiceRequest {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly currency: Currency;
  readonly durationMinutes: number;
}

export type UpdateServiceRequest = CreateServiceRequest;

export function toServiceModel(dto: ServiceDto): Service {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    priceFrom: dto.price,
    currency: dto.currency,
    durationMinutes: dto.durationMinutes,
  };
}

// Shape real de ProfessionalAccountDataDto (GET/PUT /api/professionals/me/account-data, cleaners-api) —
// "meus dados" (aba própria, professional-profile), distinto do ProfessionalProfileDto acima (aba
// "Meus serviços"). Sem `number` (endereço do Professional é uma única string) e sem
// latitude/longitude (não editados nesta tela, CLAUDE.md secao 1.3).
export interface ProfessionalAccountDataDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly photoUrl: string;
  readonly address: ProfessionalAccountAddressDto;
}

export interface ProfessionalAccountAddressDto {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
}

// Dados sensíveis (telefone, endereço exato — CLAUDE.md secao 5.4): só trafegam no corpo de um PUT
// autenticado por cookie httpOnly, nunca em query params, nunca logados. Sem `email` — não editável por
// este endpoint (mesma restrição de UpdateUserProfileRequest).
export interface UpdateProfessionalAccountDataRequest {
  readonly name: string;
  readonly phone: string;
  readonly address: ProfessionalAccountAddressDto;
}

export function toProfessionalAccountModel(
  dto: ProfessionalAccountDataDto,
): ProfessionalAccount {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    photoUrl: dto.photoUrl,
    address: dto.address,
  };
}
