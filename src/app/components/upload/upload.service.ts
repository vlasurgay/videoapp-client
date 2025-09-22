import { Injectable, OnDestroy } from '@angular/core';
import { ReplaySubject, takeUntil, from, Observable, map, concatMap, catchError, tap, throwError, toArray, finalize } from 'rxjs';
import { VideoApiService } from '../../services/video-api.service';
import { Metadata } from '../../models/video/metadata.model';
import { UploadInfo } from '../../models/video/upload-info.model';
import { UploadStateService } from '../../states/upload/upload-state.service';
import { TransformRequest } from '../../models/video/transform-request.model';
import { FileUtils } from '../../utils/file.utils';
import { S3CompletedBatch } from '../../models/s3/s3-completed-batch.model';
import { S3PresignedBatch } from '../../models/s3/s3-presigned-batch.model';
import { UploadStatus } from '../../models/video/upload-status.enum';



@Injectable({ providedIn: 'root' })
export class UploadService implements OnDestroy {

    private readonly destroy = new ReplaySubject<void>(1);

    constructor(private videoApiService: VideoApiService, private uploadStateService: UploadStateService) {}    

    uploadMultipartFile(file: File, title: string, transformRequest: TransformRequest): Observable<void> {

        return this.extractVideoMetadata(file).pipe(
            tap(() => this.uploadStateService.updateState( { status: UploadStatus.INITIATED })),
            map(metadata => this.fillUploadInfo(file, title, metadata, transformRequest)),
            concatMap(uploadInfo => this.videoApiService.initiateMultipartUpload(uploadInfo)),
            tap(s3PresignedBatch => this.uploadStateService.updateState(
                { uploadId: s3PresignedBatch.uploadId, key: s3PresignedBatch.key, totalParts: s3PresignedBatch.presignedUrls.length }
            )),
            concatMap(s3PresignedBatch => this.uploadParts(file, s3PresignedBatch)),
            concatMap(s3CompletedBatch => this.videoApiService.completeMultipartUpload(s3CompletedBatch)),
            catchError(error => this.handleError(error)),
            takeUntil(this.destroy)
        );
    }


    cancelUpload(status: UploadStatus): Observable<void> {
        this.destroy.next();
        const state = this.uploadStateService.getState();
        if (state.key && state.uploadId) {
            return this.videoApiService.abortMultipartUpload(state.key, state.uploadId, status);
        }
        return from([]);
    }
    

    private extractVideoMetadata(file: File): Observable<Metadata> {
        
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        const fileURL = URL.createObjectURL(file);
        video.src = fileURL;

        return new Observable<Metadata>(observer => {
            
            video.onloadedmetadata = () => {
                observer.next({
                    type: 'original',
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


    private fillUploadInfo(file: File, title: string, metadata: Metadata, transformRequest: TransformRequest): UploadInfo {
        return {
            fileName: file.name,
            title: title,
            totalParts: FileUtils.resolveTotalParts(file),
            originalMetadata: metadata,
            transformRequest
        };
    }


    private uploadParts(file: File, s3PresignedBatch: S3PresignedBatch): Observable<S3CompletedBatch> {

        return from(s3PresignedBatch.presignedUrls).pipe(
            concatMap(presignedUrl => {

                if (s3PresignedBatch.expiresAt - Date.now() <= 0) {
                    return throwError(() => new Error('Presigned URL expired'));
                }
                const filePart = FileUtils.getFilePart(file, presignedUrl.partNumber);

                return this.videoApiService.uploadPart(presignedUrl.url, filePart, presignedUrl.partNumber, presignedUrl.headers).pipe(
                    tap(() => this.uploadStateService.incrementProgress())
                );
            }),
            toArray(),
            map(eTags => ({ key: s3PresignedBatch.key, uploadId: s3PresignedBatch.uploadId, eTags })
            )
        );
    }


    private handleError(error: any): Observable<never> {
        this.destroy.next();
        return this.cancelUpload(UploadStatus.FAILED).pipe(
            concatMap(() => throwError(() => error))
        );
    }

    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
    }
}