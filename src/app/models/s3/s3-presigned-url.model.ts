export interface S3PresignedUrl {
    partNumber: number,
    url: string,
    headers: Map<string, string>
}