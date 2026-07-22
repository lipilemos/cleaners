import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';
import { Observable } from 'rxjs';

const SNACK_BAR_DURATION_MS = 4000;

// Ponto único para disparar MatSnackBar no client-app (skill angular-material-ui: "feedback
// transiente... disparado por um serviço central, não instanciado ad-hoc em cada componente").
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

  // Sem duração automática: usada para avisos que exigem uma decisão do usuário (ex.: atualização
  // disponível), nunca some sozinha para não deixar a ação passar despercebida.
  action(messageKey: string, actionKey: string): Observable<void> {
    const message = this.transloco.translate(messageKey);
    const actionLabel = this.transloco.translate(actionKey);
    return this.snackBar.open(message, actionLabel).onAction();
  }

  private show(messageKey: string, params?: Record<string, unknown>): void {
    const message = this.transloco.translate(messageKey, params);
    const dismissLabel = this.transloco.translate('common.dismiss');
    this.snackBar.open(message, dismissLabel, {
      duration: SNACK_BAR_DURATION_MS,
    });
  }
}
