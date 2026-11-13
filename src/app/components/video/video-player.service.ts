import { Injectable, OnDestroy, signal } from '@angular/core';
import Hls from 'hls.js';

@Injectable()
export class VideoPlayerService implements OnDestroy {
  private hls?: Hls;
  private plyr: any;

  readonly audioTracks = signal<any[]>([]);
readonly currentAudioTrack = signal(-1);
readonly error = signal<string | null>(null);

  public async initPlayer(videoElement: HTMLVideoElement, src: string): Promise<void> {
    this.destroyPlayer();
    console.info('[player] master playlist URL:', src);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      this.hls = hls;
      
      this.hls.on(Hls.Events.ERROR, (_, data: any) => {
        console.error('[hls] error', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          httpStatus: data.response?.code,
          url: data.url ?? data.frag?.url ?? data.context?.url
        });

        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          this.hls?.recoverMediaError();
          return;
        }

        const status = data.response?.code ? `, HTTP ${data.response.code}` : '';
        this.error.set(`Could not load the video (${data.details}${status}). See the browser console for details.`);
        this.hls?.destroy();
        this.hls = undefined;
      });

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

        if (this.hls!.audioTracks && this.hls!.audioTracks.length > 1) {
          this.audioTracks.set(this.hls!.audioTracks);
          this.currentAudioTrack.set(this.hls!.audioTrack);
        }

        videoElement.play().catch(() => {});
      });

      this.hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        this.currentAudioTrack.set(data.id);
      });

      return;
    }

    if (!videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      this.error.set('HLS playback is not supported in this browser.');
      return;
    }

    videoElement.src = src;
    const PlyrModule = (await import('plyr')) as any;
    const Plyr = PlyrModule.default || PlyrModule;
    this.plyr = new Plyr(videoElement);
  }

  public setAudioTrack(trackId: number): void {
    if (this.hls) {
      this.hls.audioTrack = trackId;
    }
  }

  public destroyPlayer(): void {
    this.plyr?.destroy();
    this.hls?.destroy();
    this.audioTracks.set([]);
    this.currentAudioTrack.set(-1);
    this.error.set(null);
  }

  ngOnDestroy(): void {
    this.destroyPlayer();
  }
}