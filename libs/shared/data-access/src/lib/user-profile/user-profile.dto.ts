import { User, UserAddress } from '@cleaners/models';

// Forma real de CleanersApi.Application.Dtos.UserProfileDto (GET/PUT /api/users/me) — ver CLAUDE.md
// secao 1.3. Sem `preferredLanguage`: essa preferência não é persistida no backend ainda (vive só no
// LanguageStore do frontend, CLAUDE.md secao 7), então a mapeamos com um valor default aqui.
export interface UserProfileDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly photoUrl: string;
  readonly address: UserAddressDto;
}

export interface UserAddressDto {
  readonly street: string;
  readonly number: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly latitude: number;
  readonly longitude: number;
}

const DEFAULT_PREFERRED_LANGUAGE = 'pt-BR';

export function toUserModel(dto: UserProfileDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    photoUrl: dto.photoUrl,
    address: dto.address,
    preferredLanguage: DEFAULT_PREFERRED_LANGUAGE,
  };
}

// Dados sensíveis (telefone, endereço exato — CLAUDE.md secao 5.4): só trafegam no corpo de um PUT
// autenticado por cookie httpOnly, nunca em query params, nunca logados.
export interface UpdateUserProfileRequest {
  readonly name: string;
  readonly phone: string;
  readonly address: UserAddress;
}
