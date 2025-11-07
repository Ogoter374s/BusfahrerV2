/**
 * @fileoverview Lobby Routes - Defines the API endpoints for lobby-related operations.
 * <br><br>
 * This module sets up the Express router for handling lobby-related requests,
 * including creating lobbies, joining/leaving lobbies, managing players and spectators,
 * and handling game invitations.
 */

import express from "express";

// Services
import {
    checkIsSpectator,

    getLobbies,

    getPlayers,
    getSpectators,

    getLobbyMaster,
    getLobbyInfo,

    getLobbyInvitations,

    createLobby,
    authenticateLobby,

    leaveJoinLobby,
    joinLobby,

    kickPlayer,
    startGame,

    sendLobbyInvitation,
    acceptLobbyInvitation,
    declineLobbyInvitation,

    leaveLobby,
} from "../services/lobbyService.js";

// Middleware
import { authenticateToken } from "../middleware/authenticator.js";

// Utilities
import { logError } from "../utils/logger.js";

// Router instance
const router = express.Router();

// #region GET Routes

/**
 * @swagger
 * /is-lobby-spectator/{lobbyId}:
 *   get:
 *     summary: Check if the user is a spectator for a specific lobby.
 *     description: |
 *       This endpoint checks if the user is a spectator for the specified lobby ID.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: The ID of the lobby to check.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully checked spectator status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSpectator:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/is-lobby-spectator/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;

    try {
        const result = await checkIsSpectator(lobbyId, userId);

        return res.json({ isSpectator: result.isSpectator });
    } catch (error) {
        logError(`Error checking spectator status: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Spectator Status Check Error' });
    }
});

/**
 * @swagger
 * /get-lobbies:
 *   get:
 *     summary: Retrieve a list of all lobbies.
 *     description: |
 *       This endpoint retrieves a list of all available lobbies.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     responses:
 *       200:
 *         description: Successfully retrieved lobbies.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     example: "#ABC12"
 *                   name:
 *                     type: string
 *                     example: "My Lobby"
 *                   playerCount:
 *                     type: integer
 *                     example: 2
 *                   settings:
 *                     type: object
 *                     example: { maxPlayers: 4, isPrivate: false }
 *                   avatars:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Player"
 *                         avatar:
 *                           type: string
 *                           example: "default.svg"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-07-01T12:34:56.789Z"
 *                   spectators:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "64a7b2f5c9e77b001f2d3e4b"
 *                         name:
 *                           type: string
 *                           example: "Spectator"
 *                         avatar:
 *                           type: string
 *                           example: "default.svg"
 *                         role:
 *                           type: string
 *                           example: "spectator"
 *                         title:
 *                           type: object
 *                           example: { name: "VIP", color: "#FFD700", active: true }
 *                         joinedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-07-01T12:34:56.789Z"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-lobbies', authenticateToken, async (req, res) => {
    try {
        const result = await getLobbies();

        if (result.success) {
            return res.json(result.data);
        }
    } catch (error) {
        logError(`Error fetching lobbies: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Fetch Error' });
    }
});

/**
 * @swagger
 * /get-lobby-info/{lobbyId}:
 *   get:
 *     summary: Retrieve information about a specific lobby.
 *     description: |
 *       This endpoint retrieves detailed information about a specific lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: The ID of the lobby to retrieve information for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved lobby information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 info:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "My Lobby"
 *                     code:
 *                       type: string
 *                       example: "#ABC12"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-lobby-info/:lobbyId', authenticateToken, async (req, res) => {
    const { lobbyId } = req.params;

    try {
        const result = await getLobbyInfo(lobbyId);

        return res.json({ info: result.info });
    } catch (error) {
        logError(`Error fetching lobby info: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Info Fetch Error' });
    }
});

/**
 * @swagger
 * /is-lobby-master/{lobbyId}:
 *   get:
 *     summary: Check if the user is the lobby master for a specific lobby.
 *     description: |
 *       This endpoint checks if the authenticated user is the master of the specified lobby.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: The ID of the lobby to get the master status for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully checked lobby master status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isMaster:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/is-lobby-master/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;

    try {
        const result = await getLobbyMaster(lobbyId, userId);

        return res.json({ isMaster: result.isMaster });
    } catch (error) {
        logError(`Error checking if user is lobby master: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Master Check Error' });
    }
});

/**
 * @swagger
 * /get-lobby-players/{lobbyId}:
 *   get:
 *     summary: Retrieve the list of players in a specific lobby.
 *     description: |
 *       This endpoint retrieves the list of players currently in the specified lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: The ID of the lobby to retrieve players from.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved lobby players.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 players:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64a7b2f5c9e77b001f2d3e4a"
 *                       name:
 *                         type: string
 *                         example: "Player 1"
 *                       role:
 *                         type: string
 *                         example: "PLAYER"
 *                       avatar:
 *                         type: string
 *                         example: "avatar.png"
 *                       title:
 *                         type: string
 *                         example: "Champion"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-lobby-players/:lobbyId', authenticateToken, async (req, res) => {
    const { lobbyId } = req.params;

    try {
        const result = await getPlayers(lobbyId);

        return res.json({ players: result.players });
    } catch (error) {
        logError(`Error fetching lobby players: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Players Fetch Error' });
    }
});

/**
 * @swagger
 * /get-lobby-spectators/{lobbyId}:
 *   get:
 *     summary: Retrieve the list of spectators in a specific lobby.
 *     description: |
 *       This endpoint retrieves the list of spectators currently in the specified lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: The ID of the lobby to retrieve spectators from.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved lobby spectators.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 spectators:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64a7b2f5c9e77b001f2d3e4a"
 *                       name:
 *                         type: string
 *                         example: "Spectator 1"
 *                       avatar:
 *                         type: string
 *                         example: "avatar.png"
 *                       title:
 *                         type: string
 *                         example: "Champion"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-lobby-spectators/:lobbyId', authenticateToken, async (req, res) => {
    const { lobbyId } = req.params;

    try {
        const result = await getSpectators(lobbyId);

        return res.json({ spectators: result.spectators });
    } catch (error) {
        logError(`Error fetching lobby spectators: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Spectators Fetch Error' });
    }
});

/**
 * @swagger
 * /get-lobby-invitations:
 *   get:
 *     summary: Retrieve the list of lobby invitations for the authenticated user.
 *     description: |
 *       This endpoint retrieves the list of lobby invitations sent to the authenticated user.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     responses:
 *       200:
 *         description: Successfully retrieved lobby invitations.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lobbyId:
 *                         type: string
 *                         example: "64a7b2f5c9e77b001f2d3e4a"
 *                       player:
 *                         type: string
 *                         example: "Player 1"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-lobby-invitations', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getLobbyInvitations(userId);

        if (result.success) {
            return res.json({ invitations: result.invitations });
        }
    } catch (error) {
        logError(`Error fetching lobby invitations: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Invitation Error' });
    }
});

// #endregion

// #region POST Routes

/**
 * @swagger
 * /create-lobby:
 *   post:
 *     summary: Create a new lobby.
 *     description: |
 *       This endpoint creates a new lobby with the specified settings.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lobbyName:
 *                 type: string
 *                 example: "My Lobby"
 *               playerName:
 *                 type: string
 *                 example: "Player 1"
 *               isPrivate:
 *                 type: boolean
 *                 example: false
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               settings:
 *                 type: object
 *                 properties:
 *                   maxPlayers:
 *                     type: integer
 *                     example: 4
 *                   gameMode:
 *                     type: string
 *                     enum: [classic, timed]
 *     responses:
 *       200:
 *         description: Successfully created lobby.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lobbyId:
 *                   type: string
 *                   example: "64a7b2f5c9e77b001f2d3e4a"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/create-lobby', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyName, playerName, isPrivate, gender, settings } = req.body;

    try {
        const result = await createLobby(userId, lobbyName, playerName, isPrivate, gender, settings);

        return res.json({ success: true, lobbyId: result.lobbyId });
    } catch (error) {
        logError(`Error creating lobby: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Creation Error' });
    }
});

/**
 * @swagger
 * /check-lobby-code:
 *   post:
 *     summary: Check if a lobby code is valid.
 *     description: |
 *       This endpoint checks if the provided lobby code is valid and if the user is authorized to access it.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lobbyCode:
 *                 type: string
 *                 example: "ABC123"
 *     responses:
 *       200:
 *         description: Successfully checked lobby code.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: You are already in this lobby.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/check-lobby-code', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyCode } = req.body;

    try {
        const result = await authenticateLobby(userId, lobbyCode);

        return res.json({ success: true, lobby: result.lobby });
    } catch (error) {
        logError(`Error checking lobby code: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Code Check Error' });
    }
});

/**
 * @swagger
 * /leave-join/{lobbyId}:
 *   post:
 *     summary: Leave the join page of a specific lobby.
 *     description: |
 *       This endpoint allows a user to leave the join page of a specific lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: ID of the lobby to leave.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully left the join page.
 *       400:
 *         description: User is not in the joining list.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/leave-join/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;

    try {
        const result = await leaveJoinLobby(userId, lobbyId);

        return res.json({ success: true });
    } catch (error) {
        logError(`Error leaving join page: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Leave Join Error' });
    }
});

/**
 * @swagger
 * /post:/join-lobby/{lobbyId}:
 *   post:
 *     summary: Join a specific lobby.
 *     description: |
 *       This endpoint allows a user to join a specific lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: ID of the lobby to join.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *       - in: body
 *         name: body
 *         required: true
 *         description: User details for joining the lobby.
 *         schema:
 *           type: object
 *           properties:
 *             playerName:
 *               type: string
 *               example: "Player1"
 *             gender:
 *               type: string
 *               enum: [male, female, other]
 *               example: "male"
 *             spectator:
 *               type: boolean
 *               example: false
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerName:
 *                 type: string
 *                 example: "Player1"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *               spectator:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Successfully joined the lobby.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 lobbyId:
 *                   type: string
 *                   example: "64a7b2f5c9e77b001f2d3e4a"
 *       400:
 *         description: |
 *           Lobby is not open for joining. <br>
 *           You are already in this lobby. <br>
 *           User is not in the joining list.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           Lobby not found. <br>
 *           User not found.
 *       500:
 *         description: |
 *           Internal Server Error. <br>
 *           Failed to join lobby as spectator. <br>
 *           Failed to join lobby as player.
 */
router.post('/join-lobby/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;
    const { playerName, gender, spectator } = req.body;

    try {
        const result = await joinLobby(userId, lobbyId, playerName, gender, spectator);

        return res.json({ success: true, lobbyId: result.lobbyId });
    } catch (error) {
        logError(`Error joining lobby: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Join Lobby Error' });
    }
});

/**
 * @swagger
 * /leave-lobby/{lobbyId}:
 *   post:
 *     summary: Leave a specific lobby.
 *     description: |
 *       This endpoint allows a user to leave a specific lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: ID of the lobby to leave.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully left the lobby.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: |
 *           Cannot leave lobby, game has already started. <br>
 *           You are not in this lobby.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/leave-lobby/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;

    try {
        const result = await leaveLobby(userId, lobbyId);

        return res.json({ success: true });
    } catch (error) {
        logError(`Error leaving lobby: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Leave Lobby Error' });
    }
});

/**
 * @swagger
 * /kick-lobby-player/{lobbyId}:
 *   post:
 *     summary: Kick a player from a lobby.
 *     description: |
 *       This endpoint allows a user to kick a player from a specific lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: ID of the lobby.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *       - in: body
 *         name: playerId
 *         required: true
 *         description: ID of the player to kick.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4b"
 *     responses:
 *       200:
 *         description: Successfully kicked the player.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Player is not in this lobby.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/kick-lobby-player/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;
    const playerId = req.body.playerId;

    try {
        const result = await kickPlayer(lobbyId, userId, playerId);

        return res.json({ success: true });
    } catch (error) {
        logError(`Error kicking player: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Kick Player Error' });
    }
});

/**
 * @swagger
 * /start-game/{lobbyId}:
 *   post:
 *     summary: Start the game for a specific lobby.
 *     description: |
 *       This endpoint allows the lobby master to start the game for the specified lobby.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     parameters:
 *       - in: path
 *         name: lobbyId
 *         required: true
 *         description: ID of the lobby.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully started the game.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Game has already started.
 *       401:
 *         description: |
 *           No Token was provided. <br>
 *           Only the Game Master can start the game
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/start-game/:lobbyId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.params;

    try {
        const result = await startGame(lobbyId, userId);

        return res.json({ success: true });
    } catch (error) {
        logError(`Error starting game: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Start Game Error' });
    }
});

/**
 * @swagger
 * /send-lobby-invitation:
 *   post:
 *     summary: Send a lobby invitation to a friend.
 *     description: |
 *       This endpoint allows a user to send a lobby invitation to a friend.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "64a7b2f5c9e77b001f2d3e4b"
 *               lobbyId:
 *                 type: string
 *                 example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully sent lobby invitation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lobby invitation sent successfully."
 *       400:
 *         description: |
 *           User not found. <br>
 *           Friend not found. <br>
 *           Lobby not found. <br>
 *           You are not in this lobby. <br>
 *           Lobby not open for joining. <br>
 *           Friend is already in the lobby. <br>
 *           Friend is already invited to the lobby. <br>
 *           Friend is already joining the lobby.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/send-lobby-invitation', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId, lobbyId } = req.body;

    try {
        const result = await sendLobbyInvitation(userId, friendId, lobbyId);

        return res.json({ success: true, message: result.message });
    } catch (error) {
        logError(`Error sending lobby invitation: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Invitation Error' });
    }
});

/**
 * @swagger
 * /accept-lobby-invitation:
 *   post:
 *     summary: Accept a lobby invitation.
 *     description: |
 *       This endpoint allows a user to accept a lobby invitation.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lobbyId:
 *                 type: string
 *                 example: "#ABC123"
 *     responses:
 *       200:
 *         description: Successfully sent lobby invitation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 lobby:
 *                   type: string
 *                   example: "64a7b2f5c9e77b001f2d3e4a"
 *       400:
 *         description: |
 *           User not found. <br>
 *           Lobby not found.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/accept-lobby-invitation', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.body;

    try {
        const result = await acceptLobbyInvitation(userId, lobbyId);

        return res.json({ success: true, lobby: result.lobby });
    } catch (error) {
        logError(`Error accepting lobby invitation: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Invitation Error' });
    }
});

/**
 * @swagger
 * /decline-lobby-invitation:
 *   post:
 *     summary: Decline a lobby invitation.
 *     description: |
 *       This endpoint allows a user to decline a lobby invitation.
 *       It requires authentication via JWT token in cookies.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Lobby
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lobbyId:
 *                 type: string
 *                 example: "#ABC123"
 *     responses:
 *       200:
 *         description: Successfully declined lobby invitation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: User not found.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/decline-lobby-invitation', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { lobbyId } = req.body;

    try {
        const result = await declineLobbyInvitation(userId, lobbyId);

        return res.json({ success: true });
    } catch (error) {
        logError(`Error declining lobby invitation: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lobby Invitation Error' });
    }
});

// #endregion

export default router;