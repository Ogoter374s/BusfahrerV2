/**
 * @fileoverview Game Routes
 * <br><br>
 * This file defines the routes for game-related operations in the server. <br>
 * It includes endpoints for fetching game settings, checking spectator status, retrieving game players, 
 * player cards, game cards, drink information, game information, player information, and Busfahrer (Game Master) details. <br>
 * It also includes endpoints for giving drinks to players, flipping rows, laying cards, checking card actions,
 * advancing to the next player, retrying Phase 3, opening a new game, and leaving the game.
 */

import express from 'express';

// Services
import {
    getGameSettings,
    checkIsSpectator,

    getGamePlayers,
    getPlayerCards,
    getGameCards,

    getDrinkInfo,
    getGameInfo,
    getPlayerInfo,
    getBusfahrer,

    giveDrinkToPlayer,

    flipRow,
    layCard,
    checkCardAction,

    nextPlayer,
    retryPhase3,
    openNewGame,

    leaveGame,
} from '../services/gameService.js';

// Middleware
import { authenticateToken } from '../middleware/authenticator.js';

// Utilities
import { logError } from '../utils/logger.js';

// Router instance
const router = express.Router();

// #region GET Routes

/**
 * @swagger
 * /get-game-settings/{gameId}:
 *   get:
 *     summary: Retrieve the settings of a specific game.
 *     description: |
 *       This endpoint retrieves the settings for the game identified by the provided gameId.
 *       It returns an object containing various game settings.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve settings for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved game settings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   properties:
 *                     giving:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-game-settings/:gameId', authenticateToken, async (req, res) => {
    const { gameId } = req.params;

    try {
        const result = await getGameSettings(gameId);

        return res.json({ settings: result.settings });
    } catch (error) {
        logError(`Error fetching game settings: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Game Settings Error' });
    }
});

/**
 * @swagger
 * /is-game-spectator/{gameId}:
 *   get:
 *     summary: Check if the current user is a spectator in the specified game.
 *     description: |
 *       This endpoint checks if the user is a spectator in the game identified by the provided gameId.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to check spectator status for.
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
 *         description: Game not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/is-game-spectator/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await checkIsSpectator(gameId, userId);

        return res.json({ isSpectator: result.isSpectator });
    } catch (error) {
        logError(`Error checking spectator status: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Spectator Status Check Error' });
    }
});

/**
 * @swagger
 * /get-game-players/{gameId}:
 *   get:
 *     summary: Retrieve the list of players in a specific game.
 *     description: |
 *       This endpoint retrieves the list of players participating in the game identified by the provided gameId.
 *       It returns an array of player objects containing their details.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve players for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved game players.
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
 *                         example: "60d0fe4f5311236168a109ca"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       avatar:
 *                         type: string
 *                         example: "64df1f91a4b2de4c785b3d12_1760782507774.jpg"
 *                       title:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Busfahrer"
 *                           color:
 *                             type: string
 *                             example: "#FF5733"
 *                           active:
 *                             type: boolean
 *                             example: true
 *                       drinksPerPlayer:
 *                         type: integer
 *                         example: 2
 *                       active:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-game-players/:gameId', authenticateToken, async (req, res) => {
    const { gameId } = req.params;

    try {
        const result = await getGamePlayers(gameId);

        return res.json({ players: result.players });
    } catch (error) {
        logError(`Error fetching game players: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Game Players Error' });
    }
});

/**
 * @swagger
 * /get-player-cards/{gameId}:
 *   get:
 *     summary: Retrieve the player cards for a specific game.
 *     description: |
 *       This endpoint retrieves the cards held by the player in the game identified by the provided gameId.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve player cards for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved player cards.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       number:
 *                         type: integer
 *                         example: 7
 *                       type:
 *                         type: string
 *                         example: "diamonds"
 *                       flipped:
 *                         type: boolean
 *                         example: false
 *                       played:
 *                         type: boolean
 *                         example: false
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-player-cards/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await getPlayerCards(gameId, userId);

        return res.json({ cards: result.cards });
    } catch (error) {
        logError(`Error fetching player cards: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Player Cards Error' });
    }
});

/**
 * @swagger
 * /get-game-cards/{gameId}:
 *   get:
 *     summary: Retrieve the game cards for a specific game.
 *     description: |
 *       This endpoint retrieves the cards in play for the game identified by the provided gameId.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve cards for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved game cards.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cards:
 *                   type: array
 *                   description: A 2D array representing the pyramid layout of cards.
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         number:
 *                           type: integer
 *                           example: 5
 *                         type:
 *                           type: string
 *                           example: "spades"
 *                         flipped:
 *                           type: boolean
 *                           example: false
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-game-cards/:gameId', authenticateToken, async (req, res) => {
    const { gameId } = req.params;

    try {
        const result = await getGameCards(gameId);

        return res.json({ cards: result.cards });
    } catch (error) {
        logError(`Error fetching game cards: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Game Cards Error' });
    }
});

/**
 * @swagger
 * /get-drink-info/{gameId}:
 *   get:
 *     summary: Retrieve drink-giving information for the current player in a specific game.
 *     description: |
 *       This endpoint retrieves information about the drink-giving options available to the current player in the specified game.
 *       It returns whether the player has given a drink and if they can give more or less drinks.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve drink information for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved drink information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 given:
 *                   type: boolean
 *                   example: true
 *                 canUp:
 *                   type: boolean
 *                   example: false
 *                 canDown:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-drink-info/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await getDrinkInfo(gameId, userId);

        return res.json({ given: result.given, canUp: result.canUp, canDown: result.canDown });
    } catch (error) {
        logError(`Error fetching drink info: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Drink Info Error' });
    }
});

/**
 * @swagger
 * /get-game-info/{gameId}:
 *   get:
 *     summary: Retrieve the current state information of a specific game.
 *     description: |
 *       This endpoint retrieves the current state of the game identified by the provided gameId.
 *       It returns information such as player rows, drink rows, game phase, and various status flags.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve information for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved game information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playerRow:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Jane Smith"
 *                     info:
 *                       type: string
 *                       example: "muss"
 *                 drinkRow:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "4"
 *                     info:
 *                       type: string
 *                       example: "Schlucke trinken"
 *                 phase:
 *                   type: integer
 *                   example: 1
 *                 nextPlayerEnabled:
 *                   type: boolean
 *                   example: true
 *                 nextPhaseEnabled:
 *                   type: boolean
 *                   example: false
 *                 currentRow:
 *                   type: integer
 *                   example: 2
 *                 tryOver:
 *                   type: boolean
 *                   example: false
 *                 gameOver:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found. <br>
 *           Busfahrer not found. <br>
 *           Active player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-game-info/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await getGameInfo(gameId, userId);

        return res.json({
            playerRow: result.playerRow,
            drinkRow: result.drinkRow,
            phase: result.phase,

            nextPlayerEnabled: result?.nextPlayerEnabled,
            nextPhaseEnabled: result?.nextPhaseEnabled,

            currentRow: result?.currentRow,
            tryOver: result?.tryOver,
            gameOver: result?.gameOver
        });
    } catch (error) {
        logError(`Error fetching turn info: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Turn Info Error' });
    }
});

/**
 * @swagger
 * /get-player-info/{gameId}:
 *   get:
 *     summary: Retrieve player-specific information for a specific game.
 *     description: |
 *       This endpoint retrieves information about the current player's status in the specified game.
 *       It indicates whether the player is the game master and if they are the current active player.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve player information for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved player information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isGameMaster:
 *                   type: boolean
 *                   example: true
 *                 isCurrentPlayer:
 *                   type: boolean
 *                   example: false
 *                 drinksReceived:
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-player-info/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await getPlayerInfo(gameId, userId);

        return res.json({
            isGameMaster: result.isGameMaster,
            isCurrentPlayer: result.isCurrentPlayer,
            drinksReceived: result?.drinksReceived
        });
    } catch (error) {
        logError(`Error fetching player info: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Player Info Error' });
    }
});

/**
 * @swagger
 * /get-busfahrer/{gameId}:
 *   get:
 *     summary: Retrieve the name of the Busfahrer (Game Master) for a specific game.
 *     description: |
 *       This endpoint retrieves the name of the Busfahrer (Game Master) for the specified game.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retrieve the Busfahrer for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved Busfahrer name.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 busfahrerName:
 *                   type: string
 *                   example: "John Doe"
 *       400:
 *         description: Game is not in the correct phase.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-busfahrer/:gameId', authenticateToken, async (req, res) => {
    const { gameId } = req.params;

    try {
        const result = await getBusfahrer(gameId);

        return res.json({ busfahrerName: result.busfahrerName });
    } catch (error) {
        logError(`Error fetching busfahrer: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Get Busfahrer Error' });
    }
});

// #endregion

// #region POST Routes

/**
 * @swagger
 * /give-drink-player/{gameId}:
 *   post:
 *     summary: Give or take a drink from another player in a specific game.
 *     description: |
 *       This endpoint allows the current player to give or take a drink from another player in the specified game.
 *       It requires the ID of the target player and an increment value indicating whether to give (1) or take (-1) a drink.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to give or take a drink in.
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
 *               playerId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *               inc:
 *                 type: integer
 *                 enum: [1, -1]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Friend removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: No more drinks can be given/taken.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: |
 *           Invalid Token. <br>
 *           Not your turn.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/give-drink-player/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;
    const { inc, playerId } = req.body;

    try {
        const result = await giveDrinkToPlayer(gameId, userId, playerId, inc);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error giving drink: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Give Drink Error' });
    }
});

/**
 * @swagger
 * /flip-row/{gameId}:
 *   post:
 *     summary: Flip a row of cards in a specific game.
 *     description: |
 *       This endpoint allows the current player to flip a row of cards in the specified game.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to flip the row in.
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
 *               idx:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: Row flipped successfully.
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
 *           Cannot flip rows in the current phase. <br>
 *           Can only flip the current round row. <br>
 *           Row does not exist. <br>
 *           Row already flipped.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: |
 *           Invalid Token. <br>
 *           Not authorized. <br>
 *           Not your turn.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/flip-row/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;
    const { idx } = req.body;

    try {
        const result = await flipRow(gameId, userId, idx);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error flipping row: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Flip Row Error' });
    }
});

/**
 * @swagger
 * /lay-card/{gameId}:
 *   post:
 *     summary: Lay a card from the player's hand onto the game board in a specific game.
 *     description: |
 *       This endpoint allows the current player to lay a card from their hand onto the game board.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to lay the card in.
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
 *               idx:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: Card laid successfully.
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
 *           Invalid card index. <br>
 *           Card already played. <br>
 *           Cannot lay cards in the current phase. <br>
 *           No cards available to lay in this round. <br>
 *           Card does not match any in the current row.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: |
 *           Invalid Token.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/lay-card/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;
    const { idx } = req.body;

    try {
        const result = await layCard(gameId, userId, idx);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error laying card: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Lay Card Error' });
    }
});

/**
 * @swagger
 * /card-action/{gameId}:
 *   post:
 *     summary: Perform an action on a card in the game.
 *     description: |
 *       This endpoint allows a player to perform an action on a specific card in the game.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to perform the action in.
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
 *               cardIdx:
 *                 type: integer
 *                 example: 0
 *               action:
 *                 type: string
 *                 example: "higher"
 *               secondAction:
 *                 type: string
 *                 example: "equal"
 *     responses:
 *       200:
 *         description: Card action performed successfully.
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
 *           Game is not in Phase 3. <br>
 *           Invalid card index. <br>
 *           Invalid action. <br>
 *           Invalid second action.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: |
 *           Invalid Token.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/card-action/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;
    const { cardIdx, action, secondAction } = req.body;

    try {
        const result = await checkCardAction(gameId, userId, cardIdx, action, secondAction);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error handling card action: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Card Action Error' });
    }
});

/**
 * @swagger
 * /next-player/{gameId}:
 *   post:
 *     summary: Move to the next player's turn in a specific game.
 *     description: |
 *       This endpoint allows the current player to end their turn and pass the turn to the next player.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to move to the next player in.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully moved to the next player's turn.
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
 *         description: |
 *           Invalid Token. <br>
 *           Not your turn.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/next-player/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await nextPlayer(gameId, userId);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error moving to next player: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Next Player Error' });
    }
});

/**
 * @swagger
 * /retry-phase3/{gameId}:
 *   post:
 *     summary: Retry phase 3 of the game for the current player.
 *     description: |
 *       This endpoint allows the current player to retry phase 3 of the game.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to retry phase 3 in.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retried phase 3.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Game is not in Phase 3.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: |
 *           Invalid Token. <br>
 *           Not your turn.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/retry-phase3/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await retryPhase3(gameId, userId);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error retrying phase 3: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Retry Phase 3 Error' });
    }
});

/**
 * @swagger
 * /open-new-game/{gameId}:
 *   post:
 *     summary: Open a new game session for the specified game.
 *     description: |
 *       This endpoint allows the current player to open a new game session.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to open a new session for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully opened a new game session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Game is not over yet.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: |
 *           Invalid Token. <br>
 *           Only the Game Master can open a new game.
 *       404:
 *         description: |
 *           Game not found. <br>
 *           Lobby not found. <br>
 *           Player not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/open-new-game/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await openNewGame(gameId, userId);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error opening new game: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Open New Game Error' });
    }
});

/**
 * @swagger
 * /leave-game/{gameId}:
 *   post:
 *     summary: Leave the specified game.
 *     description: |
 *       This endpoint allows a player to leave a game.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         description: The ID of the game to leave.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully left the game.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: You are not in this game.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/leave-game/:gameId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.params;

    try {
        const result = await leaveGame(gameId, userId);

        return res.json({ success: result.success });
    } catch (error) {
        logError(`Error leaving game: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Leave Game Error' });
    }
});

// #endregion

export default router;