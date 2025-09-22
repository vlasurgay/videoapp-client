import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environment/environment';
import {Observable, map } from 'rxjs';
import { S3PresignedBatch } from '../models/s3/s3-presigned-batch.model';
import { UploadInfo } from '../models/video/upload-info.model';
import { S3CompletedBatch } from '../models/s3/s3-completed-batch.model';
import { S3PartETag } from '../models/s3/s3-part-e-tag.model';
import { UploadStatus } from '../models/video/upload-status.enum';

@Injectable({ providedIn: 'root' })
export class VideoApiService {

  constructor(private http: HttpClient) {}

    initiateMultipartUpload(uploadInfo: UploadInfo): Observable<S3PresignedBatch> {
        return this.http.post<S3PresignedBatch>(`${environment.apiUrl}/api/upload/init-multipart`, uploadInfo);
    }


    uploadPart(presignedUrl: string, filePart: Blob, partNumber: number, headers: Map<string, string>):Observable<S3PartETag> {

        let httpHeaders = new HttpHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            httpHeaders = httpHeaders.set(key, value);
        });

        return this.http.put(presignedUrl, filePart, { headers: httpHeaders, observe: 'response', responseType: 'text' }).pipe(
                map(response => {
                    const eTag = response.headers.get('ETag')!;
                    return { partNumber, eTag } as S3PartETag;
                })
        );
    }


    completeMultipartUpload(completedBatch: S3CompletedBatch) {
        return this.http.post<void>(`${environment.apiUrl}/api/upload/complete-multipart`, completedBatch);
    }

    
    abortMultipartUpload(key: string, uploadId: string, status: UploadStatus) {
        return this.http.post<void>(`${environment.apiUrl}/api/upload/abort-multipart`, {}, {
                params: new HttpParams()
                .set('key', key)
                .set('uploadId', uploadId)
                .set('status', status)
        });
    }
}