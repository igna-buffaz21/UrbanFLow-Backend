import multer from "multer";

const storage = multer.memoryStorage();

export const uploadIncidentImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
        }

        cb(null, true);
    }
});