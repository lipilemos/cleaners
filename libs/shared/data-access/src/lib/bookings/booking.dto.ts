import { Booking } from '@cleaners/models';

// Stub manual até T07 gerar os *Dto reais a partir do OpenAPI do backend — ver CLAUDE.md secao 6.2.
export type BookingDto = Booking;

export function toBookingModel(dto: BookingDto): Booking {
  return dto;
}
