import { Route } from '@angular/router';
import { ProfessionalDetailStore } from './professional-detail.store';

export const professionalDetailRoutes: Route[] = [
  {
    path: '',
    providers: [ProfessionalDetailStore],
    loadComponent: () =>
      import('./professional-detail.component').then(
        (m) => m.ProfessionalDetailComponent,
      ),
  },
];
