import { Route } from '@angular/router';
import {
  createAuthGuard,
  createRedirectIfAuthenticatedGuard,
} from '@cleaners/auth';

const authGuard = createAuthGuard('/login');
const redirectIfAuthenticatedGuard =
  createRedirectIfAuthenticatedGuard('/availability');

export const appRoutes: Route[] = [
  {
    path: 'login',
    canActivate: [redirectIfAuthenticatedGuard],
    loadChildren: () =>
      import('./features/auth/login/login.routes').then((m) => m.loginRoutes),
  },
  {
    path: 'register',
    canActivate: [redirectIfAuthenticatedGuard],
    loadChildren: () =>
      import('./features/auth/register/register.routes').then(
        (m) => m.registerRoutes,
      ),
  },
  {
    path: 'availability',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/availability/availability.routes').then(
        (m) => m.availabilityRoutes,
      ),
  },
  {
    path: 'incoming-bookings',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/incoming-bookings/incoming-bookings.routes').then(
        (m) => m.incomingBookingsRoutes,
      ),
  },
  {
    path: 'reviews-received',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/reviews-received/reviews-received.routes').then(
        (m) => m.reviewsReceivedRoutes,
      ),
  },
  {
    path: 'professional-profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/professional-profile/professional-profile.routes').then(
        (m) => m.professionalProfileRoutes,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'availability' },
  { path: '**', redirectTo: 'availability' },
];
