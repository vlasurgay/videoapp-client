import { MultipartPresignedUrl } from "./multipart-presigned-url.model";

export interface MultipartUploadContext {
    uploadId: string,
    key: string,
    maxPartUploadSize: number,
    presignedUrls: MultipartPresignedUrl[],
    expiresAt: number
}