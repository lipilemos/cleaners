import { Route } from '@angular/router';
import {
  createAuthGuard,
  createRedirectIfAuthenticatedGuard,
} from '@cleaners/auth';

const authGuard = createAuthGuard('/login');
const redirectIfAuthenticatedGuard =
  createRedirectIfAuthenticatedGuard('/professionals');

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
    path: 'professionals',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/professionals-list/professionals-list.routes').then(
        (m) => m.professionalsListRoutes,
      ),
  },
  {
    path: 'professionals/:professionalId/booking',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/booking/booking.routes').then((m) => m.bookingRoutes),
  },
  {
    path: 'professionals/:professionalId',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/professional-detail/professional-detail.routes').then(
        (m) => m.professionalDetailRoutes,
      ),
  },
  {
    path: 'bookings/:bookingId/review',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/reviews/reviews.routes').then((m) => m.reviewsRoutes),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/user-profile/user-profile.routes').then(
        (m) => m.userProfileRoutes,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'professionals' },
  { path: '**', redirectTo: 'professionals' },
];
