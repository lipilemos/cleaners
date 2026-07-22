export interface Review {
  readonly id: string;
  readonly bookingId: string;
  readonly authorUserId: string;
  readonly authorName: string;
  readonly professionalId: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly comment?: string;
  readonly createdAt: string;
}
