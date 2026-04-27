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
import { ReplaySubject, takeUntil, timer, Observable, throwError, catchError, finalize } from 'rxjs';
import { UploadService } from '../upload/upload.service';
import { UploadStateService } from '../../states/upload/upload-state.service';
import { UploadState } from '../../states/upload/upload-state.model';
import { ChangeDetectionStrategy } from '@angular/core';
import { TargetSettings } from '../../models/video-upload/target-settings.model';
import { VideoStatus } from '../../models/video/video-status.enum';
import { VideoMetadata } from '../../models/video/video-metadata.model';
import { VideoConfig } from '../../models/video-upload/video-config.model';


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

  private targetSettings = signal<TargetSettings>({
    targetResolutions: [],
    muted: false,
    aiSubs: false
  });

  selectedFile = signal<File | null>(null);
  metadata = signal<VideoMetadata | null>(null);
  videoTitle: string = ''; 
  videoDescription: string = ''; 

  private config$ = this.uploadService.getVideoConfig();
  readonly config = toSignal(this.config$, { initialValue: { availableResolutions: [] } as VideoConfig });
  readonly state = toSignal<UploadState>(this.uploadStateService.state$, { requireSync: true });


  readonly progress = computed(() => {
    const state = this.state();
    if (!state) return 0;
    return state.totalParts > 0 ? Math.floor((state.progress / state.totalParts) * 100) : 0;
  });

  readonly isUploading = computed(() => {
    const state = this.state();
    return state ? state.status === VideoStatus.UPLOADING : false;
  });

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);
      
      this.extractVideoMetadata(file)
        .pipe(takeUntil(this.destroy))
        .subscribe({
          next: (meta) => this.metadata.set(meta),
          error: (err) => {
            console.error('Metadata extraction failed', err);
            this.resetMetadata();
          }
        });
    }
    input.value = '';
  }

  get targetSettingsValue() {
    return this.targetSettings();
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.handleReset(VideoStatus.FAILED);
      return;
    }

    this.uploadService.uploadMultipartFile(file, this.videoTitle, this.videoDescription, this.targetSettings())
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: () => this.handleReset(VideoStatus.COMPLETED),
        error: (error) => {
          console.error('Upload error:', error);
          this.handleReset(VideoStatus.FAILED);
        },
      });
  }

  cancel(): void {
    this.destroy.next();
    this.uploadService.cancelUpload(VideoStatus.ABORTED)
      .subscribe({
        next: () => this.handleReset(VideoStatus.ABORTED),
        error: (error) => {
          console.error('Cancel error:', error);
          this.handleReset(VideoStatus.FAILED);
        }
      });
  }

  private handleReset(status: VideoStatus): void {
    this.uploadStateService.updateState({ status });

    timer(5000).pipe(takeUntil(this.destroy)).subscribe(() => {
      this.uploadStateService.resetState();
      this.resetForm();
      this.resetMetadata();
    });
  }

  private extractVideoMetadata(file: File): Observable<VideoMetadata> {
          
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    const fileURL = URL.createObjectURL(file);
    video.src = fileURL;

    return new Observable<VideoMetadata>(observer => {
              
      video.onloadedmetadata = () => {
        observer.next({
          format: file.type,
          duration: video.duration,
          height: video.videoHeight,
          width: video.videoWidth,
          bitrate: (file.size * 8) / video.duration,
          fileSizeBytes: file.size,
          hasAudio: this.hasAudioTrack(video)
        });
        observer.complete();
      };
  
      video.onerror = () => {
        observer.error(new Error('Error while metadata loading'));            
      };
    }).pipe(
      catchError(error => throwError(() => new Error(`Metadata extraction failed: ${error.message}`))),
      finalize(() => URL.revokeObjectURL(fileURL))
    );
  }

  private hasAudioTrack(video: HTMLVideoElement): boolean {
    const audioTracks = (video as any).audioTracks;
    return audioTracks ? audioTracks.length > 0 : true; 
  }

  onTitleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.videoTitle = input.value;
  }

  onDescriptionChange(event: Event) {
    const input = event.target as HTMLTextAreaElement | HTMLInputElement;
    this.videoDescription = input.value;
  }

  onResolutionChange(event: MatCheckboxChange) {
    const value = event.source.value;
    this.targetSettings.update(current => {
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

  onMutedChange(event: MatCheckboxChange) {
    this.targetSettings.update(current => ({
      ...current,
      muted: event.checked
    }));
  }

  onAiSubsChange(event: MatCheckboxChange) {
    this.targetSettings.update(current => ({
      ...current,
      aiSubs: event.checked
    }));
  }

  private resetForm(): void {
    this.selectedFile.set(null);
    this.videoTitle = '';
    this.videoDescription = '';
    this.targetSettings.set({
      targetResolutions: [],
      muted: false,
      aiSubs: false
    });
  }

  private resetMetadata(): void {
  this.metadata.set({
    format: '',
    duration: 0,
    height: 0,
    width: 0,
    bitrate: 0,
    hasAudio: false,
    fileSizeBytes: 0
  });
}

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}