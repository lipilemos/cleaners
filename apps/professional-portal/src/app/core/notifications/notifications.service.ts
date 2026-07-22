import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

const SNACK_BAR_DURATION_MS = 4000;

// Ponto único para disparar MatSnackBar no professional-portal (skill angular-material-ui: "feedback
// transiente... disparado por um serviço central, não instanciado ad-hoc em cada componente").
// Espelha o NotificationsService do client-app (cada app tem sua própria instância — CLAUDE.md secao 7).
// Recebe sempre uma chave de tradução, nunca um texto literal (CLAUDE.md secao 4).
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);

  success(messageKey: string, params?: Record<string, unknown>): void {
    this.show(messageKey, params);
  }

  error(messageKey: string, params?: Record<string, unknown>): void {
    this.show(messageKey, params);
  }

  private show(messageKey: string, params?: Record<string, unknown>): void {
    const message = this.transloco.translate(messageKey, params);
    const dismissLabel = this.transloco.translate('common.dismiss');
    this.snackBar.open(message, dismissLabel, {
      duration: SNACK_BAR_DURATION_MS,
    });
  }
}
