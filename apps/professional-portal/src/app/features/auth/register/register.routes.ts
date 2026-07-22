import { Route } from '@angular/router';

export const registerRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./register.component').then((m) => m.RegisterComponent),
  },
];
