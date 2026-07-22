import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

const ACCEPTED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Puro e apresentacional (sem HTTP): recebe a foto atual via input() e emite o File escolhido via
// output() — quem faz o upload de verdade é o componente de feature (ex.: UserProfileService). A
// validação client-side aqui é só feedback rápido de UX; a validação de verdade (tipo/tamanho) é
// sempre refeita no backend (UsersController), nunca confiamos só nisto aqui.
@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('avatarUpload')],
  templateUrl: './avatar-upload.component.html',
  styleUrl: './avatar-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarUploadComponent {
  readonly photoUrl = input<string | null>(null);
  readonly name = input('');
  readonly uploading = input(false);

  readonly fileSelected = output<File>();
  readonly validationError = output<string>();

  private readonly fileInput =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly acceptedContentTypes = ACCEPTED_CONTENT_TYPES.join(',');

  protected openFilePicker(): void {
    if (this.uploading()) {
      return;
    }
    this.fileInput().nativeElement.click();
  }

  protected handleFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0] ?? null;
    inputElement.value = '';

    if (!file) {
      return;
    }

    if (!ACCEPTED_CONTENT_TYPES.includes(file.type)) {
      this.validationError.emit('avatarUpload.unsupportedTypeError');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.validationError.emit('avatarUpload.tooLargeError');
      return;
    }

    this.fileSelected.emit(file);
  }
}
