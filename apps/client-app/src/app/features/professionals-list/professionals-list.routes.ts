import { Route } from '@angular/router';
import { ProfessionalsListStore } from './professionals-list.store';

export const professionalsListRoutes: Route[] = [
  {
    path: '',
    providers: [ProfessionalsListStore],
    loadComponent: () =>
      import('./professionals-list.component').then(
        (m) => m.ProfessionalsListComponent,
      ),
  },
];
