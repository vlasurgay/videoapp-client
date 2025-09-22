import { BaseEntity } from "../base-entity.model";
import { Metadata } from "../video/metadata.model";
import { UploadInfo } from "./upload-info.model";



export interface VideoFile extends BaseEntity {
    title: string,
    creationTime: number,
    description?: string,
    uploadInfo: UploadInfo,
    generatedMetadata: Metadata[]
}