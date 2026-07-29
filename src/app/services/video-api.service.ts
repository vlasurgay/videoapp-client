import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { VideoDetails } from '../models/video/video-details.model';

@Injectable({
  providedIn: 'root'
})
export class VideoApiService {

    constructor(private http: HttpClient) {}

    getVideoDetails(publicId: string): Observable<VideoDetails> {
    return this.http.get<VideoDetails>(`${environment.apiUrl}/api/videos/${publicId}`);
  }
}