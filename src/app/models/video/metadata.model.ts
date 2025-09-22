import { BaseEntity } from "../base-entity.model";

export interface Metadata extends BaseEntity {
    type: string,
    format: string,
    duration: number,
    height: number,
    width: number,
    bitrate: number,
    fileSizeBytes: number,
    s3Key?: string,
    hasAudio: boolean
}