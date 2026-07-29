export class FileUtils {

    public static getFilePart(file: File, partNumber: number, maxPartUploadSize: number): Blob {

        const start = (partNumber - 1) * maxPartUploadSize;
        const end = Math.min(start + maxPartUploadSize, file.size);

        return file.slice(start, end);
    }

}
