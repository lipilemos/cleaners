import { Route } from '@angular/router';

export const userProfileRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./user-profile.component').then((m) => m.UserProfileComponent),
  },
];
