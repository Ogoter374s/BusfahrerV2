/**
 * @fileoverview Routes for managing user sound preferences.
 */

import express from 'express';
import { ObjectId } from 'mongodb';

// Database
import { db, updateStatistics } from '../database/mongoClient.js';

// Middleware
import { authenticateToken } from '../middleware/authenticator.js';

// Constants
import { USER_KEYS } from '../constants/defaultKeys.js';

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
router.get('/get-click-sound', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db
            .collection('users')
            .findOne(
                { _id: new ObjectId(userId) },
                { projection: { clickSound: 1 } },
            );

        if (!user) {
            return res.status(404).json({ error: 'User not found', title: 'Error' });
        }

        res.json({ sound: user.clickSound || 'ui-click.mp3' });
    } catch (error) {
        logError(`Error fetching click sound: ${error.message}`);
        res.status(500).json({ error: 'Database error', title: 'Error' });
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
router.post('/set-click-sound', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { sound } = req.body;

    try {
        const user = await db
            .collection('users')
            .findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: 'User not found', title: 'Error' });
        }

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: { clickSound: sound },
            },
        );

        await updateStatistics(userId, {
            [USER_KEYS.CHANGED_SOUND]: { inc: 1 }
        });

        res.json({ message: 'Sound preference saved' });
    } catch (error) {
        logError(`Error updating click sound: ${error.message}`);
        res.status(500).json({ error: 'Database error', title: 'Error' });
    }
});

// #endregion

export default router;