import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { NotificationsService } from '../notifications/notifications.service';

// Notifica e oferece recarregar quando há uma versão nova do service worker — nunca recarrega
// sozinho, pois isso poderia interromper um agendamento em andamento (skill pwa-shell-and-offline).
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly notifications = inject(NotificationsService);

  listenForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.versionUpdates
      .pipe(
        filter(
          (event): event is VersionReadyEvent => event.type === 'VERSION_READY',
        ),
      )
      .subscribe(() => {
        this.notifications
          .action('shell.updateAvailableMessage', 'shell.updateAvailableAction')
          .subscribe(() => window.location.reload());
      });
  }
}
