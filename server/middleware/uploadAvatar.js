/**
 * @fileoverview Middleware for handling avatar uploads using multer.
 * Stores uploaded avatars in the 'public/avatars' directory with a size limit of 2MB.
 * Only allows image file types (jpeg, jpg, png, gif).
 * Each file is named using the user's ID and a timestamp to ensure uniqueness.
 */

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the upload directory exists or create it
const uploadDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for avatar uploads
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(
            null,
            `${req.user.userId}_${Date.now()}${path.extname(file.originalname)}`,
        );
    },
});

// Multer upload configuration with file size limit and type filtering
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase(),
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'));
        }
    },
});

export { 
    upload, 
    uploadDir 
};
