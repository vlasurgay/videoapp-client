import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Hls from 'hls.js';

@Injectable()
export class VideoPlayerService implements OnDestroy {
  private hls?: Hls;
  private plyr: any;

  // Потоки для передачі даних в компонент
  public audioTracks$ = new BehaviorSubject<any[]>([]);
  public currentAudioTrack$ = new BehaviorSubject<number>(-1);

  public async initPlayer(videoElement: HTMLVideoElement, src: string): Promise<void> {
    this.destroyPlayer();

    if (Hls.isSupported()) {
      this.hls = new Hls({ enableWorker: true });
      this.hls.loadSource(src);
      this.hls.attachMedia(videoElement);

      this.hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        const PlyrModule = (await import('plyr')) as any;
        const Plyr = PlyrModule.default || PlyrModule;

        const availableHeights = this.hls!.levels.map(l => l.height);
        
        this.plyr = new Plyr(videoElement, {
          controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
          settings: ['quality', 'speed'],
          quality: {
            default: 0,
            options: [0, ...availableHeights],
            forced: true,
            onChange: (newQuality: number) => {
              this.hls!.currentLevel = newQuality === 0 ? -1 : this.hls!.levels.findIndex(l => l.height === newQuality);
            },
          },
          i18n: { quality: 'Quality', speed: 'Speed', normal: 'Normal', qualityLabel: { 0: 'Auto' } }
        });

        // Витягуємо аудіодоріжки після парсингу
        if (this.hls!.audioTracks && this.hls!.audioTracks.length > 1) {
          this.audioTracks$.next(this.hls!.audioTracks);
          this.currentAudioTrack$.next(this.hls!.audioTrack);
        }

        videoElement.play().catch(() => {});
      });

      // Слухаємо перемикання доріжок (якщо воно відбудеться десь ще)
      this.hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        this.currentAudioTrack$.next(data.id);
      });

      return;
    }

    videoElement.src = src;
    const PlyrModule = (await import('plyr')) as any;
    const Plyr = PlyrModule.default || PlyrModule;
    this.plyr = new Plyr(videoElement);
  }

  // Метод для зміни мови
  public setAudioTrack(trackId: number): void {
    if (this.hls) {
      this.hls.audioTrack = trackId;
    }
  }

  public destroyPlayer(): void {
    this.plyr?.destroy();
    this.hls?.destroy();
    this.audioTracks$.next([]);
    this.currentAudioTrack$.next(-1);
  }

  ngOnDestroy(): void {
    this.destroyPlayer();
  }
}