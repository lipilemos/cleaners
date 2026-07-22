import { Route } from '@angular/router';

export const reviewsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./review.component').then((m) => m.ReviewComponent),
  },
];
