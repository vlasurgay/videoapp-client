import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReplaySubject, takeUntil, timer } from 'rxjs';
import { UploadService } from '../upload/upload.service';
import { UploadStateService } from '../../states/upload/upload-state.service';
import { AVAILABLE_FORMATS, AVAILABLE_RESOLUTIONS, AVAILABLE_CODECS } from '../../constants/constants';
import { TransformRequest } from '../../models/video/transform-request.model';
import { UploadState } from '../../states/upload/upload-state.model';
import { UploadStatus } from '../../models/video/upload-status.enum';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIcon,
    MatProgressBar,
    MatCard
  ],
})
export class UploadComponent implements OnDestroy {
  private readonly destroy = new ReplaySubject<void>(1);
  private readonly uploadService = inject(UploadService);
  private readonly uploadStateService = inject(UploadStateService);
  private transformRequest = signal<TransformRequest>({
    targetFormats: [],
    targetResolutions: [],
    targetCodecs: [],
    muted: false
  });
  selectedFile = signal<File | null>(null);
  videoTitle: string = '';  

  readonly availableFormats = AVAILABLE_FORMATS;
  readonly availableResolutions = AVAILABLE_RESOLUTIONS;
  readonly availableCodecs = AVAILABLE_CODECS;

  readonly state = toSignal<UploadState>(this.uploadStateService.state$, { requireSync: true });

  readonly progress = computed(() => {
    const state = this.state();
    if (!state) return 0;
    return state.totalParts > 0 ? Math.floor((state.progress / state.totalParts) * 100) : 0;
  });

  readonly isUploading = computed(() => {
    const state = this.state();
    return state ? state.status === UploadStatus.INITIATED : false;
  });

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
    input.value = '';
  }

  get transformRequestValue() {
    return this.transformRequest();
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.handleReset(UploadStatus.FAILED);
      return;
    }
    this.uploadService.uploadMultipartFile(file, this.videoTitle, this.transformRequest())
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: () => this.handleReset(UploadStatus.COMPLETED),
        error: (error) => {
          console.error('Upload error:', error);
          this.handleReset(UploadStatus.FAILED);
        },
      });
  }


  cancel(): void {
    this.destroy.next();
    this.uploadService.cancelUpload(UploadStatus.CANCELLED)
      .subscribe({
        next: () => this.handleReset(UploadStatus.CANCELLED),
        error: (error) => {
          console.error('Cancel error:', error);
          this.handleReset(UploadStatus.FAILED);
        }
      });
  }

  private handleReset(status: UploadStatus): void {
    this.uploadStateService.updateState({ status });

    timer(5000).pipe(takeUntil(this.destroy)).subscribe(() => {
      this.uploadStateService.resetState();
      this.resetForm();
    });
  }

  onTitleChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.videoTitle = input.value;
    }


  onFormatChange(event: MatCheckboxChange) {
    const value = event.source.value;
    this.transformRequest.update(current => {
      if (event.checked) {
        return {
          ...current,
          targetFormats: [...current.targetFormats, value]
        };
      } else {
        return {
          ...current,
          targetFormats: current.targetFormats.filter(v => v !== value)
        };
      }
    });
  }


  onResolutionChange(event: MatCheckboxChange) {
    const value = event.source.value;
    this.transformRequest.update(current => {
      if (event.checked) {
        return {
          ...current,
          targetResolutions: [...current.targetResolutions, value]
        };
      } else {
        return {
          ...current,
          targetResolutions: current.targetResolutions.filter(v => v !== value)
        };
      }
    });
  }


  onCodecChange(event: MatCheckboxChange) {
    const value = event.source.value;
    this.transformRequest.update(current => {
      if (event.checked) {
        return {
          ...current,
          targetCodecs: [...current.targetCodecs, value]
        };
      } else {
        return {
          ...current,
          targetCodecs: current.targetCodecs.filter(v => v !== value)
        };
      }
    });
  }

  onMutedChange(event: MatCheckboxChange) {
    this.transformRequest.update(current => ({
      ...current,
      muted: event.checked
    }));
  }


  private resetForm(): void {
    this.selectedFile.set(null);    
    this.videoTitle = '';
    this.transformRequest.set({
      targetFormats: [],
      targetResolutions: [],
      targetCodecs: [],
      muted: false
    });
  }


  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}