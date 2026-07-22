import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StarRatingComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';
import { ProfessionalDetailStore } from './professional-detail.store';

// Container: resolve o :professionalId da rota, delega o carregamento ao store e não conhece HTTP
// diretamente (CLAUDE.md secao 6). StarRatingComponent (@cleaners/ui) recebe só a nota computed.
@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StarRatingComponent,
    TranslocoPipe,
  ],
  templateUrl: './professional-detail.component.html',
  styleUrl: './professional-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly store = inject(ProfessionalDetailStore);

  private readonly professionalId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('professionalId'))),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const id = this.professionalId();
      if (id) {
        this.store.load(id);
      }
    });
  }

  protected goBack(): void {
    void this.router.navigateByUrl('/professionals');
  }

  protected scheduleBooking(): void {
    const id = this.professionalId();
    if (id) {
      void this.router.navigate(['/professionals', id, 'booking']);
    }
  }
}
