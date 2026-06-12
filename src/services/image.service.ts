import sharp from "sharp";
import heicConvert from "heic-convert";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/octet-stream"
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

            let imageBuffer = file.buffer;

            const isHeic =
                detectedFile.mime === "image/heic" ||
                detectedFile.mime === "image/heif";

            if (isHeic) {
                imageBuffer = Buffer.from(
                    await heicConvert({
                        buffer: imageBuffer,
                        format: "JPEG",
                        quality: 1
                    })
                );
            }

            return await sharp(imageBuffer)
                .rotate()
                .webp({ quality: 85 })
                .toBuffer();
        } catch (err) {
            throw new Error(`Error al procesar imagen: ${err}`);
        }
    }
}