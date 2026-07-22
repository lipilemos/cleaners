import { Route } from '@angular/router';

export const loginRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./login.component').then((m) => m.LoginComponent),
  },
];
