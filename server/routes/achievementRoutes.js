/**
 * @fileoverview Achievement routes for managing user achievements.
 * <br><br>
 * This module defines the Express routes for fetching user achievements.
 * <br><br>
 * Each route is protected by JWT authentication middleware to ensure that only authenticated users can access these endpoints.
 */

import express from 'express';

// Services
import { getUserAchievements } from '../services/achievementService.js';

// Middleware
import { authenticateToken } from '../middleware/authenticator.js';

// Utilities
import { logError } from '../utils/logger.js';

// Router instance
const router = express.Router();

// #region GET Routes

/**
 * @swagger
 * /get-achievements:
 *   get:
 *     summary: Retrieve the list of achievements for the authenticated user.
 *     description: |
 *       Fetches the account information for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Achievements
 *     responses:
 *       200:
 *         description: A list of achievements.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               description: List of user achievements.
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "60d0fe4f5311236168a109ca"
 *                   icon:
 *                     type: string
 *                     example: "streak.svg"
 *                   name:
 *                     type: string
 *                     example: "Return Ticket"
 *                   title:
 *                     type: object
 *                     properties:
 *                       color:
 *                         type: string
 *                         example: "#FFD700"
 *                       name:
 *                         type: string
 *                         example: "Alcoholic"
 *                   unlocked:
 *                     type: boolean
 *                     example: false
 *                   description:
 *                     type: string
 *                     example: "Awarded for completing 5 rides."
 *                   conditions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                           example: "dailyLoginStreak"
 *                         required:
 *                           type: integer
 *                           example: 3
 *                         current:
 *                           type: integer
 *                           example: 1
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found. 
 *       500:
 *         description: Internal server error.
 */
router.get('/get-achievements', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getUserAchievements(userId);

        if (result.success) {
            return res.json(result.achievements);
        }
    } catch (error) {
        logError(`Error fetching achievements: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Achievement Fetch Error' });
    }
});

// #endregion

export default router;