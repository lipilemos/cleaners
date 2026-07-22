import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ProfessionalCardViewModel } from './professional-card.view-model';

// Puro e apresentacional: sem HTTP, sem geolocalização, sem conhecimento de Professional/Review —
// só o ViewModel. Reaproveitado por client-app (lista/perfil) e professional-portal (pré-visualização do próprio perfil).
@Component({
  selector: 'app-professional-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    TranslocoPipe,
    StarRatingComponent,
  ],
  providers: [provideTranslocoScope('professionalCard')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './professional-card.component.html',
  styleUrl: './professional-card.component.scss',
})
export class ProfessionalCardComponent {
  readonly professional = input.required<ProfessionalCardViewModel>();
}
