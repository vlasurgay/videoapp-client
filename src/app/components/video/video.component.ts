import { Component, DestroyRef, ElementRef, OnInit, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { VideoService } from './video.service';
import { VideoPlayerService } from './video-player.service';
import { VideoDetails } from '../../models/video/video-details.model';

@Component({
  standalone: true,
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  imports: [CommonModule],
  providers: [VideoPlayerService]
})
export class VideoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly videoService = inject(VideoService);
  private readonly playerService = inject(VideoPlayerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly video = signal<VideoDetails | null>(null);
  readonly loadError = signal<string | null>(null);

  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('videoPlayer');

  readonly audioTracks = this.playerService.audioTracks;
  readonly currentAudioTrack = this.playerService.currentAudioTrack;
  readonly playbackError = this.playerService.error;

  constructor() {
    effect(() => {
      const element = this.videoRef()?.nativeElement;
      const video = this.video();
      if (!element || !video) return;

      untracked(() => {
        this.playerService
          .initPlayer(element, video.masterPlaylistKey)
          .catch((err) => console.error('[video] player init failed', err));
      });
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.videoService
      .loadVideoData(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          console.info('[video] details from API:', data);
          this.video.set(data);
        },
        error: (err) => {
          console.error('[video] failed to load video details', err);
          this.loadError.set('Could not load the video details.');
        }
      });
  }

  onAudioChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.playerService.setAudioTrack(Number(select.value));
  }
}