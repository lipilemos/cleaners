import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SessionStore } from '@cleaners/auth';
import { User } from '@cleaners/models';
import { NavDrawerComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { PwaInstallService } from './core/pwa/pwa-install.service';
import { PwaUpdateService } from './core/pwa/pwa-update.service';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    NavDrawerComponent,
    TranslocoPipe,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly pwaUpdate = inject(PwaUpdateService);
  private readonly router = inject(Router);
  private readonly sessionStore = inject<SessionStore<User>>(SessionStore);

  protected readonly pwaInstall = inject(PwaInstallService);
  protected readonly isAuthenticated = this.sessionStore.isAuthenticated;
  protected readonly appVersion = environment.appVersion;

  protected readonly accountName = computed(
    () => this.sessionStore.account()?.name ?? '',
  );

  private readonly sidenav = viewChild(MatSidenav);

  constructor() {
    // Fecha o drawer automaticamente a cada navegação (clique num link do menu ou logout, que
    // redireciona para /login) — evita precisar de um output dedicado no NavDrawerComponent.
    // App é o componente raiz (vive por toda a sessão do app), sem necessidade de unsubscribe.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.sidenav()?.close());
  }

  ngOnInit(): void {
    this.pwaUpdate.listenForUpdates();
  }

  protected install(): void {
    void this.pwaInstall.promptInstall();
  }

  protected logout(): void {
    this.sessionStore
      .logout()
      .subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
