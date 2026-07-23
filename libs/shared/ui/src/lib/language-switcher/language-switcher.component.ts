import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  LanguageStore,
  SUPPORTED_LANGUAGE_OPTIONS,
  SupportedLanguageOption,
} from '@cleaners/i18n';
import { TranslocoPipe } from '@jsverse/transloco';

// Bandeiras sempre visíveis (não atrás de um mat-menu) — o label de cada bandeira já é o próprio
// nome do idioma no idioma nativo (SUPPORTED_LANGUAGE_OPTIONS), não uma chave de tradução.
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MatButtonModule, TranslocoPipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly languageStore = inject(LanguageStore);
  protected readonly languageOptions = SUPPORTED_LANGUAGE_OPTIONS;

  protected selectLanguage(option: SupportedLanguageOption): void {
    this.languageStore.setLanguage(option.code);
  }
}
