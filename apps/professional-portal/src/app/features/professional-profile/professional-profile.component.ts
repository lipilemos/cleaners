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
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Currency, Service, SUPPORTED_CURRENCIES } from '@cleaners/models';
import { FormFieldErrorComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoCurrencyPipe } from '@jsverse/transloco-locale';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { PortalToolbarComponent } from '../../core/shell/portal-toolbar/portal-toolbar.component';
import { EditServiceDialogComponent } from './edit-service-dialog/edit-service-dialog.component';
import { PersonalDataComponent } from './personal-data/personal-data.component';
import { ProfessionalProfileStore } from './professional-profile.store';

const DEFAULT_CURRENCY: Currency = 'BRL';

// Chaves de tradução do nome de cada moeda suportada (mesmo padrão de DAY_LABEL_KEYS em
// availability.component.ts para um vocabulário fixo exibido num mat-select).
const CURRENCY_LABEL_KEYS: Record<Currency, string> = {
  BRL: 'professionalProfile.currencies.brl',
  USD: 'professionalProfile.currencies.usd',
  EUR: 'professionalProfile.currencies.eur',
};

// Container da feature `professional-profile`: duas abas (mesmo padrão de mat-tab-group de
// incoming-bookings) — "Meus dados" (PersonalDataComponent, self-contido) e "Meus serviços" (T31: CRUD
// simples dos serviços oferecidos pelo profissional logado, lógica deste componente/store). Edição de
// serviço usa MatDialog (EditServiceDialogComponent) em vez de um form inline por linha — decisão de UI
// para manter este componente enxuto e reaproveitar Material (CLAUDE.md secao 2).
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
    MatSelectModule,
    MatTabsModule,
    FormFieldErrorComponent,
    PersonalDataComponent,
    PortalToolbarComponent,
    TranslocoCurrencyPipe,
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

  protected readonly currencyOptions = SUPPORTED_CURRENCIES;
  protected readonly currencyLabelKeys = CURRENCY_LABEL_KEYS;

  protected readonly addForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: this.formBuilder.nonNullable.control<Currency>(
      DEFAULT_CURRENCY,
      Validators.required,
    ),
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
          currency: DEFAULT_CURRENCY,
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
