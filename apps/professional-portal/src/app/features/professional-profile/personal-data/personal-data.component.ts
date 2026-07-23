import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfessionalProfileService } from '@cleaners/data-access';
import { FormFieldErrorComponent, PhoneInputComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { NotificationsService } from '../../../core/notifications/notifications.service';

// "Meus dados" (aba própria de professional-profile, primeira aba) — cadastro/edição de dados de
// contato do profissional (telefone, endereço). Dados sensíveis (CLAUDE.md secao 5.4): nunca logados,
// sempre enviados no corpo do PUT (ProfessionalProfileService.updateMineAccountData), nunca em query
// params. Self-contido (estado próprio, sem store compartilhado) — mesmo padrão de UserProfileComponent
// (client-app), já que esta tela não tem outro consumidor do mesmo estado. E-mail é só exibido: não é
// editável por este endpoint (CLAUDE.md secao 1.3).
@Component({
  selector: 'app-professional-personal-data',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormFieldErrorComponent,
    PhoneInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './personal-data.component.html',
  styleUrl: './personal-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalDataComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly professionalProfileService = inject(
    ProfessionalProfileService,
  );
  private readonly notifications = inject(NotificationsService);

  protected readonly loading = signal(true);
  protected readonly loadErrorKey = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveErrorKey = signal<string | null>(null);

  protected readonly email = signal('');

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    address: this.formBuilder.nonNullable.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
    }),
  });

  constructor() {
    this.load();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveErrorKey.set(null);

    const { name, phone, address } = this.form.getRawValue();

    this.professionalProfileService
      .updateMineAccountData({ name, phone, address })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success(
            'professionalProfile.personalData.saveSuccessMessage',
          );
        },
        error: () => {
          this.saving.set(false);
          this.saveErrorKey.set(
            'professionalProfile.personalData.saveErrorMessage',
          );
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.loadErrorKey.set(null);

    this.professionalProfileService.getMineAccountData().subscribe({
      next: (account) => {
        this.email.set(account.email);
        this.form.patchValue({
          name: account.name,
          phone: account.phone,
          address: {
            street: account.address.street,
            city: account.address.city,
            state: account.address.state,
            zipCode: account.address.zipCode,
          },
        });
        this.loading.set(false);
      },
      error: () => {
        this.loadErrorKey.set(
          'professionalProfile.personalData.loadErrorMessage',
        );
        this.loading.set(false);
      },
    });
  }
}
