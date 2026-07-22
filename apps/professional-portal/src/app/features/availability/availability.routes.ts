import { Route } from '@angular/router';
import { AvailabilityStore } from './availability.store';

export const availabilityRoutes: Route[] = [
  {
    path: '',
    providers: [AvailabilityStore],
    loadComponent: () =>
      import('./availability.component').then((m) => m.AvailabilityComponent),
  },
];
