import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { PwaInstallService } from './core/pwa/pwa-install.service';
import { PwaUpdateService } from './core/pwa/pwa-update.service';

@Component({
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule, TranslocoPipe],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly pwaUpdate = inject(PwaUpdateService);
  protected readonly pwaInstall = inject(PwaInstallService);

  ngOnInit(): void {
    this.pwaUpdate.listenForUpdates();
  }

  protected install(): void {
    void this.pwaInstall.promptInstall();
  }
}
