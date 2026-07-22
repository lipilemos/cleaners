// Ponto geográfico simples (latitude/longitude), reaproveitado por qualquer feature que precise de
// distância/localização (ex.: professionals-list no client-app). Não é um model de domínio (não tem
// id, não representa uma entidade da API) — por isso vive em util, não em @cleaners/models.
export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Distância aproximada entre dois pontos (fórmula de haversine), em km, arredondada a 1 casa decimal
// para exibição. Função pura e testável — nunca inline em componente/template (ver CLAUDE.md secao 4).
export function haversineDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return Math.round(distanceKm * 10) / 10;
}
