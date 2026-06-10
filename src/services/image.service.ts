import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif"
];

export class ImageService {
    static async processImage(file: Express.Multer.File): Promise<Buffer> {
        try {
            const detectedFile = await fileTypeFromBuffer(file.buffer);

            if (!detectedFile) {
                throw new Error("No se pudo identificar el archivo");
            }

            if (!ALLOWED_MIME_TYPES.includes(detectedFile.mime)) {
                throw new Error("Formato de imagen no permitido");
            }

            return await sharp(file.buffer)
                .rotate()
                .webp({ quality: 85 })
                .toBuffer();
        } catch (err) {
            throw new Error(`Error al procesar imagen: ${err}`);
        }
    }
}