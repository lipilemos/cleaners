import { Service } from './service.model';

export interface Professional {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly services: Service[];
  // Nota nunca vem pronta da API como campo solto — é sempre derivada (computed) desta lista.
  readonly reviews: ProfessionalReview[];
  readonly city: string;
  readonly state: string;
  readonly isFeatured: boolean;
  readonly hasConnectedCalendar: boolean;
}

// Avaliação embutida no detalhe do profissional (GET /professionals/{id}) — forma reduzida em
// relação a Review (libs/shared/models/review.model.ts): sem bookingId/authorUserId/professionalId,
// que não são necessários para exibição e não são expostos por este endpoint público.
export interface ProfessionalReview {
  readonly id: string;
  readonly authorName: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly comment?: string;
  readonly createdAt: string;
}
