import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SessionStore } from '@cleaners/auth';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProfessionalAccount } from '../../session/professional-account';

// Barra de navegação interna do professional-portal, reutilizada por cada feature de topo (T27-T31).
// Não é um componente de libs/shared/ui: conhece rotas e a sessão específicas deste app, e não é
// reaproveitável pelo client-app (CLAUDE.md secao 3, "core/ de cada app").
@Component({
  selector: 'app-portal-toolbar',
  standalone: true,
  imports: [
    MatButtonModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
  ],
  templateUrl: './portal-toolbar.component.html',
  styleUrl: './portal-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalToolbarComponent {
  private readonly router = inject(Router);
  private readonly sessionStore =
    inject<SessionStore<ProfessionalAccount>>(SessionStore);

  protected readonly accountName = computed(
    () => this.sessionStore.account()?.name ?? '',
  );

  protected logout(): void {
    this.sessionStore
      .logout()
      .subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
