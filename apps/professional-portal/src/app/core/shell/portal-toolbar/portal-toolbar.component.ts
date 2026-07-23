import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

// Barra de navegação interna do professional-portal, reutilizada por cada feature de topo (T27-T31).
// Não é um componente de libs/shared/ui: conhece rotas específicas deste app, e não é reaproveitável
// pelo client-app (CLAUDE.md secao 3, "core/ de cada app"). Saudação e logout foram movidos para o
// drawer global (app-nav-drawer, montado em App) — aqui ficam só os links de navegação entre as
// features de topo do portal, que não fazem parte do escopo do drawer.
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
export class PortalToolbarComponent {}
