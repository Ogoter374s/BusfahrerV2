import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path"

import { MongoClient, ObjectId } from "mongodb";
import { WebSocket, WebSocketServer } from "ws";
import { swaggerUi, swaggerSpec } from "./swagger.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.BASE_PORT;
const wbsPort = process.env.WBS_PORT
const mongoUri = process.env.MONGO_URI;

const app = express();
app.use(cors({
    origin: process.env.FRONT_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// #region MongoDB

const client = new MongoClient(mongoUri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
});

let db;
client.connect()
    .then(() => {
        console.log("Connected to MongoDB");
        db = client.db("BusfahrerV2");
    })
    .catch(err => console.error("MongoDB connection error:", err));

// #endregion

// #region WebSockets

const wss = new WebSocketServer({port: wbsPort});

const activeGameConnections = new Map();
const waitingGameConnections = new Set();
const accountConnections = new Set();

/**
 * Handles incoming WebSocket connections and manages different types of subscriptions.
 *
 * - Subscribes clients to game updates, lobby updates, or account updates based on the received message type.
 * - Stores active connections for each game, lobby, and account updates.
 * - Removes disconnected clients when the connection is closed.
 *
 * @param {WebSocket} ws - The WebSocket connection instance.
 * @param {Request} req - The incoming connection request.
 */
wss.on("connection", (ws, req) => {
    ws.on("message", (message) => {
        try {
            const {type,gameId} = JSON.parse(message);

            // Subscribe to game updates
            if(type === "subscribe" && gameId) {
                if(!activeGameConnections.has(gameId)) {
                    activeGameConnections.set(gameId, []);
                }
                activeGameConnections.get(gameId).push(ws);

                watchGameUpdates(gameId);
                watchPlayersUpdate(gameId);
                watchDrinkUpdate(gameId);
                watchCardsUpdate(gameId);
            }

            // Subscribe to lobby updates
            if(type === "lobby") {
                if(!waitingGameConnections.has(ws)) {
                    waitingGameConnections.add(ws);
                }

                watchLobbyUpdates();
            }

            // Subscribe to account updates
            if(type === "account") {
                if(!accountConnections.has(ws)) {
                    accountConnections.add(ws);
                }

                watchAccountUpdates();
            }
        } 
        catch(error) {
            logError(`Failed to process WebSocket message: ${error.stack || error.message}`);
        }
    });

    // Handle WebSocket disconnection
    ws.on("close", () => {
        for(const [gameId, sockets] of activeGameConnections.entries()) {
            activeGameConnections.set(gameId, sockets.filter((client) => client !== ws));
        }

        waitingGameConnections.delete(ws);
        accountConnections.delete(ws);
    });
});

/**
 * Watches the "users" collection in MongoDB for any updates.
 * When a change is detected, it notifies all connected WebSocket clients subscribed to account updates.
 *
 * @async
 * @function watchAccountUpdates
 * @throws {Error} Logs an error if the change stream fails to start or encounters an issue.
 */
const watchAccountUpdates = async () => {
    try {
        const collection = db.collection("users");
        const changeStream = collection.watch();

        changeStream.on("change", (change) => {
            accountConnections.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "accountUpdate" }));
                }
            });
        });
    } catch (error) {
        logError(`Error watching account updates: ${error.stack || error.message}`);
    }
};

/**
 * Watches the "games" collection in MongoDB for updates where the game status is "waiting".
 * When a change is detected, it notifies all connected WebSocket clients about the lobby update.
 *
 * @async
 * @function watchLobbyUpdates
 * @throws {Error} Logs an error if the change stream fails to start or encounters an issue.
 */
const watchLobbyUpdates = async () => {
    try {
        const collection = db.collection("games");
        const changeStream = collection.watch();

        changeStream.on("change", (change) => {
            waitingGameConnections.forEach((client) => {
                if(client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({type: "lobbysUpdate"}));
                }
            });
        });
    }
    catch(error) {
        logError(`Error watching games updates: ${error.stack || error.message}`);
    }
};

/**
 * Watches the "games" collection in MongoDB for updates to a specific game.
 * When a change is detected for the specified gameId, it notifies all connected WebSocket clients subscribed to that game.
 *
 * @async
 * @function watchGameUpdates
 * @param {string} gameId - The unique identifier of the game to watch for updates.
 * @throws {Error} Logs an error if the change stream fails to start or encounters an issue.
 */
const watchGameUpdates = async (gameId) => {
    try {
        const collection = db.collection("games");

        const changeStream = collection.watch(
            [{ $match: { "documentKey._id": new ObjectId(gameId) } }],
            { fullDocument: "updateLookup" }
        );

        changeStream.on("change", (change) => {
            const clients = activeGameConnections.get(gameId) || [];

            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "gameUpdate" }));
                }
            });
        });

    } catch (error) {
        logError(`Error watching game updates for gameId ${gameId}: ${error.stack || error.message}`);
    }
};

/**
 * Watches the "players" array in a specific game document for updates.
 * When a change is detected in the players list, it notifies all connected WebSocket clients.
 * Also watches Player Cards Updates, then notifies all connected WebSocket clients.
 *
 * @async
 * @function watchPlayersUpdate
 * @param {string} gameId - The ID of the game to watch for player updates.
 * @throws {Error} Logs an error if the change stream fails or MongoDB disconnects.
 */
const watchPlayersUpdate = async (gameId) => {
    try {
        const collection = db.collection("games");

        const changeStreamAll = collection.watch(
            [
                { $match: { "documentKey._id": new ObjectId(gameId), "updateDescription.updatedFields.players": { $exists: true } } }
            ],
            { fullDocument: "updateLookup" }
        );

        changeStreamAll.on("change", (change) => {
            const clients = activeGameConnections.get(gameId) || [];

            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "playersUpdate" }));
                }
            });
        });

        const changeStreamCards = collection.watch();

        changeStreamCards.on("change", (change) => {
            if (change.operationType === "update") {
                const updatedFields = change.updateDescription.updatedFields;
                
                const cardChanges = Object.keys(updatedFields).some(field => /^players\.\d+\.cards\.\d+\./.test(field));

                if (cardChanges) {
                    const clients = activeGameConnections.get(gameId) || [];
                    
                    clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: "playersUpdate" }));
                        }
                    });
                }
            }
        });

    } catch (error) {
        logError(`Error watching player updates for game ${gameId}: ${error.stack || error.message}`);
    }
};

/**
 * Watches the "drinkCount" field in a specific game document for updates.
 * When a change is detected in the drink count, it notifies all connected WebSocket clients.
 *
 * @async
 * @function watchDrinkUpdate
 * @param {string} gameId - The ID of the game to watch for drink count updates.
 * @throws {Error} Logs an error if the change stream fails or MongoDB disconnects.
 */
const watchDrinkUpdate = async (gameId) => {
    try {
        const collection = db.collection("games");

        const changeStream = collection.watch(
            [
                { $match: { "documentKey._id": new ObjectId(gameId), "updateDescription.updatedFields.drinkCount": { $exists: true } } }
            ],
            { fullDocument: "updateLookup" }
        );

        changeStream.on("change", (change) => {
            const clients = activeGameConnections.get(gameId) || [];

            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "drinkUpdate" }));
                }
            });
        });

    } catch (error) {
        logError(`Error watching drink count updates for game ${gameId}: ${error.stack || error.message}`);
    }
};

/**
 * Watches the "cards" and "phaseCards" fields in a specific game document for updates.
 * When a change is detected in either field, it notifies all connected WebSocket clients.
 *
 * @async
 * @function watchCardsUpdate
 * @param {string} gameId - The ID of the game to watch for card updates.
 * @throws {Error} Logs an error if the change stream fails or MongoDB disconnects.
 */
const watchCardsUpdate = async (gameId) => {
    try {
        const collection = db.collection("games");

        const changeStream = collection.watch();

        changeStream.on("change", (change) => {
            if (change.operationType === "update") {
                const updatedFields = change.updateDescription.updatedFields;

                const cardChanges = Object.keys(updatedFields).some(field => field.startsWith("cards"));
                const phaseChanges = Object.keys(updatedFields).some(field => field.startsWith("phaseCards"));

                if (cardChanges || phaseChanges) {
                    const clients = activeGameConnections.get(gameId) || [];
                    
                    clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: "cardsUpdate" }));
                        }
                    });
                }
            }
        });

    } catch (error) {
        console.error(`Error watching card updates for game ${gameId}:`, error);
    }
};

// #endregion

// #region Functions

/**
 * Logs errors to an "error.log" file with a timestamp.
 *
 * @param {string} message - The error message to log.
 */
const logError = (message) => {
    const logFilePath = path.join(__dirname, "error.log");
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;

    fs.access(logFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            fs.writeFile(logFilePath, logMessage, (writeErr) => {
                if (writeErr) console.error("Failed to create error.log:", writeErr);
            });
        } else {
            fs.appendFile(logFilePath, logMessage, (appendErr) => {
                if (appendErr) console.error("Failed to write to error.log:", appendErr);
            });
        }
    });
};

/**
 * Middleware that authenticates a user by verifying the JWT token stored in an HttpOnly cookie.
 *
 * Extracts the token from cookies, decodes and verifies it against the secret key, and attaches
 * the decoded payload to `req.user`. Proceeds to the next middleware or returns an error response
 * if authentication fails.
 *
 * @function authenticateToken
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @throws {401} Unauthorized if no token is provided.
 * @throws {403} Forbidden if token is invalid or expired.
 */
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.decode(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Invalid token" });
    }
};

/**
 * Creates a deck of playing cards with two full sets of suits and values.
 * Each deck contains:
 * - 2 sets of the 4 suits: Hearts, Diamonds, Clubs, and Spades.
 * - Each suit has 13 values (2 to 14, assuming 14 represents an Ace).
 * - The deck is shuffled before being returned.
 *
 * @function createDeck
 * @returns {Array} A shuffled array of card objects, where each card has a `number` (value) and `type` (suit).
 */
const createDeck = () => {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = Array.from({length: 13}, (_, i) => i + 2);
    let deck = [];

    for(let i=0; i < 2; i++) {
        suits.forEach((suit) => {
            values.forEach((value) => {
                deck.push({number: value, type: suit});
            });
        });
    }

    return shuffleDeck(deck);
};

/**
 * Shuffles an array of card objects using the Fisher-Yates shuffle algorithm.
 * This ensures a uniform random distribution of the deck order.
 *
 * @function shuffleDeck
 * @param {Array} deck - The array of card objects to shuffle.
 * @returns {Array} The shuffled deck.
 */
const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

/**
 * Checks if a played card is a face card (Jack, Queen, or King) and assigns drinks to the player based on the card's value and player's gender.
 *
 * - Jack (11): Adds 1 drink if the player is "Male".
 * - Queen (12): Adds 1 drink if the player is "Female".
 * - King (13): Always adds 1 drink.
 * - Any face card (Jack, Queen, King) also adds 1 drink if the player is "Divers".
 *
 * @function checkFaceCard
 * @param {Object} player - The player object.
 * @param {string} player.gender - The player's gender ("Male", "Female", "Divers").
 * @param {number} [player.drinks=0] - The number of drinks assigned to the player (default is 0).
 * @param {Object} card - The card object.
 * @param {number} card.number - The number of the card (e.g., 11 for Jack, 12 for Queen, 13 for King).
 */
const checkFaceCard = (player, card) => {
    if (![11, 12, 13].includes(card.number)) return;

    player.drinks = player.drinks ?? 0;
    const drinkConditions = [
        { condition: card.number === 11 && player.gender === "Male", drinks: 1 },
        { condition: card.number === 12 && player.gender === "Female", drinks: 1 },
        { condition: card.number === 13, drinks: 1 },
        { condition: ["Male", "Female"].includes(player.gender) === false, drinks: 1 },
    ];

    drinkConditions.forEach(({ condition, drinks }) => {
        if (condition) player.drinks += drinks;
    });
};

// #endregion

// #region GET API Endpoints

/**
 * @swagger
 * /check-auth:
 *   get:
 *     summary: Check user authentication status
 *     description: Verifies if the user is authenticated by checking the JWT token stored in an HttpOnly cookie.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Returns authentication status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAuthenticated:
 *                   type: boolean
 *                   description: Indicates if the user is authenticated.
 *                   example: true
 *       401:
 *         description: Unauthorized - No token provided.
 *       500:
 *         description: Internal server error - Invalid token or verification failed.
 */
app.get("/check-auth", (req, res) => {
    const token = req.cookies.token;

    if(!token) {
        return res.json({isAuthenticated: false});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ isAuthenticated: true});
    } 
    catch (error) {
        logError(`Invalid token attempt: ${error.stack || error.message}`);
        res.json({ isAuthenticated: false });
    }
});

/**
 * @swagger
 * /get-statistics:
 *   get:
 *     summary: Retrieves the authenticated user's statistics.
 *     description: Fetches user statistics from MongoDB based on the authenticated user's ID.
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized. No valid JWT provided.
 *       403:
 *         description: Forbidden. Invalid or expired JWT.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-statistics", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if(!user) {
            return res.status(404).json({error: "User not found"});
        }

        res.json(user.statistics);
    }
    catch(error) {
        logError(`Error fetching user statistics for userId ${userId}: ${error.stack || error.message}`);
        res.status(500).json({ error: "Failed to fetch user statistics" });
    }
});

/**
 * @swagger
 * /get-waiting-games:
 *   get:
 *     summary: Retrieve all waiting games with fewer than 10 players.
 *     description: >
 *       Returns a list of all games that have a status of "waiting" and have fewer than 10 players.
 *       Includes only their ID, name, and player count. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     responses:
 *       200:
 *         description: A list of waiting games with limited information.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique identifier of the game.
 *                   name:
 *                     type: string
 *                     description: The name of the game.
 *                   playerCount:
 *                     type: integer
 *                     description: The number of players in the game.
 *       401:
 *         description: Unauthorized - Token is missing or invalid.
 *       500:
 *         description: Internal server error - Failed to fetch games.
 */
app.get("/get-waiting-games", authenticateToken, async (req, res) => {
    try {
        const games = await db.collection("games")
            .find({ status: "waiting" })
            .project({_id: 1, name: 1, players: 1})
            .toArray();

        const format = games.map(game => ({
            id: game._id.toString(),
            name: game.name,
            playerCount: game.players ? game.players.length : 0,
        }))
        .filter(game => game.playerCount < 10);

        res.json(format);
    } catch (error) {
        logError(`Error fetching waiting games: ${error.stack || error.message}`);
        res.status(500).json({ error: "Failed to fetch games" });
    }
});

/**
 * @swagger
 * /get-player-id:
 *   get:
 *     summary: Retrieves the authenticated player's ID.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Returns the unique player ID associated with the authenticated user.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Players
 *     responses:
 *       200:
 *         description: Successfully retrieved player ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "60f7b2f5c8e4d2534c1b0b99"
 *       401:
 *         description: Unauthorized - Token is missing or invalid.
 *       403:
 *         description: Forbidden - Invalid or expired JWT token.
 */
app.get("/get-player-id", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    return res.json(userId);
});

/**
 * @swagger
 * /get-players/{gameId}:
 *   get:
 *     summary: Retrieves a list of players with only ID and name.
 *     description: >
 *       Fetches and returns only the player ID and name from the specified game.
 *       Requires a valid game ID.
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     tags:
 *       - Games
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of players (ID & Name only).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The player's unique identifier.
 *                   name:
 *                     type: string
 *                     description: The player's name.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error - Failed to fetch players.
 */
app.get("/get-players/:gameId", async (req, res) => {
    const {gameId} = req.params;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({error: "Game not found"});
        }

        const players = game.players.map(player => ({
            id: player.id,
            name: player.name
        }));

        res.status(200).json(players);
    }
    catch(error) {
        logError(`Error fetching players for game (${gameId}): ${error.message}`);
        res.status(500).json({ error: "Failed to fetch players" });
    }
});

/**
 * @swagger
 * /is-game-master:
 *   get:
 *     summary: Checks if the authenticated user is the game master.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Checks if the requesting player is the first player in the game's player list (Game Master).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     tags:
 *       - Games
 *     responses:
 *       200:
 *         description: Boolean indicating whether the user is the game master.
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *               example: true
 *       400:
 *         description: Bad request - Missing game ID.
 *       401:
 *         description: Unauthorized - Token is missing or invalid.
 *       403:
 *         description: Forbidden - Invalid or expired JWT token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/is-game-master", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const isGameMaster = game.players.length > 0 && game.players[0].id === userId;

        return res.status(200).json(isGameMaster);
    }
    catch(error) {
        logError(`Error verifying game master (${gameId}): ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /get-player-cards:
 *   get:
 *     summary: Retrieves the player's cards from the game.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Fetches the current player's card data from the game document.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved the player's cards.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   suit:
 *                     type: string
 *                     description: The suit of the card.
 *                   value:
 *                     type: string
 *                     description: The value of the card.
 *                   played:
 *                     type: boolean
 *                     description: Indicates if the card has been played.
 *       404:
 *         description: Game not found or player not in game.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-player-cards", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({error: "Game not found"});
        }

        const player = game.players.find(p => p.id === userId);
        if (!player) {
            return res.status(404).json({ error: "Player not in game" });
        }

        return res.status(200).json(player.cards || []);
    }
    catch(error) {
        logError(`Error fetching player cards for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch player cards" });
    }
});

/**
 * @swagger
 * /get-game-cards:
 *   get:
 *     summary: Retrieves the game's pyramid cards.
 *     description: >
 *       Fetches the game’s pyramid card data from the database.
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved the game cards.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   suit:
 *                     type: string
 *                     description: The suit of the card.
 *                   value:
 *                     type: string
 *                     description: The value of the card.
 *                   flipped:
 *                     type: boolean
 *                     description: Indicates if the card has been flipped.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-game-cards", authenticateToken, async (req, res) => {
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        return res.status(200).json(game.cards || []);
    }
    catch(error) {
        logError(`Error fetching game cards for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch game cards" });
    }
});

/**
 * @swagger
 * /get-round:
 *   get:
 *     summary: Retrieves the current round number of the game.
 *     description: >
 *       Fetches the current round from the game document in the database.
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved the round number.
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               description: The current round number.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-round", async (req, res) => {
    const {gameId} = req.query;

    try {
        const game = await db.collection("games")
            .findOne({ _id: new ObjectId(gameId) }, { projection: { round: 1 } });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        return res.status(200).json(game.round);
    }
    catch(error) {
        logError(`Error fetching round for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch round" });
    }
});

/**
 * @swagger
 * /get-current-player:
 *   get:
 *     summary: Retrieves the current active player in the game.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Fetches the currently active player in the game.
 *       If the game is in phase 2 and round 2, returns the requesting player's name instead.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved the current active player.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playerId:
 *                   type: string
 *                   description: The ID of the active player.
 *                 playerName:
 *                   type: string
 *                   description: The name of the active player.
 *       404:
 *         description: Game not found or player not in game.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-current-player", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { activePlayer: 1, players: 1, phase: 1, round: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const { activePlayer, players, phase, round } = game;

        const player = players.find(p => p.id === activePlayer);
        if (!player) {
            return res.status(404).json({ error: "Player not in game" });
        }

        if (phase === "phase2" && round === 2) {
            const reqPlayer = players.find(p => p.id === userId);
            if (!reqPlayer) {
                return res.status(404).json({ error: "Player not in game" });
            }

            return res.status(200).json({ playerId: activePlayer, playerName: reqPlayer.name });
        }

        return res.status(200).json({ playerId: activePlayer, playerName: player.name });
    }
    catch(error) {
        logError(`Error fetching current player for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch current player" });
    }
});

/**
 * @swagger
 * /get-drink-count:
 *   get:
 *     summary: Retrieves the drink count in the game.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       If the game is in phase 2 and round 2, returns the player's own drink count.
 *       Otherwise, returns the global game drink count.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved the drink count.
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               description: The current drink count.
 *       404:
 *         description: Game not found or player not in game.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-drink-count", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { drinkCount: 1, phase: 1, round: 1, players: 1 } }
        );

        if(!game) {
            return res.status(404).json({error: "Game not found"});
        }

        const { drinkCount, phase, round, players } = game;

        if (phase === "phase2" && round === 2) {
            const player = players.find(p => p.id === userId);
            if (!player) {
                return res.status(404).json({ error: "Player not in game" });
            }

            return res.status(200).json(player.drinks || 0);
        }

        return res.status(200).json(drinkCount || 0);
    }
    catch(error) {
        logError(`Error fetching drink count for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch drink count" });
    }
});

/**
 * @swagger
 * /get-is-row-flipped:
 *   get:
 *     summary: Checks if the current row of the pyramid is flipped.
 *     description: >
 *       Determines whether the current round is the same as the last round or if the game has reached round 6.
 *       Returns `true` if the row should be flipped, otherwise `false`.
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved row flip status.
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *               description: Indicates whether the row should be flipped.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-is-row-flipped", async (req, res) => {
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { round: 1, lastRound: 1 } }
        );

        if(!game) {
            return res.status(404).json({error: "Game not found"});
        }

        const flipped = (game.round === game.lastRound) || (game.round === 6);
        
        return res.status(200).json(flipped);
    }
    catch(error) {
        logError(`Error checking row flip status for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to check row flip status" });
    }
});

/**
 * @swagger
 * /get-phase-cards:
 *   get:
 *     summary: Retrieves the phase cards of the game.
 *     description: >
 *       Fetches the phase cards associated with the given game ID.
 *       Uses MongoDB for data storage and ensures proper error handling.
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved the phase cards.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   suit:
 *                     type: string
 *                     description: The suit of the card.
 *                   number:
 *                     type: integer
 *                     description: The number of the card.
 *                   flipped:
 *                     type: boolean
 *                     description: Whether the card is flipped.
 *       400:
 *         description: Invalid game ID format.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-phase-cards", async (req, res) => {
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        res.status(200).json(game.phaseCards || []);
    }
    catch (error) {
        logError(`Error fetching phase cards for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error fetching phase cards" });
    }
});

/**
 * @swagger
 * /get-busfahrer:
 *   get:
 *     summary: Retrieves the "Busfahrer" (driver) for the game.
 *     description: Fetches the Busfahrer (driver) player(s) from the game using MongoDB and returns their name(s) and player ID(s).
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved Busfahrer details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 busfahrerName:
 *                   type: string
 *                   description: The name(s) of the Busfahrer.
 *                 playerIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: The IDs of the Busfahrer players.
 *       400:
 *         description: Missing gameId query parameter.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-busfahrer", async (req, res) => {
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const playerIds = game.busfahrer;
        let busfahrerName = "";

        for (const id of playerIds) {
            const player = game.players.find(p => p.id === id);
            if (!player) {
                return res.status(404).json({ error: "Player not in game" });
            }

            busfahrerName = busfahrerName ? `${busfahrerName} & ${player.name}` : player.name;
        }

        res.status(200).json({ busfahrerName, playerIds });
    }
    catch(error) {
        logError(`Error fetching busfahrer for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch busfahrer" });
    }
});

/**
 * @swagger
 * /all-cards-played:
 *   get:
 *     summary: Checks if all required cards have been played for the current round.
 *     description: Determines if a player has played all necessary cards based on the round's rules.
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the game.
 *     responses:
 *       200:
 *         description: Returns whether all required cards have been played.
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *               description: True if all required cards have been played, false otherwise.
 *       400:
 *         description: Missing gameId query parameter.
 *       401:
 *         description: Unauthorized or expired token.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/all-cards-played", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const player = game.players.find(p => p.id === userId);
        if (!player) {
            return res.status(404).json({ error: "Player not in game" });
        }

        const playerCards = player.cards;
        let filterCards = [];

        // Determine the filter criteria based on the game round
        if (game.round === 1) {
            filterCards = playerCards.filter(card => card.number >= 2 && card.number <= 10);
        } else if (game.round === 2) {
            let allPlayersPlayed = game.players.every(p => 
                p.cards.filter(card => card.number >= 11 && card.number <= 13)
                      .every(card => card.played === true)
            );
            return res.json(allPlayersPlayed);
        } else if (game.round === 3) {
            filterCards = playerCards.filter(card => card.number === 14);
        }

        const hasPlayedAll = filterCards.every(card => card.played === true);

        res.status(200).json(hasPlayedAll);
    }
    catch(error) {
        logError(`Error checking all played cards for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to check played cards" });
    }
});

/**
 * @swagger
 * /get-has-to-ex:
 *   get:
 *     summary: Retrieves if the active player has to down the drink.
 *     description: Fetches if the current active player has to down the drink.
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved downing.
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               description: Boolean if the active player has to down the drink.
 *       400:
 *         description: Missing gameId query parameter.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-has-to-ex", async (req, res) => {
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const playerId = game.activePlayer;
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            return res.status(404).json({ error: "Player not in game" });
        }

        const exen = player.exen;

        return res.status(200).json(exen);
    }
    catch(error) {
        logError(`Error checking has-to-ex for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to check to ex" });
    }
});

/**
 * @swagger
 * /get-end-game:
 *   get:
 *     summary: Retrieves the end-game status.
 *     description: Checks whether the specified game has reached its end.
 *     parameters:
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the game.
 *     responses:
 *       200:
 *         description: Successfully retrieved end-game status.
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *               description: True if the game has ended, false otherwise.
 *       400:
 *         description: Missing gameId query parameter.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-end-game", async (req, res) => {
    const {gameId} = req.query;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const end = game.endGame || false;

        return res.status(200).json(end);
    }
    catch(error) {
        logError(`Error fetching end game status for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch end game" });
    }
});

// #endregion

// #region POST API Endpoints

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with a hashed password, initializes their statistics, and sets a JWT token in an HTTP-only cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The desired username for the new account.
 *               password:
 *                 type: string
 *                 description: The password for the new account.
 *     responses:
 *       200:
 *         description: Registration successful, JWT token set in cookies.
 *       400:
 *         description: Username already exists or user already authenticated.
 *       500:
 *         description: Internal server error - Failed to register user.
 */
app.post("/register", async (req, res) => {
    if (req.cookies?.token) {
        return res.status(400).json({ error: "Already authenticated" });
    }

    const { username, password } = req.body;

    try {
        const usersCollection = db.collection("users");

        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const stats = {
            gamesPlayed: 0,
            gamesBusfahrer: 0,
            drinksGiven: 0,
            drinksSelf: 0,
            numberEx: 0,
            maxDrinksGiven: 0,
            maxDrinksSelf: 0,
            maxCardsSelf: 0,
            layedCards: 0
        };

        const result = await usersCollection.insertOne({
            username,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: new Date(),
            statistics: stats
        });

        const token = jwt.sign(
            { userId: result.insertedId.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        res.cookie("token", token, {
            httpOnly: true, 
            sameSite: "strict",
            maxAge: 12 * 60 * 60 * 1000,
        });

        res.json({ success: true });
    } 
    catch (error) {
        logError(`Error registering user: ${error.stack || error.message}`);
        res.status(500).json({ error: "Failed to register user" });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and start session
 *     description: Verifies user credentials and issues a JWT token stored in an HTTP-only cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *     responses:
 *       200:
 *         description: Login successful, JWT token set in cookies.
 *       400:
 *         description: Invalid username or password.
 *       500:
 *         description: Internal server error - Failed to log in.
 */
app.post("/login", async (req, res) => {
    if (req.cookies?.token) {
        return res.status(400).json({ error: "Already authenticated" });
    }

    const {username, password} = req.body;

    try {
        const usersCollection = db.collection("users");
        
        const user = await usersCollection.findOne({username});
        if(!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "Strict",
            maxAge: 12 * 60 * 60 * 1000,
        });

        res.json({success: true});
    }
    catch(error) {
        logError(`Error logging in: ${error.stack || error.message}`);
        res.status(500).json({ error: "Failed to log in" });
    }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logs out the current user.
 *     description: Clears the user's session by invalidating the HttpOnly authentication cookie.
 *     responses:
 *       200:
 *         description: User successfully logged out.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error.
 */
app.post('/logout', (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict',
            path: '/'
        });

        res.status(200).json({success: true});
    } catch (error) {
        logError(`Logout error: ${error.stack || error.message}`);
        res.status(500).json({ success: false});
    }
});

/**
 * @swagger
 * /create-game:
 *   post:
 *     summary: Creates a new game.
 *     description: >
 *       Authenticates the user via JWT token stored in an HttpOnly cookie.
 *       Creates a new game document in MongoDB with provided game settings and the authenticated user as Game Master.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameName:
 *                 type: string
 *               playerName:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Divers]
 *     responses:
 *       200:
 *         description: Game successfully created, returns the game ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 gameId:
 *                   type: string
 *       401:
 *         description: Unauthorized (no token provided).
 *       403:
 *         description: Forbidden - invalid or expired JWT token.
 *       500:
 *         description: Internal server error.
 */
app.post("/create-game", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {gameName, playerName, isPrivate, gender} = req.body;

    try {
        const newGame = {
            name: gameName,
            players: [{
                id: userId,
                name: playerName, 
                role: "Game Master", 
                gender: gender,
                cards: [],
                drinks: 0,
                exen: false,
            }],
            status: "waiting",
            private: isPrivate,
            activePlayer: userId,
            cards: [],
            drinkCount: 0,
            round: 1,
            lastRound: 0,
            phase: "phase1",
            createdAt: new Date()
        };

        const result = await db.collection("games").insertOne(newGame);

        res.status(200).json({ success: true, gameId: result.insertedId });
    } 
    catch(error) {
        logError(`Error creating game: ${error.message}`);
        res.status(500).json({ success: false, error: "Failed to create game" });
    }
});

/**
 * @swagger
 * /check-game-code:
 *   post:
 *     summary: Validates user authentication and checks if the game exists and if the player already joined.
 *     description: >
 *       Authenticates the user using JWT stored in an HttpOnly cookie.
 *       Checks if the requested game exists in the database and verifies the user is not already in the game.
 *       Returns game details if successful, or appropriate error messages otherwise.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Game exists, and the user can join.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 game:
 *                   type: string
 *       400:
 *         description: User already joined this game.
 *       401:
 *         description: Unauthorized, no valid token provided.
 *       403:
 *         description: Forbidden, invalid or expired JWT token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/check-game-code", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found." });
        }

        const isPlayerInGame = game.players.some(player => player.id === userId);

        if (isPlayerInGame) {
            return res.status(400).json({ error: "Player already joined this game." });
        }

        res.status(200).json({ success: true, game: gameId });
    } catch (error) {
        logError(`Error joining game (${gameId}): ${error.message}`);
        res.status(500).json({ error: "Failed to join game due to server error." });
    }
});

/**
 * @swagger
 * /join-game/{gameId}:
 *   post:
 *     summary: Allows a player to join a game.
 *     description: >
 *       Authenticates the user via a JWT stored in an HttpOnly cookie.
 *       Checks if the requested game exists, is in "waiting" status, and the player is not already in the game.
 *       If all conditions are met, adds the player to the game.
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game to join.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerName:
 *                 type: string
 *                 description: The name of the player joining.
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Divers]
 *                 description: The gender of the player.
 *     responses:
 *       200:
 *         description: Player successfully joined the game.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (e.g., game is not joinable, player already in the game).
 *       401:
 *         description: Unauthorized, no token provided.
 *       403:
 *         description: Forbidden, invalid or expired JWT token.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/join-game/:gameId", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {playerName, gender} = req.body;
    const {gameId} = req.params;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({error: "Game not found"});
        }

        if(game.status !== "waiting") {
            return res.status(400).json({error: "Game is not joinable"});
        }

        if (game.players.some(player => player.id === userId)) {
            return res.status(400).json({ error: "Player already in game" });
        }

        const result = await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $push: {
                    players: {
                        id: userId,
                        name: playerName,
                        gender: gender,
                        role: "Player",
                        cards: [],
                        drinks: 0,
                        exen: false
                    }
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: "Failed to join game" });
        }

        res.status(200).json({ message: "Player joined game" });
    }
    catch(error) {
        logError(`Error joining game (${gameId}): ${error.message}`);
        res.status(500).json({ error: "Failed to join game" });
    }
});

/**
 * @swagger
 * /kick-player:
 *   post:
 *     summary: Removes a player from a game.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Allows only the Game Master to remove a player from the game.
 *       Sends a WebSocket notification to inform the removed player.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique identifier of the game.
 *               id:
 *                 type: string
 *                 description: The unique identifier of the player to be removed.
 *     responses:
 *       200:
 *         description: Player successfully removed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Only the Game Master can kick players.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/kick-player", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    const {gameId, id} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can kick players" });
        }

        if (game.players[0].id === id) {
            return res.status(403).json({ error: "The Game Master cannot kick himself" });
        }

        const updatedPlayers = game.players.filter(player => player.id !== id);

        const result = await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { players: updatedPlayers } }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: "Failed to update game data" });
        }

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "kicked", id}));
            }
        });

        return res.status(200).json({ message: "Player kicked successfully" });
    }
    catch(error) {
        logError(`Error kicking player in game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error kicking player" });
    }
});

/**
 * @swagger
 * /start-game:
 *   post:
 *     summary: Starts the game if the user is the Game Master.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Allows only the Game Master to start the game.
 *       Assigns 10 random cards to each player, creates the pyramid, updates player statistics,
 *       and notifies all players via WebSocket.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Game started successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Only the Game Master can start the game.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/start-game", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    const {gameId} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players.length === 0 || game.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the game" });
        }

        let deck = createDeck();
        const updatedPlayers = game.players.map((player) => {
            const playerCards = deck.splice(0, 10).map(card => ({ ...card, played: false }));
            return { ...player, cards: playerCards };
        });

        const pyramid = deck.splice(0, 15).map(card => ({ ...card, flipped: false }));

        const result = await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { players: updatedPlayers, cards: pyramid, status: "started" } }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: "Failed to update game data" });
        }

        for (const player of game.players) {
            await db.collection("users").updateOne(
                { _id: new ObjectId(player.id) },
                { $inc: { "statistics.gamesPlayed": 1 } }
            );
        }
        
        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "start"}));
            }
        });
        
        return res.status(200).json({ message: "Game started successfully" });
    }
    catch(error) {
        logError(`Error starting game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error starting game" });
    }
});

/**
 * @swagger
 * /leave-game:
 *   post:
 *     summary: Allows a player to leave a game.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       If the player leaving is the Game Master, the game is deleted.
 *       Otherwise, the player is simply removed from the game.
 *       Notifies all connected players via WebSocket.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Player successfully left the game.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/leave-game", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    const {gameId} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players[0].id !== userId) {
            const updatedPlayers = game.players.filter(player => player.id !== userId);

            const result = await db.collection("games").updateOne(
                { _id: new ObjectId(gameId) },
                { $set: { players: updatedPlayers } }
            );

            if (result.modifiedCount === 0) {
                return res.status(500).json({ error: "Failed to update game data" });
            }

            return res.status(200).json({ success: true, message: "one" });
        }

        if (game.players[0].id === userId) {
            const deleteResult = await db.collection("games").deleteOne({ _id: new ObjectId(gameId) });
            
            if (deleteResult.deletedCount === 0) {
                return res.status(500).json({ error: "Failed to delete game" });
            }

            const clients = activeGameConnections.get(gameId) || [];
            clients.forEach(client => {
                if(client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({type: "close", userId}));
                }
            });

            return res.status(200).json({ success: true, message: "all" });
        }
    }
    catch(error) {
        logError(`Error leaving game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error leaving lobby" });
    }
});

/**
 * @swagger
 * /flip-row:
 *   post:
 *     summary: Flips a row in the pyramid.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Only the Game Master can flip a row, and only one row can be flipped per turn.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique identifier of the game.
 *               rowIdx:
 *                 type: integer
 *                 description: The index of the row to flip (1-5).
 *     responses:
 *       200:
 *         description: Successfully flipped the row.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message.
 *       400:
 *         description: Invalid row index or row already flipped.
 *       403:
 *         description: Only the Game Master can flip rows.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/flip-row", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId, rowIdx } = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can flip rows" });
        }

        const currentRound = game.round || 1;
        const lastFlippedRound = game.lastRound || 0;

        if (currentRound === lastFlippedRound) {
            return res.status(400).json({ error: "You can only flip one row per turn" });
        }
        
        if (rowIdx < 1 || rowIdx > 5) {
            return res.status(400).json({ error: "Invalid row ID" });
        }

        let pyramid = game.cards || [];
        let idx = 0;

        // Calculate the index where the row starts in the pyramid
        for(let i=1; i < rowIdx; i++) {
            idx += i;
        }

        const rowCards = pyramid.slice(idx, idx + rowIdx);

        if (rowCards.every(card => card.flipped)) {
            return res.status(400).json({ error: "This row is already flipped" });
        }

        rowCards.forEach(card => (card.flipped = true));

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    cards: pyramid,
                    lastRound: currentRound
                }
            }
        );

        res.status(200).json({ message: `Row ${rowIdx} flipped` });
    }
    catch (error) {
        logError(`Error flipping row for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error flipping row" });
    }
});

/**
 * @swagger
 * /lay-card:
 *   post:
 *     summary: Lays down a card during the game.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Only the current active player can lay a card.
 *       If the card matches a pyramid card in the current row, it is marked as played, and drinks are added.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique identifier of the game.
 *               cardIdx:
 *                 type: integer
 *                 description: The index of the card being played.
 *     responses:
 *       200:
 *         description: Successfully laid the card.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message.
 *       400:
 *         description: Card has already been played.
 *       403:
 *         description: Only the current player can lay a card.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/lay-card", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId, cardIdx } = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current Player can lay down cards" });
        }

        const { players, cards, round, drinkCount } = game;

        const playerIndex = players.findIndex(p => p.id === userId);
        if(playerIndex === -1) {
            return res.status(404).json({error: "Player not in game"});
        }

        const player = players[playerIndex];

        if (cardIdx < 0 || cardIdx >= player.cards.length) {
            return res.status(400).json({ error: "Invalid card index" });
        }

        let idx = 0;
        let rowIdx = round;

        // Calculate the starting index of the current row
        for(let i=1; i < rowIdx; i++) {
            idx += i;
        }

        const rowCards = cards.slice(idx, idx + rowIdx);
        const card = players[playerIndex].cards[cardIdx];

        if (card.played) {
            return res.status(400).json({ error: "Card has already been played" });
        }

        const isInRow = rowCards.some(rCard => rCard.number === card.number);
        let updatedDrinkCount = drinkCount;

        if (isInRow) {
            players[playerIndex].cards[cardIdx].played = true;
            updatedDrinkCount += rowIdx;
        }

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    players: players,
                    drinkCount: updatedDrinkCount
                }
            }
        );

        res.status(200).json({ message: "Card played!" });
    }
    catch (error) {
        logError(`Error laying card for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error laying card" });
    }
});

/**
 * @swagger
 * /next-player:
 *   post:
 *     summary: Advances to the next player's turn.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Only the current active player can click "Next Player."
 *       Updates the active player and increments the round when necessary.
 *       Updates the statistics for drinks given.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully updated the next player's turn.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message.
 *       403:
 *         description: Only the current active player can proceed to the next turn.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/next-player", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current Player can click Next Player" });
        }

        const { players, round, drinkCount } = game;

        const playerIndex = players.findIndex(p => p.id === userId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: "Player not in game" });
        }

        let nextPlayerIndex = (playerIndex + 1) % players.length;
        let nextRound = round;

        if (nextPlayerIndex === 0 && nextRound < 6) {
            nextRound += 1;
        }

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const stats = user.statistics;
        stats.drinksGiven += drinkCount;
        stats.maxDrinksGiven = Math.max(stats.maxDrinksGiven, drinkCount);

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { statistics: stats } }
        );

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    activePlayer: players[nextPlayerIndex].id,
                    round: nextRound,
                    drinkCount: 0
                }
            }
        );

        res.status(200).json({ message: "Next player's turn!" });
    }
    catch (error) {
        logError(`Error updating next player for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error updating next player" });
    }
});

/**
 * @swagger
 * /start-phase2:
 *   post:
 *     summary: Starts phase 2 of the game.
 *     description: >
 *       Authenticates the user using a JWT stored in an HttpOnly cookie.
 *       Only the Game Master can start phase 2.
 *       Determines the "Busfahrer" (players with the most unplayed cards).
 *       Updates game state and user statistics.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Games
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique identifier of the game.
 *     responses:
 *       200:
 *         description: Successfully started phase 2.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message.
 *       403:
 *         description: Only the Game Master can start phase 2.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/start-phase2", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    const {gameId} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if(!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const { players } = game;

        if (players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the next phase" });
        }

        let maxCards = 0;
        let busfahrer = [];

        players.forEach(player => {
            const unplayedCards = player.cards.filter(card => !card.played).length;

            if (unplayedCards > maxCards) {
                maxCards = unplayedCards;
                busfahrer = [player.id];
            } else if (unplayedCards === maxCards) {
                busfahrer.push(player.id);
            }
        });

        let phaseCards = [];

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    busfahrer,
                    drinkCount: 0,
                    lastRound: 0,
                    round: 1,
                    phase: "phase2",
                    phaseCards
                }
            }
        );

        const playerIds = players.map(player => player.id);

        await Promise.all(playerIds.map(async (id) => {
            const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const stats = user.statistics;

            if (busfahrer.includes(id)) {
                stats.gamesBusfahrer++;
            }

            const player = players.find(p => p.id === id);
            if (player) {
                const unplayedCards = player.cards.filter(card => !card.played).length;

                stats.layedCards += (10 - unplayedCards);
                stats.maxCardsSelf = Math.max(stats.maxCardsSelf, unplayedCards);
            }

            await db.collection("users").updateOne(
                { _id: new ObjectId(id) },
                { $set: { statistics: stats } }
            );
        }));
        
        
        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "phase2"}));
            }
        });

        res.status(200).json({ message: "Phase 2 started!" });
    } 
    catch (error) {
        logError(`Error starting phase 2 for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error starting Phase 2" });
    }
});

/**
 * @swagger
 * /lay-card-phase:
 *   post:
 *     summary: Allows a player to lay down a card in the current phase.
 *     description: Validates and processes a card played by the current player based on the game round. Updates the game state accordingly.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique ID of the game.
 *               cardIdx:
 *                 type: integer
 *                 description: The index of the card in the player's hand.
 *     responses:
 *       200:
 *         description: Card played successfully.
 *       400:
 *         description: Invalid card play based on game rules.
 *       403:
 *         description: Player not authorized to play this card.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/lay-card-phase", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId, cardIdx } = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.round !== 2 && game.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current player can lay down cards" });
        }

        const players = game.players;
        const playerIndex = players.findIndex(p => p.id === userId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: "Player not in game" });
        }

        const player = players[playerIndex];
        const card = player.cards[cardIdx];

        if (card.played) {
            return res.status(400).json({ error: "Card has already been played" });
        }

        // Validate card based on the round
        if (game.round === 1 && (card.number < 2 || card.number > 10)) {
            return res.status(400).json({ error: "Only cards with numbers 2-10 can be played in round 1" });
        }
        if (game.round === 2 && (card.number < 11 || card.number > 13)) {
            return res.status(400).json({ error: "Only J, Q, K can be played in round 2" });
        }
        if (game.round === 3 && card.number !== 14) {
            return res.status(400).json({ error: "Only A can be played in round 3" });
        }

        const phaseCards = game.phaseCards || [];
        let roundCards = phaseCards[game.round - 1] || { cards: [] };
        roundCards.cards.unshift(card);
        players[playerIndex].cards[cardIdx].played = true;

        if (phaseCards.length >= game.round) {
            phaseCards[game.round - 1] = roundCards;
        } else {
            phaseCards.push(roundCards);
        }

        let updateFields = { phaseCards, players };

        if (game.round === 1) {
            updateFields.drinkCount = (game.drinkCount || 0) + card.number;
        }

        if (game.round === 2) {
            players.forEach(p => checkFaceCard(p, card));
        }

        if (game.round === 3) {
            players[playerIndex].exen = true;
        }

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            { $set: updateFields }
        );

        return res.status(200).json({ message: "Card played!" });
    }
    catch (error) {
        logError(`Error laying card for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error laying card" });
    }
});

/**
 * @swagger
 * /next-player-phase:
 *   post:
 *     summary: Advances the game to the next player.
 *     description: Moves the game to the next player's turn and updates relevant game statistics.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique ID of the game.
 *     responses:
 *       200:
 *         description: Successfully advanced to the next player's turn.
 *       400:
 *         description: Missing gameId in the request body.
 *       403:
 *         description: Only the current active player can advance the turn.
 *       404:
 *         description: Game or player not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/next-player-phase", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current player can click next player" });
        }

        const players = game.players;
        const playerIndex = players.findIndex(p => p.id === userId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: "Player not in game" });
        }

        // Determine the next player and update round progression
        let nextPlayerIndex = (playerIndex + 1) % players.length;
        if (game.round === 2) {
            nextPlayerIndex = 0;
        }

        let nextRound = game.round;
        if (nextPlayerIndex === 0 && nextRound < 4) {
            nextRound += 1;
        }

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const stats = user.statistics || { drinksSelf: 0, maxDrinksSelf: 0, numberEx: 0 };

        if (game.round === 1) {
            stats.drinksSelf += game.drinkCount;
            stats.maxDrinksSelf = Math.max(game.drinkCount, stats.maxDrinksSelf);
        }

        if (game.round === 3) {
            const player = game.players.find(p => p.id === userId);
            if (!player) {
                return res.status(404).json({ error: "Player not in game" });
            }
            if (player.exen) {
                stats.numberEx++;
            }
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { statistics: stats } }
        );

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    activePlayer: players[nextPlayerIndex].id,
                    round: nextRound,
                    drinkCount: 0
                }
            }
        );

        return res.status(200).json({ message: "Next player's turn!" });
    }
    catch (error) {
        logError(`Error updating next player for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error updating next player" });
    }
});

/**
 * @swagger
 * /start-phase3:
 *   post:
 *     summary: Starts Phase 3 of the game.
 *     description: Transitions the game to Phase 3, initializes the diamond layout, and notifies active players via WebSocket.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The unique ID of the game.
 *     responses:
 *       200:
 *         description: Successfully started Phase 3.
 *       400:
 *         description: Missing gameId in the request body.
 *       403:
 *         description: Only the Game Master can start Phase 3.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/start-phase3", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {gameId} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the next phase" });
        }

        let deck = createDeck();
        const diamond = deck.splice(0, 27).map(card => ({ ...card, flipped: false }));

        // Flip the first and last card of the diamond
        diamond[0].flipped = true;
        diamond[26].flipped = true;
        const lastCard = diamond[26];

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    cards: diamond,
                    drinkCount: 0,
                    lastRound: 0,
                    round: 9,
                    phase: "phase3",
                    lastCard,
                    endGame: false
                }
            }
        );
        
        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "phase3"}));
            }
        });

        return res.status(200).json({ message: "Phase 3 started!" });
    } 
    catch (error) {
        logError(`Error starting Phase 3 for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error starting Phase 3" });
    }
});

/**
 * @swagger
 * /retry-phase:
 *   post:
 *     summary: Restarts Phase 3 of the game.
 *     description: Resets the game state for Phase 3 by reinitializing the diamond layout and game variables.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The ID of the game to restart Phase 3 for.
 *     responses:
 *       200:
 *         description: Successfully restarted Phase 3.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message that Phase 3 was retried.
 *       400:
 *         description: Missing gameId in the request body.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/retry-phase", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    
    const {gameId} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        let deck = createDeck();
        const diamond = deck.splice(0, 27).map(card => ({ ...card, flipped: false }));

        // Flip the first and last card in the diamond
        diamond[0].flipped = true;
        diamond[26].flipped = true;

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    cards: diamond,
                    drinkCount: 0,
                    lastRound: 0,
                    round: 9,
                    lastCard: diamond[26],
                    endGame: false
                }
            }
        );

        return res.status(200).json({ message: "Phase 3 retry!" });
    } 
    catch (error) {
        logError(`Error retrying Phase 3 for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error retrying Phase 3" });
    }
});

/**
 * @swagger
 * /open-new-game:
 *   post:
 *     summary: Creates a new game with the same players.
 *     description: Duplicates the player list from an existing game and initializes a new game session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The ID of the game to duplicate.
 *     responses:
 *       200:
 *         description: Successfully created a new game.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newId:
 *                   type: string
 *                   description: The ID of the newly created game.
 *       400:
 *         description: Missing gameId in the request body.
 *       404:
 *         description: Game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/open-new-game", authenticateToken, async (req,res) => {
    const userId = req.user.userId;

    const {gameId} = req.body;

    try {
        const oldGame = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!oldGame) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (oldGame.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can restart the game" });
        }

        const players = oldGame.players.map(player => ({
            id: player.id,
            name: player.name,
            cards: [],
            drinks: 0,
            exen: false
        }));

        const newGame = await db.collection("games").insertOne({
            name: oldGame.name,
            players: players,
            status: "waiting",
            private: oldGame.private,
            activePlayer: oldGame.activePlayer,
            cards: [],
            drinkCount: 0,
            round: 1,
            lastRound: 0,
            phase: "phase1"
        });

        const newId = newGame.insertedId.toString()

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type: "newGame", newId}));
            }
        });

        return res.status(200).json({ message: "Game restarted!" });
    }
    catch (error) {
        logError(`Error opening new game from game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error opening new game" });
    }
});

/**
 * @swagger
 * /check-card:
 *   post:
 *     summary: Validates a selected card against the last played card.
 *     description: Determines if the chosen card matches the required condition (higher, lower, same, etc.).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The ID of the game.
 *               cardIdx:
 *                 type: integer
 *                 description: The index of the selected card in the deck.
 *               btnType:
 *                 type: string
 *                 description: The validation type ("higher", "lower", "same", etc.).
 *     responses:
 *       200:
 *         description: Card selection processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Indicates whether the selection was correct.
 *       400:
 *         description: Missing required parameters.
 *       404:
 *         description: Game or card index not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/check-card", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {gameId, cardIdx, btnType} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameCards = game.cards;
        if (cardIdx < 0 || cardIdx >= gameCards.length) {
            return res.status(404).json({ error: "Invalid card index" });
        }

        const card = gameCards[cardIdx];
        let lastCard = game.lastCard;
        let validCard = false;

        // Validate card based on button type
        switch (btnType) {
            case "equal":
                validCard = card.type === lastCard.type || card.number === lastCard.number;
                break;
            case "unequal":
                validCard = card.type !== lastCard.type && card.number !== lastCard.number;
                break;
            case "same":
                validCard = card.number === lastCard.number;
                break;
            case "lower":
                validCard = card.number < lastCard.number;
                break;
            case "higher":
                validCard = card.number > lastCard.number;
                break;
            default:
                return res.status(400).json({ error: "Invalid btnType provided" });
        }

        gameCards[cardIdx].flipped = true;
        const updatedDrinkCount = game.drinkCount + 1;

        if (validCard) {
            lastCard = card;
            const nextRound = game.round - 1;

            await db.collection("games").updateOne(
                { _id: new ObjectId(gameId) },
                {
                    $set: {
                        cards: gameCards,
                        round: nextRound,
                        drinkCount: updatedDrinkCount,
                        lastCard,
                    },
                }
            );

            return res.status(200).json({ message: "Correct Card" });
        } else {
            const nextRound = -1;
            const lastRound = 1;

            await db.collection("games").updateOne(
                { _id: new ObjectId(gameId) },
                {
                    $set: {
                        cards: gameCards,
                        round: nextRound,
                        drinkCount: updatedDrinkCount,
                        lastRound,
                    },
                }
            );

            return res.status(200).json({ message: "Incorrect Card - Reset Round" });
        }
    }
    catch (error) {
        logError(`Error checking card in Phase 3 for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error Checking Card in Phase 3" });
    }
});

/**
 * @swagger
 * /check-last-card:
 *   post:
 *     summary: Validates the last played card against the first and last reference cards.
 *     description: Determines if the selected card is valid based on predefined rules for the game.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The ID of the game.
 *               cardIdx:
 *                 type: integer
 *                 description: The index of the selected card in the deck.
 *               btnType:
 *                 type: string
 *                 description: The validation type ("higher", "lower", "same", "equal", "unequal").
 *               lastType:
 *                 type: string
 *                 description: The last selected button type ("higher", "lower", "same").
 *     responses:
 *       200:
 *         description: Card selection processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Indicates whether the selection was correct.
 *       400:
 *         description: Missing required parameters.
 *       404:
 *         description: Game or card index not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/check-last-card", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const {gameId, cardIdx, btnType, lastType} = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameCards = game.cards;
        if (cardIdx < 0 || cardIdx >= gameCards.length) {
            return res.status(404).json({ error: "Invalid card index" });
        }

        const card = gameCards[cardIdx];
        let lastCard = game.lastCard;
        let firstCard = gameCards[0];

        let validCard = false;

        // Validate card based on button type
        switch (btnType) {
            case "equal":
                validCard = card.type === firstCard.type;
                break;
            case "unequal":
                validCard = card.type !== firstCard.type && card.number !== firstCard.number;
                break;
        }

        // Validate card based on lastType selection
        switch (lastType) {
            case "same":
                validCard = card.number === lastCard.number;
                break;
            case "lower":
                validCard = card.number < lastCard.number;
                break;
            case "higher":
                validCard = card.number > lastCard.number;
                break;
        }

        gameCards[cardIdx].flipped = true;
        const updatedDrinkCount = game.drinkCount + 1;


        if (validCard) {
            lastCard = card;
            const nextRound = game.round - 1;

            await db.collection("games").updateOne(
                { _id: new ObjectId(gameId) },
                {
                    $set: {
                        cards: gameCards,
                        round: nextRound,
                        drinkCount: updatedDrinkCount,
                        lastCard,
                        endGame: true,
                    },
                }
            );

            return res.status(200).json({ message: "Correct Card" });
        } else {
            const nextRound = -1;
            const lastRound = 1;

            await db.collection("games").updateOne(
                { _id: new ObjectId(gameId) },
                {
                    $set: {
                        cards: gameCards,
                        round: nextRound,
                        drinkCount: updatedDrinkCount,
                        lastRound,
                    },
                }
            );

            return res.status(200).json({ message: "Incorrect Card - Reset Round" });
        }
    }
    catch (error) {
        logError(`Error checking last card in Phase 3 for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error Checking Card in Phase 3" });
    }
});

// #endregion 

app.listen(port, () => {
    console.log(`Server running on ${process.env.BASE_URL}`);
});
