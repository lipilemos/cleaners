import { Review } from '@cleaners/models';

// Stub manual até T07 gerar os *Dto reais a partir do OpenAPI do backend — ver CLAUDE.md secao 6.2.
export type ReviewDto = Review;

export function toReviewModel(dto: ReviewDto): Review {
  return dto;
}

export interface CreateReviewRequest {
  readonly professionalId: string;
  readonly bookingId: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly comment: string;
}
