import multer from "multer";

const storage = multer.memoryStorage();

export const uploadIncidentImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
            "image/heic-sequence",
            "image/heif-sequence",
            "application/octet-stream"];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP, HEIC O HEIF"));
        }

        cb(null, true);
    }
});