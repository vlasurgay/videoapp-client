export interface MultipartPresignedUrl {
    partNumber: number,
    url: string,
    headers: Map<string, string>
}