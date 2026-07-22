import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Service } from '@cleaners/models';
import { FormFieldErrorComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { PortalToolbarComponent } from '../../core/shell/portal-toolbar/portal-toolbar.component';
import { EditServiceDialogComponent } from './edit-service-dialog/edit-service-dialog.component';
import { ProfessionalProfileStore } from './professional-profile.store';

// Container da feature `professional-profile` (T31): CRUD simples dos serviços oferecidos pelo
// profissional logado. Edição usa MatDialog (EditServiceDialogComponent) em vez de um form inline
// por linha — decisão de UI para manter este componente enxuto e reaproveitar Material (CLAUDE.md secao 2).
@Component({
  selector: 'app-professional-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormFieldErrorComponent,
    PortalToolbarComponent,
    TranslocoDecimalPipe,
    TranslocoPipe,
  ],
  templateUrl: './professional-profile.component.html',
  styleUrl: './professional-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationsService);

  protected readonly store = inject(ProfessionalProfileStore);

  protected readonly addForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    durationMinutes: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.store.load();

    effect(() => {
      if (this.store.lastAddedAt() !== null) {
        this.addForm.reset({
          name: '',
          description: '',
          price: 0,
          durationMinutes: 0,
        });
        this.notifications.success('professionalProfile.addSuccessMessage');
      }
    });
  }

  protected submitAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.store.addService(this.addForm.getRawValue());
  }

  protected editService(service: Service): void {
    const dialogRef = this.dialog.open(EditServiceDialogComponent, {
      data: { service },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateService(service.id, result);
      }
    });
  }

  protected removeService(service: Service): void {
    this.store.removeService(service.id);
  }
}
