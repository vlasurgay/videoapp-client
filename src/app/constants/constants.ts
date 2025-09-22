export const AVAILABLE_FORMATS = ['mp4', 'webm', 'avi'] as const;
export const AVAILABLE_RESOLUTIONS = ['480p', '720p', '1080p'] as const;
export const AVAILABLE_CODECS = ['h264', 'vp8', 'vp9'] as const;
export const MAX_PART_UPLOAD_SIZE = 15*1024*1024