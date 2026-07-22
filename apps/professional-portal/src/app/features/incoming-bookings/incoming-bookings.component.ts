import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Booking } from '@cleaners/models';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { PortalToolbarComponent } from '../../core/shell/portal-toolbar/portal-toolbar.component';
import { IncomingBookingsStore } from './incoming-bookings.store';

// Container da feature `incoming-bookings` (T28/T29/T32, ver skill google-calendar-mcp-scheduling):
// lista os pedidos recebidos pelo profissional logado, aceita/recusa e reflete atualizações em tempo
// real via SignalR (delegado ao store). O telefone do cliente (T29, CLAUDE.md secao 5.4) só é
// renderizado quando `booking.customerContact` vem preenchido pelo backend, isto é, nunca antes da
// confirmação — este componente não decide isso, apenas reflete o que a API devolve.
@Component({
  selector: 'app-incoming-bookings',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    PortalToolbarComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  templateUrl: './incoming-bookings.component.html',
  styleUrl: './incoming-bookings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomingBookingsComponent {
  protected readonly store = inject(IncomingBookingsStore);

  constructor() {
    this.store.load();
  }

  protected accept(booking: Booking): void {
    this.store.accept(booking.id);
  }

  protected reject(booking: Booking): void {
    this.store.reject(booking.id);
  }

  // Nunca loga o telefone (CLAUDE.md secao 5.4) — só monta o href `tel:`, tratado pelo próprio
  // navegador/dispositivo, sem passar pela URL da aplicação nem por analytics.
  protected telHref(phone: string): string {
    return `tel:${phone.replace(/\D/g, '')}`;
  }

  protected statusKey(status: Booking['status']): string {
    return `bookingStatus.${status}`;
  }
}
