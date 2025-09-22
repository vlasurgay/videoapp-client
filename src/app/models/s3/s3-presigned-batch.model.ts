import { S3PresignedUrl } from "./s3-presigned-url.model";

export interface S3PresignedBatch {
    uploadId: string,
    key: string,
    presignedUrls: S3PresignedUrl[],
    expiresAt: number
}