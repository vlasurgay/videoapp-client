export interface VideoMetadata {
    format: string;
    duration: number;
    height: number;
    width: number;
    bitrate: number;
    hasAudio: boolean;
    fileSizeBytes: number;
}