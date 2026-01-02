/**
 * @fileoverview Routes for managing user sound preferences.
 */

import express from 'express';

// Services
import {
    getSounds,
    getUploadedSounds,
    setSound,
    uploadSound,
} from "../services/soundService.js";

// Middleware
import { authenticateToken } from '../middleware/authenticator.js';
import { upload } from '../middleware/uploadSound.js'

// Utilities
import { logError } from '../utils/logger.js';

// Router instance
const router = express.Router();

// #region GET Routes

/**
 * @swagger
 * /get-click-sound:
 *   get:
 *     summary: Get the user's click sound preference.
 *     description: |
 *       This endpoint retrieves the click sound preference for the authenticated user.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Successfully retrieved click sound preference.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sound:
 *                   type: string
 *                   example: "ui-click.mp3"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-sounds', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getSounds(userId);

        return res.json({ sounds: result.sounds });
    } catch (error) {
        logError(`Error fetching click sound: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Sound Error' });
    }
});

router.get('/get-upload-sounds', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getUploadedSounds(userId);

        return res.json({ sounds: result.sounds });
    } catch (error) {
        logError(`Error fetching click sound: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Sound Error' });
    }
});

// #endregion

// #region POST Routes

/**
 * @swagger
 * /set-click-sound:
 *   post:
 *     summary: Set the user's click sound preference.
 *     description: |
 *       This endpoint allows the user to set their preferred click sound.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sound:
 *                 type: string
 *                 example: "ui-click.mp3"
 *     responses:
 *       200:
 *         description: Successfully set click sound preference.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/set-sound', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { sound, soundType } = req.body;

    try {
        const result = await setSound(userId, soundType, sound);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error updating click sound: ${error.message}`);
        res.status(500).json({ error: error.message, title: 'Sound Error' });
    }
});

router.post('/upload-sound', authenticateToken, upload.fields([{name: 'soundType', maxCount: 1}, {name: 'sound', maxCount: 1}]), async (req, res) => {
    const userId = req.user.userId;
    const { soundType } = req.body;

    console.log(soundType + " upload attempt by userId: " + userId);

    if(!req.files?.sound?.length) {
        return res.status(400).json({ error: 'No file uploaded.', title: 'Upload Error' });
    }
    
    try {
        const file = req.files.sound[0];
        const soundUrl = await uploadSound(userId, soundType, file);

        if(soundUrl) {
            return res.status(200).json({ success: true, soundUrl });
        } else {
            return res.status(500).json({ error: 'Failed to upload sound.', title: 'Upload Error' });
        }
    } catch (error) {
        logError(`Error uploading click sound: ${error.message}`);
        res.status(500).json({ error: error.message, title: 'Sound Upload Error' });
    }
});

// #endregion

export default router;