import { Route } from '@angular/router';
import { ProfessionalProfileStore } from './professional-profile.store';

export const professionalProfileRoutes: Route[] = [
  {
    path: '',
    providers: [ProfessionalProfileStore],
    loadComponent: () =>
      import('./professional-profile.component').then(
        (m) => m.ProfessionalProfileComponent,
      ),
  },
];
