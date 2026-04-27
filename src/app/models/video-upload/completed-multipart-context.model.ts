import { UploadedPart } from "./uploaded-part.model";

export interface CompletedMultipartContext {
    key: string,
    uploadId: string,
    uploadedParts: UploadedPart[]
}