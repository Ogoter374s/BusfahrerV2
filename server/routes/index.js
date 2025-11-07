/**
 * @fileoverview Main Router
 * <br><br>
 * This file serves as the main router for the server application. <br>
 * It imports and uses various sub-routers for handling different aspects of the application such as user management, 
 * sound management, friend management, account management, achievement tracking, lobby management, game management, and chat functionality. <br>
 * Additionally, it includes routes for checking authentication status for users, lobbies, and games. <br>
 * Error handling is implemented to log errors and send appropriate responses to the client.
 */

import express from 'express';

// Routers
import userRouter from './userRoutes.js';
import soundRouter from './soundRoutes.js';
import friendRouter from './friendRoutes.js';
import accountRouter from './accountRoutes.js';
import achievementRouter from './achievementRoutes.js';
import lobbyRouter from './lobbyRoutes.js';
import gameRouter from './gameRoutes.js';
import chatRouter from './chatRoutes.js';

// Middleware
import { checkAuthentication, authenticateLobby, authenticateGame, authenticateToken } from '../middleware/authenticator.js';

// Utilities
import { logError } from '../utils/logger.js';

// Main Router
const router = express.Router();

router.use(userRouter);
router.use(soundRouter);
router.use(friendRouter);
router.use(accountRouter);
router.use(achievementRouter);
router.use(lobbyRouter);
router.use(chatRouter);
router.use(gameRouter);

/**
 * @swagger
 * /check-auth:
 *   get:
 *     summary: Check if the user is authenticated.
 *     description: This endpoint checks if the user is authenticated based on the JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: User is authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAuthenticated:
 *                   type: boolean
 *                   example: true
 */
router.get('/check-auth', checkAuthentication);

/**
 * @swagger
 * /check-lobby-auth/{lobbyId}:
 *   get:
 *     summary: Check if the user is authenticated for a specific lobby.
 *     description: This endpoint checks if the user is authenticated for the specified lobby ID.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: The ID of the lobby to check authentication for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: User is authenticated for the lobby.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLobbyAuthenticated:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: |
 *           Lobby is full. <br>
 *           Player is not joining the lobby and is not in the lobby already. <br>
 *           Player is not in the lobby.
 *       401:
 *         description: Unauthorized - No token provided.
 *       403:
 *         description: Invalid or expired token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Server error.
 */
router.get('/check-lobby-auth/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;

    try {
        const result = await authenticateLobby(userId, lobbyId);

        if(result.success) {
            return res.json({ isLobbyAuthenticated: true });
        }
    } catch(error) {
        logError(`Error checking lobby authentication: ${error.message}`);
        return res.status(error.status || 500).json({ error: error.message, title: 'Lobby Authentication Error' });
    }
});

/**
 * @swagger
 * /check-game-auth/{gameId}:
 *   get:
 *     summary: Check if the user is authenticated for a specific game.
 *     description: This endpoint checks if the user is authenticated for the specified game ID.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to check authentication for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4b"
 *     responses:
 *       200:
 *         description: User is authenticated for the game.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isGameAuthenticated:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Player not in game.
 *       401:
 *         description: Unauthorized - No token provided.
 *       403:
 *         description: Invalid or expired token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Server error.
 */
router.get('/check-game-auth/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await authenticateGame(userId, gameId);

        if(result.success) {
            return res.json({ isGameAuthenticated: true });
        }
    } catch(error) {
        logError(`Error checking game authentication: ${error.message}`);
        return res.status(error.status || 500).json({ error: error.message, title: 'Game Authentication Error' });
    }
});

export default router;