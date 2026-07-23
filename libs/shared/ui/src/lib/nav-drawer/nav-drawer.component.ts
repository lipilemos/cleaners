import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

// Conteúdo do drawer de menu (hambúrguer), compartilhado pelos dois apps — não conhece rotas nem
// sessão específicas de um app: recebe nome/rota de perfil/versão via input() e delega o logout
// para quem monta o shell (App de cada app, que conhece o SessionStore tipado e o Router).
@Component({
  selector: 'app-nav-drawer',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    RouterLink,
    TranslocoPipe,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
  ],
  providers: [provideTranslocoScope('navDrawer')],
  templateUrl: './nav-drawer.component.html',
  styleUrl: './nav-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavDrawerComponent {
  readonly userName = input.required<string>();
  readonly profileRoute = input.required<string>();
  readonly appVersion = input.required<string>();

  readonly logout = output<void>();
}
