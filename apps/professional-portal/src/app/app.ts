import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SessionStore } from '@cleaners/auth';
import { NavDrawerComponent } from '@cleaners/ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { ProfessionalAccount } from './core/session/professional-account';

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
export class App {
  private readonly router = inject(Router);
  private readonly sessionStore =
    inject<SessionStore<ProfessionalAccount>>(SessionStore);

  protected readonly isAuthenticated = this.sessionStore.isAuthenticated;
  protected readonly appVersion = environment.appVersion;

  protected readonly accountName = computed(
    () => this.sessionStore.account()?.name ?? '',
  );

  private readonly sidenav = viewChild(MatSidenav);

  constructor() {
    // App é o componente raiz (vive por toda a sessão do app), sem necessidade de unsubscribe.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.sidenav()?.close());
  }

  protected logout(): void {
    this.sessionStore
      .logout()
      .subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
