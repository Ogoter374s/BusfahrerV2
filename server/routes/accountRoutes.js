/**
 * @fileoverview Account routes for user profile management.
 * <br><br>
 * This module defines the Express routes for managing user account functionalities such as:
 * fetching account information, uploading and setting avatars, changing card themes, and updating titles.
 * <br><br>
 * Each route is protected by JWT authentication middleware to ensure that only authenticated users can access these endpoints.
 */

import express from 'express';

// Services
import {
    getUserAccount,
    getCardTheme,

    uploadAvatar,
    saveAvatar,

    changeCardTheme,

    changeTitle
} from '../services/accountService.js';


// Middleware
import { upload } from '../middleware/uploadAvatar.js';
import { authenticateToken } from '../middleware/authenticator.js';

// Utilities
import { logError } from '../utils/logger.js';

// Router instance
const router = express.Router();

// #region GET Routes

/**
 * @swagger
 * /get-account:
 *   get:
 *     summary: Get user account information
 *     description: |
 *       Fetches the account information for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Account
 *     responses:
 *       200:
 *         description: User account information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                   description: User game statistics.
 *                   example: { gamesPlayed: 12, gamesBusfahrer: 12, drinksGiven: 123, }
 *                 avatar:
 *                   type: string
 *                   description: URL of the user's avatar.
 *                   example: "default.svg"
 *                 uploadedAvatar:
 *                   type: string
 *                   description: User uploaded avatar URL.
 *                   example: "64df1f91a4b2de4c785b3d12_1760782507774.jpg"
 *                 titles:
 *                   type: array
 *                   description: User unlocked titles.
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "None"
 *                       color:
 *                         type: string
 *                         example: "#f5deb3"
 *                       active:
 *                         type: boolean
 *                         example: false
 *                 selectedTitle:
 *                   type: object
 *                   description: User selected title.
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Veteran Driver"
 *                     color:
 *                       type: string
 *                       example: "#f5deb3"
 *                     active:
 *                       type: boolean
 *                       example: true
 *                 username:
 *                   type: string
 *                   description: User's username.
 *                   example: "Player123"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/get-account', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getUserAccount(userId);

        if (result.success) {
            return res.json(result.data);
        }
    } catch (error) {
        logError(`Error fetching user account: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Account Fetch Error' });
    }
});

/**
 * @swagger
 * /get-card-theme:
 *   get:
 *     summary: Get user card theme
 *     description: |
 *       Fetches the card theme settings for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Account
 *     responses:
 *       200:
 *         description: User card theme retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 theme:
 *                   type: string
 *                   example: "default"
 *                 color1:
 *                   type: string
 *                   example: "#ffffff"
 *                 color2:
 *                   type: string
 *                   example: "#ff4538"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/get-card-theme', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getCardTheme(userId);

        if (result.success) {
            return res.json(result.cardTheme);
        }
    } catch (error) {
        logError(`Error fetching card theme: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Card Theme Fetch Error' });
    }
});

// #endregion

// #region POST Routes

/**
 * @swagger
 * /upload-avatar:
 *   post:
 *     summary: Upload user avatar
 *     description: |
 *       Uploads a new avatar image for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Account
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avatarUrl:
 *                   type: string
 *                   example: "64df1f91a4b2de4c785b3d12_1760782507774.jpg"
 *       400:
 *         description: No file uploaded.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    const userId = req.user.userId;
    const cropData = req.body?.cropData;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const avatarUrl = await uploadAvatar(userId, req.file, cropData);

        if (avatarUrl) {
            return res.status(200).json({ success: true, avatarUrl });
        } else {
            return res.status(500).json({ error: 'Avatar upload failed', title: 'Avatar Upload Error' });
        }
    } catch (error) {
        logError(`Error uploading avatar: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Avatar Upload Error' });
    }
});

/**
 * @swagger
 * /set-avatar:
 *   post:
 *     summary: Set user avatar
 *     description: |
 *       Sets the avatar for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 example: "64df1f91a4b2de4c785b3d12_1760782507774.jpg"
 *     responses:
 *       200:
 *         description: Avatar set successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avatarUrl:
 *                   type: string
 *                   example: "64df1f91a4b2de4c785b3d12_1760782507774.jpg"
 *       400:
 *         description: Invalid avatar.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/set-avatar', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { avatar } = req.body;

    try {
        const avatarUrl = await saveAvatar(userId, avatar);

        if (avatarUrl) {
            return res.status(200).json({ success: true, avatarUrl });
        } else {
            return res.status(500).json({ error: 'Failed to set avatar', title: 'Set Avatar Error' });
        }
    } catch (error) {
        logError(`Error setting avatar: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Set Avatar Error' });
    }
});

/**
 * @swagger
 * /set-card-theme:
 *   post:
 *     summary: Set user card theme
 *     description: |
 *       Sets the card theme for the authenticated user.  
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 example: hexagon
 *               color1:
 *                 type: string
 *                 example: "#000000"
 *               color2:
 *                 type: string
 *                 example: "#ffffff"
 *     responses:
 *       200:
 *         description: Card theme set successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/set-card-theme', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { theme, color1, color2 } = req.body;

    try {
        const result = await changeCardTheme(userId, theme, color1, color2);

        if (result) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'Failed to set card theme', title: 'Set Card Theme Error' });
        }
    } catch (error) {
        logError(`Error setting card theme: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Set Card Theme Error' });
    }
});

/**
 * @swagger
 * /set-title:
 *   post:
 *     summary: Set user title
 *     description: |
 *       Sets the title for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Distributor"
 *     responses:
 *       200:
 *         description: Title set successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           User not found. <br>
 *           Title not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/set-title', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { title } = req.body;

    try {
        const result = await changeTitle(userId, title);

        if (result) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'Failed to set title', title: 'Title Error' });
        }
    } catch (error) {
        logError(`Error setting title: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Title Error' });
    }
});

// #endregion

export default router;