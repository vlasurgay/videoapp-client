import { UploadStatus } from "../../models/video/upload-status.enum";

export interface UploadState { 
    key: string;
    uploadId: string; 
    status: UploadStatus; 
    totalParts: number;
    progress: number;
}