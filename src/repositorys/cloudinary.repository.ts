import cloudinary from "../config/cloudinary.config";

export class CloudinaryRepository {
    static async uploadImage(file: Express.Multer.File) {
        try {
            return await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "urbanflow/incidents",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                uploadStream.end(file.buffer);
            });
        } catch (err) {
            throw new Error("Error al subir la imagen a Cloudinary: " + err);
        }
    }

    static async uploadProcessedImage(buffer: Buffer, publicId: string) {
        try {
            return await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "urbanflow/incidents",
                        public_id: publicId,
                        resource_type: "image",
                        format: "webp",
                        overwrite: true
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                uploadStream.end(buffer);
            });
        } catch (err) {
            throw new Error(`Error al subir imagen: ${err}`);
        }
    }
}