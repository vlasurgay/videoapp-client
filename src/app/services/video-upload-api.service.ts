import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import {Observable, map } from 'rxjs';
import { CompletedMultipartContext } from '../models/video-upload/completed-multipart-context.model';
import { MultipartUploadContext } from '../models/video-upload/multipart-upload-context.model';
import { UploadedPart } from '../models/video-upload/uploaded-part.model';
import { VideoStatus } from '../models/video/video-status.enum';
import { InitUploadRequest } from '../models/video-upload/init-upload-request.model';
import { VideoConfig } from '../models/video-upload/video-config.model';

@Injectable({ providedIn: 'root' })
export class VideoUploadApiService {

  constructor(private http: HttpClient) {}

    getVideoConfig(): Observable<VideoConfig> {
        return this.http.get<VideoConfig>(`${environment.apiUrl}/api/upload/config`);
    }

    initiateMultipartUpload(initUploadRequest: InitUploadRequest): Observable<MultipartUploadContext> {
        return this.http.post<MultipartUploadContext>(`${environment.apiUrl}/api/upload/init-multipart`, initUploadRequest);
    }


    uploadPart(presignedUrl: string, filePart: Blob, partNumber: number, headers: Map<string, string>):Observable<UploadedPart> {

        let httpHeaders = new HttpHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            httpHeaders = httpHeaders.set(key, value);
        });

        return this.http.put(presignedUrl, filePart, { headers: httpHeaders, observe: 'response', responseType: 'text' }).pipe(
                map(response => {
                    const eTag = response.headers.get('ETag')!;
                    return { partNumber, eTag } as UploadedPart;
                })
        );
    }


    completeMultipartUpload(completedContext: CompletedMultipartContext) {
        return this.http.post<void>(`${environment.apiUrl}/api/upload/complete-multipart`, completedContext);
    }

    
    abortMultipartUpload(key: string, uploadId: string, status: VideoStatus) {
        return this.http.post<void>(`${environment.apiUrl}/api/upload/abort-multipart`, {}, {
                params: new HttpParams()
                .set('key', key)
                .set('uploadId', uploadId)
                .set('status', status)
        });
    }
}