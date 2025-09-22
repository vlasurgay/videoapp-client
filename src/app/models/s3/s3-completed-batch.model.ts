import { S3PartETag } from "./s3-part-e-tag.model";

export interface S3CompletedBatch {
    key: string,
    uploadId: string,
    eTags: S3PartETag[]
}