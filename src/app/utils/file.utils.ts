import { MAX_PART_UPLOAD_SIZE } from '../constants/constants'


export class FileUtils {

    public static splitFileIntoChunks(file: File): FormData[] {

        const chunks: FormData[] = [];
        const fileId = this.createRandomUUID();
        const totalChunks = Math.ceil(file.size / MAX_PART_UPLOAD_SIZE);

        for (let chunk = 0; chunk < totalChunks; chunk++) {

            const start = chunk * MAX_PART_UPLOAD_SIZE;
            const end = Math.min(start + MAX_PART_UPLOAD_SIZE, file.size);

            const formData = new FormData();
            formData.append('fileId', fileId);
            formData.append('chunkNumber', chunk.toString());
            formData.append('totalChunks', totalChunks.toString());
            formData.append('file', file.slice(start, end));

            chunks.push(formData);
        }

        return chunks;
    }


    public static resolveTotalParts(file: File): number {
        return Math.ceil(file.size / MAX_PART_UPLOAD_SIZE);
    }


    public static getFilePart(file: File, partNumber: number): Blob {

        const start = (partNumber - 1) * MAX_PART_UPLOAD_SIZE;
        const end = Math.min(start + MAX_PART_UPLOAD_SIZE, file.size);

        return file.slice(start, end);
    }


    static createRandomUUID(): string {
        return crypto.randomUUID();
    }
    
}
