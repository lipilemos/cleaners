import { Injectable, inject, signal } from '@angular/core';
import {
  CreateServiceRequest,
  ProfessionalProfileService,
  UpdateServiceRequest,
} from '@cleaners/data-access';
import { Service } from '@cleaners/models';

// Estado da feature `professional-profile` (T31), injetado no escopo da rota: CRUD simples dos
// serviços oferecidos pelo profissional logado (ProfessionalProfileService — ver TASKS.md T31 sobre
// o endpoint assumido). Nenhuma regra de disponibilidade/agendamento é decidida aqui.
@Injectable()
export class ProfessionalProfileStore {
  private readonly professionalProfileService = inject(
    ProfessionalProfileService,
  );

  private readonly _services = signal<Service[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _adding = signal(false);
  private readonly _pendingIds = signal<ReadonlySet<string>>(new Set());
  private readonly _actionErrorKey = signal<string | null>(null);
  private readonly _lastAddedAt = signal<number | null>(null);

  readonly services = this._services.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly adding = this._adding.asReadonly();
  readonly actionErrorKey = this._actionErrorKey.asReadonly();
  readonly lastAddedAt = this._lastAddedAt.asReadonly();

  load(): void {
    this._loading.set(true);
    this._error.set(null);

    this.professionalProfileService.getMine().subscribe({
      next: (professional) => {
        this._services.set(professional.services);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('professionalProfile.loadErrorMessage');
        this._loading.set(false);
      },
    });
  }

  isPending(serviceId: string): boolean {
    return this._pendingIds().has(serviceId);
  }

  addService(request: CreateServiceRequest): void {
    this._adding.set(true);
    this._actionErrorKey.set(null);

    this.professionalProfileService.addService(request).subscribe({
      next: (service) => {
        this._services.set([...this._services(), service]);
        this._adding.set(false);
        this._lastAddedAt.set(Date.now());
      },
      error: () => {
        this._adding.set(false);
        this._actionErrorKey.set('professionalProfile.addErrorMessage');
      },
    });
  }

  updateService(serviceId: string, request: UpdateServiceRequest): void {
    this.setPending(serviceId, true);
    this._actionErrorKey.set(null);

    this.professionalProfileService
      .updateService(serviceId, request)
      .subscribe({
        next: (service) => {
          this._services.set(
            this._services().map((existing) =>
              existing.id === serviceId ? service : existing,
            ),
          );
          this.setPending(serviceId, false);
        },
        error: () => {
          this.setPending(serviceId, false);
          this._actionErrorKey.set('professionalProfile.updateErrorMessage');
        },
      });
  }

  removeService(serviceId: string): void {
    this.setPending(serviceId, true);
    this._actionErrorKey.set(null);

    this.professionalProfileService.removeService(serviceId).subscribe({
      next: () => {
        this._services.set(
          this._services().filter((existing) => existing.id !== serviceId),
        );
        this.setPending(serviceId, false);
      },
      error: () => {
        this.setPending(serviceId, false);
        this._actionErrorKey.set('professionalProfile.removeErrorMessage');
      },
    });
  }

  private setPending(serviceId: string, pending: boolean): void {
    const next = new Set(this._pendingIds());
    if (pending) {
      next.add(serviceId);
    } else {
      next.delete(serviceId);
    }
    this._pendingIds.set(next);
  }
}
