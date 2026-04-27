import { VideoStatus } from "../../models/video/video-status.enum";

export interface UploadState { 
    key: string;
    uploadId: string; 
    status: VideoStatus; 
    totalParts: number;
    progress: number;
}