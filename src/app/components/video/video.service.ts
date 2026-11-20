import { Injectable, OnDestroy, DestroyRef, inject } from '@angular/core';
import { VideoApiService } from '../../services/video-api.service';
import { VideoDetails } from '../../models/video/video-details.model';
import { ReplaySubject, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';



@Injectable({ providedIn: 'root' })
export class VideoService implements OnDestroy {

    private readonly destroyRef = inject(DestroyRef);
    private readonly destroy = new ReplaySubject<void>();

    constructor(private api: VideoApiService) {}

    public loadVideoData(id: string): Observable<VideoDetails> {
    return this.api.getVideoDetails(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    );
  }
 
    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
    }
}