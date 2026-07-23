import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';
import { ThemeStore } from '../theme/theme.store';

// Botão auto-contido (injeta o próprio ThemeStore) — reaproveitável em qualquer lugar dos dois apps
// sem precisar de input/output, já que tema é preferência local, não dado de domínio.
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  providers: [provideTranslocoScope('themeToggle')],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  private readonly themeStore = inject(ThemeStore);

  protected readonly isDark = computed(
    () => this.themeStore.current() === 'dark',
  );
  protected readonly labelKey = computed(() =>
    this.isDark() ? 'themeToggle.darkLabel' : 'themeToggle.lightLabel',
  );

  protected toggle(): void {
    this.themeStore.toggleTheme();
  }
}
