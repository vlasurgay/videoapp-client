import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { VideoService } from './video.service';
import { VideoPlayerService } from './video-player.service';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  imports: [CommonModule],
  providers: [VideoPlayerService] 
})
export class VideoComponent implements OnInit {

  @ViewChild('videoPlayer', { static: false })
  videoRef!: ElementRef<HTMLVideoElement>;

  videoData: any;

  audioTracks$!: Observable<any[]>;
  currentAudioTrack$!: Observable<number>;

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService,
    private playerService: VideoPlayerService
  ) {
    this.audioTracks$ = this.playerService.audioTracks$;
    this.currentAudioTrack$ = this.playerService.currentAudioTrack$;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.videoService.loadVideoData(id).subscribe((data) => {
      this.videoData = data;

      setTimeout(() => {
        this.playerService.initPlayer(this.videoRef.nativeElement, this.videoData.masterPlaylistKey);
      });
    });
  }

  onAudioChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.playerService.setAudioTrack(Number(select.value));
  }
}