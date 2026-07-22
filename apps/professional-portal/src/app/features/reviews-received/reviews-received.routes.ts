import { Route } from '@angular/router';
import { ReviewsReceivedStore } from './reviews-received.store';

export const reviewsReceivedRoutes: Route[] = [
  {
    path: '',
    providers: [ReviewsReceivedStore],
    loadComponent: () =>
      import('./reviews-received.component').then(
        (m) => m.ReviewsReceivedComponent,
      ),
  },
];
