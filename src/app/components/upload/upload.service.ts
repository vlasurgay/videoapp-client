import { Injectable, OnDestroy } from '@angular/core';
import { ReplaySubject, takeUntil, from, Observable, map, concatMap, catchError, tap, throwError, toArray } from 'rxjs';
import { VideoUploadApiService } from '../../services/video-upload-api.service';
import { UploadStateService } from '../../states/upload/upload-state.service';
import { FileUtils } from '../../utils/file.utils';
import { CompletedMultipartContext } from '../../models/video-upload/completed-multipart-context.model';
import { MultipartUploadContext } from '../../models/video-upload/multipart-upload-context.model';
import { VideoStatus } from '../../models/video/video-status.enum';
import { InitUploadRequest } from '../../models/video-upload/init-upload-request.model';
import { TargetSettings } from '../../models/video-upload/target-settings.model';
import { VideoConfig } from '../../models/video-upload/video-config.model';



@Injectable({ providedIn: 'root' })
export class UploadService implements OnDestroy {

    private readonly destroy = new ReplaySubject<void>(1);

    constructor(private videoUploadApiService: VideoUploadApiService, private uploadStateService: UploadStateService) {}

    getVideoConfig(): Observable<VideoConfig> {
        return this.videoUploadApiService.getVideoConfig();
    }

    uploadMultipartFile(file: File, title: string, description: string, targetSettings: TargetSettings): Observable<void> {

        this.uploadStateService.updateState( { status: VideoStatus.UPLOADING });
        const uploadRequest = this.fillInitUploadRequest(file, title, description, targetSettings);

        return this.videoUploadApiService.initiateMultipartUpload(uploadRequest).pipe(
            tap(uploadContext => this.uploadStateService.updateState(
                { uploadId: uploadContext.uploadId, key: uploadContext.key, totalParts: uploadContext.presignedUrls.length }
            )),
            concatMap(uploadContext => this.uploadParts(file, uploadContext)),
            concatMap(completedContext => this.videoUploadApiService.completeMultipartUpload(completedContext)),
            catchError(error => this.handleError(error)),
            takeUntil(this.destroy)
        );
    }


    cancelUpload(status: VideoStatus): Observable<void> {
        this.destroy.next();
        const state = this.uploadStateService.getState();
        if (state.key && state.uploadId) {
            return this.videoUploadApiService.abortMultipartUpload(state.key, state.uploadId, status);
        }
        return from([]);
    }
    

    private fillInitUploadRequest(file: File, title: string, description: string, targetSettings: TargetSettings): InitUploadRequest {
        return {
            fileName: file.name,
            title: title,
            description: '',
            fileSizeBytes: file.size,
            targetSettings: targetSettings
        };
    }


    private uploadParts(file: File, uploadContext: MultipartUploadContext): Observable<CompletedMultipartContext> {

        return from(uploadContext.presignedUrls).pipe(
            concatMap(presignedUrl => {

                if (uploadContext.expiresAt - Date.now() <= 0) {
                    return throwError(() => new Error('Presigned URL expired'));
                }
                const filePart = FileUtils.getFilePart(file, presignedUrl.partNumber, uploadContext.maxPartUploadSize);

                return this.videoUploadApiService.uploadPart(presignedUrl.url, filePart, presignedUrl.partNumber, presignedUrl.headers).pipe(
                    tap(() => this.uploadStateService.incrementProgress())
                );
            }),
            toArray(),
            map(uploadedParts => ({ key: uploadContext.key, uploadId: uploadContext.uploadId, uploadedParts })
            )
        );
    }


    private handleError(error: any): Observable<never> {
        this.destroy.next();
        return this.cancelUpload(VideoStatus.FAILED).pipe(
            concatMap(() => throwError(() => error))
        );
    }

    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
    }
}