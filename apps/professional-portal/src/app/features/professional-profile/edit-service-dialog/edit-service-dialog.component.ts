import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UpdateServiceRequest } from '@cleaners/data-access';
import { Service } from '@cleaners/models';
import { FormFieldErrorComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';

export interface EditServiceDialogData {
  readonly service: Service;
}

// Dialog reutilizável (MatDialog, CLAUDE.md secao 2: "prefira Material a construir do zero") para
// editar nome/descrição/preço-base de um serviço já existente (T31). Fecha com o request pronto para
// ProfessionalProfileService.updateService, ou `undefined` se cancelado — o componente pai decide
// se chama o store, este dialog não conhece o store nem faz HTTP.
@Component({
  selector: 'app-edit-service-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormFieldErrorComponent,
    TranslocoPipe,
  ],
  templateUrl: './edit-service-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditServiceDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef =
    inject<
      MatDialogRef<EditServiceDialogComponent, UpdateServiceRequest | undefined>
    >(MatDialogRef);

  protected readonly data = inject<EditServiceDialogData>(MAT_DIALOG_DATA);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.service.name, Validators.required],
    description: [this.data.service.description, Validators.required],
    price: [
      this.data.service.priceFrom,
      [Validators.required, Validators.min(0)],
    ],
    durationMinutes: [
      this.data.service.durationMinutes,
      [Validators.required, Validators.min(1)],
    ],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
