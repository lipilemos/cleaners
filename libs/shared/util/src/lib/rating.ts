import { Review } from '@cleaners/models';

// Nota média nunca vem pronta/editável da API como campo solto — é sempre derivada da lista de
// reviews (CLAUDE.md secao 5.2). Função pura e testável, reaproveitada por qualquer feature/store
// que precise montar um ViewModel com nota (professionals-list, professional-detail).
export function calculateAverageRating(
  reviews: readonly Pick<Review, 'rating'>[],
): number {
  if (reviews.length === 0) {
    return 0;
  }

  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
