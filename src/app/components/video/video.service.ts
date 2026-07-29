import { Injectable, OnDestroy } from '@angular/core';
import { VideoApiService } from '../../services/video-api.service';
import { VideoDetails } from '../../models/video/video-details.model';
import { ReplaySubject, takeUntil, Observable } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class VideoService implements OnDestroy {

    private readonly destroy = new ReplaySubject<void>();

    constructor(private api: VideoApiService) {}

    public loadVideoData(id: string): Observable<VideoDetails> {
    return this.api.getVideoDetails(id).pipe(
      takeUntil(this.destroy)
    );
  }
 
    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
    }
}