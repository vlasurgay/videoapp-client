import { BaseEntity } from "../base-entity.model";
import { Metadata } from "../video/metadata.model";
import { TransformRequest } from "../video/transform-request.model";
import { UploadStatus } from "./upload-status.enum";



export interface UploadInfo extends BaseEntity {
    fileName: string,
    title: string,
    description?: string,
    status?: UploadStatus,
    totalParts: number,
    originalMetadata: Metadata,
    transformRequest: TransformRequest
}