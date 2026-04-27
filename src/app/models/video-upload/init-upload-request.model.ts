import { TargetSettings } from "./target-settings.model";

export interface InitUploadRequest {
    fileName: string,
    title?: string,
    description?: string,
    fileSizeBytes: number,
    targetSettings: TargetSettings
}