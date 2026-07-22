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
import { UserProfileService } from '@cleaners/data-access';
import { UserAddress } from '@cleaners/models';
import {
  AvatarUploadComponent,
  FormFieldErrorComponent,
  PhoneInputComponent,
} from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocationStore } from '../../core/location/location.store';
import { NotificationsService } from '../../core/notifications/notifications.service';

// Cadastro/edição de dados de contato do usuário (telefone, endereço) — dados sensíveis (CLAUDE.md
// secao 5.4): nunca logados, e sempre enviados no corpo do PUT (UserProfileService), nunca em query
// params. Sem geocoding real disponível no frontend: latitude/longitude do endereço são preservadas
// do perfil já carregado, ou aproximadas pela última localização de dispositivo conhecida como
// fallback para um perfil novo — decisão documentada no resumo da tarefa, não é uma decisão de UI.
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AvatarUploadComponent,
    FormFieldErrorComponent,
    PhoneInputComponent,
    TranslocoPipe,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userProfileService = inject(UserProfileService);
  private readonly locationStore = inject(LocationStore);
  private readonly notifications = inject(NotificationsService);

  protected readonly loading = signal(true);
  protected readonly loadErrorKey = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveErrorKey = signal<string | null>(null);

  protected readonly userName = signal('');
  protected readonly photoUrl = signal<string | null>(null);
  protected readonly uploadingPhoto = signal(false);

  private loadedAddress: UserAddress | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    address: this.formBuilder.nonNullable.group({
      street: ['', Validators.required],
      number: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
    }),
  });

  constructor() {
    this.loadProfile();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveErrorKey.set(null);

    const { name, phone, address } = this.form.getRawValue();
    const fallbackPosition = this.locationStore.position();

    this.userProfileService
      .updateMine({
        name,
        phone,
        address: {
          ...address,
          latitude:
            this.loadedAddress?.latitude ?? fallbackPosition?.latitude ?? 0,
          longitude:
            this.loadedAddress?.longitude ?? fallbackPosition?.longitude ?? 0,
        },
      })
      .subscribe({
        next: (user) => {
          this.loadedAddress = user.address;
          this.userName.set(user.name);
          this.saving.set(false);
          this.notifications.success('userProfile.successMessage');
        },
        error: () => {
          this.saving.set(false);
          this.saveErrorKey.set('userProfile.saveErrorMessage');
        },
      });
  }

  protected handlePhotoSelected(file: File): void {
    this.uploadingPhoto.set(true);

    this.userProfileService.uploadMinePhoto(file).subscribe({
      next: (user) => {
        this.photoUrl.set(user.photoUrl || null);
        this.uploadingPhoto.set(false);
        this.notifications.success('userProfile.photoSuccessMessage');
      },
      error: () => {
        this.uploadingPhoto.set(false);
        this.notifications.error('userProfile.photoErrorMessage');
      },
    });
  }

  protected handlePhotoValidationError(errorKey: string): void {
    this.notifications.error(errorKey);
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.loadErrorKey.set(null);

    this.userProfileService.getMine().subscribe({
      next: (user) => {
        this.loadedAddress = user.address;
        this.userName.set(user.name);
        this.photoUrl.set(user.photoUrl || null);
        this.form.patchValue({
          name: user.name,
          phone: user.phone,
          address: {
            street: user.address.street,
            number: user.address.number,
            city: user.address.city,
            state: user.address.state,
            zipCode: user.address.zipCode,
          },
        });
        this.loading.set(false);
      },
      error: () => {
        this.loadErrorKey.set('userProfile.loadErrorMessage');
        this.loading.set(false);
      },
    });
  }
}
