import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WeekDay, WeeklyAvailabilityRule } from '@cleaners/models';
import { TranslocoPipe } from '@jsverse/transloco';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { PortalToolbarComponent } from '../../core/shell/portal-toolbar/portal-toolbar.component';
import { timeRangeValidator } from './availability-time-range.validator';
import { AvailabilityStore, DISPLAY_DAY_ORDER } from './availability.store';

type DayRuleForm = FormGroup<{
  dayOfWeek: FormControl<WeekDay>;
  enabled: FormControl<boolean>;
  startTime: FormControl<string>;
  endTime: FormControl<string>;
}>;

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '18:00';

const DAY_LABEL_KEYS: Record<WeekDay, string> = {
  0: 'availability.days.sunday',
  1: 'availability.days.monday',
  2: 'availability.days.tuesday',
  3: 'availability.days.wednesday',
  4: 'availability.days.thursday',
  5: 'availability.days.friday',
  6: 'availability.days.saturday',
};

// Container da feature `availability` (T27, ver skill google-calendar-mcp-scheduling): conecta a
// Google Agenda do profissional e define as regras semanais de disponibilidade. Toda decisão de
// disponibilidade real continua vindo do backend/MCP (CLAUDE.md secao 1.1) — este form só edita a
// preferência armazenada.
@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    PortalToolbarComponent,
    TranslocoPipe,
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);

  protected readonly store = inject(AvailabilityStore);

  protected readonly rulesForm = this.formBuilder.array(
    DISPLAY_DAY_ORDER.map((dayOfWeek) =>
      this.formBuilder.nonNullable.group(
        {
          dayOfWeek: this.formBuilder.nonNullable.control<WeekDay>(dayOfWeek),
          enabled: this.formBuilder.nonNullable.control(false),
          startTime: this.formBuilder.nonNullable.control(DEFAULT_START_TIME),
          endTime: this.formBuilder.nonNullable.control(DEFAULT_END_TIME),
        },
        { validators: timeRangeValidator },
      ),
    ),
  );

  protected readonly dayRows: ReadonlyArray<{
    control: DayRuleForm;
    labelKey: string;
  }> = this.rulesForm.controls.map((control) => ({
    control: control as DayRuleForm,
    labelKey: DAY_LABEL_KEYS[control.getRawValue().dayOfWeek],
  }));

  constructor() {
    this.store.loadConnectionStatus();
    this.store.loadRules();

    effect(() => {
      this.patchForm(this.store.rules());
    });

    effect(() => {
      if (this.store.savedAt() !== null) {
        this.notifications.success('availability.rulesSaveSuccessMessage');
      }
    });
  }

  protected connectCalendar(): void {
    this.store.connectCalendar();
  }

  protected submitRules(): void {
    if (this.rulesForm.invalid) {
      this.rulesForm.markAllAsTouched();
      return;
    }

    this.store.saveRules(this.rulesForm.getRawValue());
  }

  private patchForm(rules: readonly WeeklyAvailabilityRule[]): void {
    for (const rule of rules) {
      const row = this.dayRows.find(
        (candidate) =>
          candidate.control.getRawValue().dayOfWeek === rule.dayOfWeek,
      );
      row?.control.patchValue(rule, { emitEvent: false });
    }
  }
}
