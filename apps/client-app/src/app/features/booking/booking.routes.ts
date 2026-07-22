import { Route } from '@angular/router';
import { BookingStore } from './booking.store';

export const bookingRoutes: Route[] = [
  {
    path: '',
    providers: [BookingStore],
    loadComponent: () =>
      import('./booking.component').then((m) => m.BookingComponent),
  },
];
