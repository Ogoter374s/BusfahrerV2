
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { SOUND_KEYS } from '../constants/defaultKeys.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const soundType = req.body?.soundType || 'unknown';

        if (!Object.values(SOUND_KEYS).includes(soundType)) {
            return cb(new Error("Invalid sound type"));
        }

        cb(
            null,
            `${req.user.userId}_${Date.now()}_${soundType}${path.extname(file.originalname)}`,
        );

        console.log("Filename set");
    },
});

const upload = multer({
    storage,
    limits: { fileSize: process.env.MAX_AUDIO_SIZE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(mp3|wav|ogg|m4a)$/;
        const extname = allowedExtensions.test(
            path.extname(file.originalname).toLowerCase(),
        );

        const allowedMime = /^audio\/(mpeg|wav|ogg|mp4)$/;
        const mimetype = allowedMime.test(file.mimetype);

        if (mimetype && extname) {
            console.log("File type and extension validated");
            return cb(null, true);
        } else {
            return cb(new Error('Only audio files are allowed!'));
        }
    },
});

export {
    upload,
    uploadDir
}