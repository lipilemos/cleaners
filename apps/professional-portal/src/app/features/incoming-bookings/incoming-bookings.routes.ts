import { Route } from '@angular/router';
import { IncomingBookingsStore } from './incoming-bookings.store';

export const incomingBookingsRoutes: Route[] = [
  {
    path: '',
    providers: [IncomingBookingsStore],
    loadComponent: () =>
      import('./incoming-bookings.component').then(
        (m) => m.IncomingBookingsComponent,
      ),
  },
];
