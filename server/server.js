import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import cookieParser from "cookie-parser";
import fs, { access } from "fs";
import path from "path";
import redis from "redis";
import http2 from "http2";
import https from "https";
import http2Express from "http2-express-bridge";
import multer from "multer";
import qs from 'querystring';

import { MongoClient, ObjectId } from "mongodb";
import { WebSocket, WebSocketServer } from "ws";
import { swaggerUi, swaggerSpec } from "./swagger.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wbsPort = process.env.WBS_PORT
const mongoUri = process.env.MONGO_URI;

// #region Multer Configuration

const uploadDir = path.join(__dirname, "public", "avatars");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${req.user.userId}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

//#endregion

// #region Express App Configuration

const app = http2Express(express);
const port = process.env.BASE_PORT;

const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
    allowHTTP1: true
};

app.use(cors({
    origin: process.env.FRONT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/avatars", express.static(uploadDir));

app.use(express.static('public', {
    maxAge: '1y'
}));

// #endregion

// #region Server Handling Functions

/**
 * Deletes the oldest log backups if they exceed the max count.
 *
 * @param {string} fileName - The base log file name (e.g., "app.log").
 * @param {number} maxFiles - The maximum number of backup files to keep.
 */
const cleanOldLogs = (fileName, maxFiles) => {
    const logDir = ".";
    fs.readdir(logDir, (err, files) => {
        if (err) {
            console.error("Failed to read log directory:", err);
            return;
        }

        const logBackups = files
            .filter(file => file.startsWith(fileName) && file.endsWith(".bak"))
            .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);

        while (logBackups.length > maxFiles) {
            const oldestFile = logBackups.shift();
            fs.unlink(oldestFile, (unlinkErr) => {
                if (unlinkErr) console.error(`Failed to delete ${oldestFile}:`, unlinkErr);
                else console.log(`Deleted old backup: ${oldestFile}`);
            });
        }
    });
};

/**
 * Rotates log files if they exceed a max size, keeping only the latest 10 backups.
 *
 * @param {string} fileName - The log file to check.
 * @param {number} maxSize - Max size in bytes before rotating (default 5MB).
 * @param {number} maxFiles - Maximum number of backup files to keep (default 10).
 */
const rotateLogs = (fileName, maxSize = 5 * 1024 * 1024, maxFiles = 10) => {
    const logFilePath = fileName;

    fs.stat(logFilePath, (err, stats) => {
        if (!err && stats.size >= maxSize) {
            const backupFile = `${fileName}.${Date.now()}.bak`;

            fs.rename(logFilePath, backupFile, (renameErr) => {
                if (renameErr) {
                    console.error(`Failed to rotate ${fileName}:`, renameErr);
                } else {
                    console.log(`Rotated ${fileName} → ${backupFile}`);
                    cleanOldLogs(fileName, maxFiles);
                }
            });
        }
    });
};

/**
 * Logs messages to a specified log file with a timestamp.
 *
 * @param {string} level - The log level (e.g., "ERROR", "TRACE", "INFO").
 * @param {string} message - The message to log.
 * @param {string} [fileName="app.log"] - The file to log into.
 */
const logMessage = (level, message, fileName = "app.log") => {
    rotateLogs(fileName);

    const logFilePath = path.join(__dirname, fileName);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) console.error(`Failed to write to ${fileName}:`, err);
    });
};

const logError = (message) => logMessage("ERROR", message, "error.log");
const logTrace = (message) => logMessage("TRACE", message, "trace.log");
const logInfo = (message) => logMessage("INFO", message, "info.log");

// #endregion

// #region MongoDB

const client = new MongoClient(mongoUri, {
    maxPoolSize: 10,
});

/**
 * Establishes a connection to the MongoDB database.
 *
 * Attempts to connect using the MongoDB client. Logs success or failure messages.
 * If the connection fails, the error message is logged.
 *
 * @async
 * @function connectToMongoDB
 * @throws {Error} Logs an error if the connection fails.
 */
async function connectToMongoDB() {
    try {
        await client.connect();
        logInfo("Connected to MongoDB");
    } catch (error) {
        logError(`MongoDB connection error: ${error.stack || error.message}`);
    }
}

connectToMongoDB();

const db = client.db(process.env.DATABASE);

// #endregion

// Need to implement
// #region Redis

const redisClient = redis.createClient();
//redisClient.connect().catch(logError("Failed to connect to Redis"));

/**
 * Retrieves game data from Redis cache or MongoDB.
 *
 * @function getGame
 * @param {string} gameId - The unique game ID.
 * @returns {Promise<Object|null>} The game object or null if not found.
 * @throws {Error} If there's an issue with Redis or MongoDB.
 */
async function getGame(gameId) {
    try {
        const cachedGame = await redisClient.get(gameId);
        if (cachedGame) {
            return JSON.parse(cachedGame);
        }

        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });
        if (!game) return null;

        await redisClient.setEx(gameId, 60, JSON.stringify(game));
        return game;
    } catch (error) {
        logError(`Error fetching game: ${error.stack || error.message}`);
        throw error;
    }
}

// #endregion

// #region Secondary Functions

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
 * Generates a unique friend code for a new user.
 *
 * The friend code always starts with a '#' followed by 6 random alphabetic characters (a-z, A-Z),
 * ensuring no numbers or special characters. It checks the 'users' collection to confirm uniqueness.
 *
 * @function generateUniqueFriendCode
 * @param {Db} db - The MongoDB database instance.
 * @returns {Promise<string>} A unique friend code string.
 * @throws {Error} If the database query fails unexpectedly.
 */
async function generateUniqueFriendCode() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /**
     * Generates a random friend code starting with '#'
     * and followed by 6 random letters (no numbers or symbols).
     *
     * @returns {string} The generated friend code.
     */
    function generateFriendCode() {
        let code = "#";
        for (let i = 0; i < 6; i++) {
            const randomChar = letters.charAt(Math.floor(Math.random() * letters.length));
            code += randomChar;
        }
        return code;
    }

    let code;
    let exists = true;

    while (exists) {
        code = generateFriendCode();
        exists = await db.collection("users").findOne({ friendCode: code });
    }

    return code;
}

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
const createDeck = (type) => {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = Array.from({ length: 13 }, (_, i) => i + 2);
    let deck = [];

    for (let i = 0; i < 2; i++) {
        suits.forEach((suit) => {
            values.forEach((value) => {
                deck.push({ number: value, type: suit });
            });
        });
    }

    return shuffleDeck(deck, type);
};

/**
 * Shuffles an array of card objects using the Fisher-Yates shuffle algorithm.
 * This ensures a uniform random distribution of the deck order.
 *
 * @function shuffleDeck
 * @param {Array} deck - The array of card objects to shuffle.
 * @returns {Array} The shuffled deck.
 */
const shuffleDeck = (deck, type) => {
    switch (type) {
        case 'Fisher-Yates':
            FisherYatesShuffle(deck);
            break;
        case 'Chaotic':
            ChaoticShuffle(deck);
            break;
        default:
            FisherYatesShuffle(deck);
            break;
    }
    return deck;
};

const ChaoticShuffle = (deck) => {
    const original = [...deck];
    deck.length = 0;

    while (original.length > 0) {
        let index;

        // Favor pulling the last added card again (streaks)
        if (deck.length > 0 && Math.random() < 0.3) {
            const last = deck[deck.length - 1];
            const similarIndexes = original
                .map((card, idx) => (card.number === last.number || card.type === last.type ? idx : -1))
                .filter(idx => idx !== -1);

            if (similarIndexes.length > 0) {
                index = similarIndexes[Math.floor(Math.random() * similarIndexes.length)];
            } else {
                index = Math.floor(Math.random() * original.length);
            }
        } else {
            index = Math.floor(Math.random() * original.length);
        }

        const [card] = original.splice(index, 1);
        deck.push(card);
    }

    return deck;
};

const FisherYatesShuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const doesCardMatch = (card, targetCard, matchStyle) => {
    switch (matchStyle) {
        case "Number-only":
            return card.number === targetCard.number;
        case "Type-only":
            return card.type === targetCard.type;
        case "Exact":
        default:
            return card.number === targetCard.number && card.type === targetCard.type;
    }
};

const getNextPlayerId = (turnMode, turnOrder, players, currentPlayerId) => {
    const currPlayerIdx = turnOrder.indexOf(currentPlayerId);
    if(currPlayerIdx === -1) throw new Error("Current player not found in turn order");

    let nextIndex;

    switch (turnMode) {
        case 'Reverse':
            nextIndex = (currPlayerIdx - 1 + turnOrder.length) % turnOrder.length;
            players[currPlayerIdx].hadTurn = true;
            break;
        case 'Random':
            players[currPlayerIdx].hadTurn = true;
    
            const remaining = players.filter(p => !p.hadTurn);

            if(remaining.length === 0) {
                nextIndex = 0;
            } else {
                let randPlayerId;
                do {
                    const randomIdx = Math.floor(Math.random() * remaining.length);
                    randPlayerId = remaining[randomIdx].id;
                } while(randPlayerId === turnOrder[currPlayerIdx]);

                nextIndex = turnOrder.indexOf(randPlayerId);
            }
            break;
        case 'Default':
        default:
            nextIndex = (currPlayerIdx + 1) % turnOrder.length;
            players[currPlayerIdx].hadTurn = true;
            break;
    }

    return turnOrder[nextIndex];
};

const selectBusfahrer = (busMode, players) => {
    const cardCounts = players.map(player => {
        const unplayed = player.cards.filter(c => !c.played).length;
        return {id: player.id, count: unplayed};
    });

    const max = Math.max(...cardCounts.map(p => p.count));
    const min = Math.min(...cardCounts.map(p => p.count));

    switch(busMode) {
        case "Reverse":
            return cardCounts.filter(p => p.count === min).map(p => p.id);
        case "Random":
            const randomIdx = Math.floor(Math.random() * players.length);
            return [players[randomIdx].id];
        case "Default":
        default:
            return cardCounts.filter(p => p.count === max).map(p => p.id);
    }
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

/**
 * Checks and unlocks achievements for a given user based on their statistics.
 *
 * Retrieves all achievements and the user's current stats, titles, and unlocked achievements.
 * Compares user statistics with achievement conditions to determine newly unlocked achievements.
 * Updates the user's document with any newly earned achievements and associated titles.
 *
 * @function checkAchievements
 * @param {string} userId - The MongoDB ObjectId string of the user to check achievements for.
 * @returns {Promise<string[]>} A list of newly unlocked achievement IDs.
 * @throws {Error} If database operations fail or the user is not found.
 */
const checkAchievements = async (user) => {
    const unlocked = [];
    const allAchievements = await db.collection("achievements").find({}).toArray();

    for (const achievement of allAchievements) {
        const alreadyUnlocked = user.achievements.map(a => a.toString()).includes(achievement._id.toString());
        if (alreadyUnlocked) continue;

        let conditionMet = true;

        for (const [key, value] of Object.entries(achievement.conditions)) {
            if (!user.statistics[key] || user.statistics[key] < value) {
                conditionMet = false;
                break;
            }
        }

        if (conditionMet) {
            const result = await db.collection("users").updateOne(
                {
                    _id: new ObjectId(user._id),
                    "achievements": { $ne: achievement._id },
                    "titles.name": { $ne: achievement.titleUnlocked.name }
                },
                {
                    $addToSet: {
                        achievements: achievement._id,
                        titles: {
                            name: achievement.titleUnlocked.name,
                            color: achievement.titleUnlocked.color,
                            active: false
                        }
                    }
                }
            );

            if (result.modifiedCount > 0) {
                unlocked.push(achievement._id);
            }
        }
    }

    return unlocked;
};

/**
 * Extracts the token from the cookies in the request headers.
 *
 * @param {Object} req - The incoming connection request.
 * @returns {string|null} The token if found, otherwise null.
 */
const extractTokenFromCookies = (req) => {
    const cookies = req.headers.cookie;
    if (!cookies) return null;

    const parsedCookies = cookies.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.split('=').map(c => c.trim());
        acc[name] = value;
        return acc;
    }, {});

    return parsedCookies.token || null;
};

// #endregion

// #region WebSockets

const server = https.createServer(sslOptions);
const wss = new WebSocketServer({ server });

const activeGameConnections = new Map();
const accountConnections = new Map();
const friendsConnections = new Map();
const gameChatConnections = new Map();

const waitingGameConnections = new Set();

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
    logTrace("WebSocket connection established");

    const token = extractTokenFromCookies(req);
    if (!token) {
        ws.close(1008, "Unauthorized: No token provided");
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ws.user = decoded;
    } catch (error) {
        logError(`Invalid token attempt: ${error.stack || error.message}`);
        ws.close(1008, "Unauthorized: Invalid token");
        return;
    }

    ws.on("message", (message) => {
        try {
            const { type, gameId } = JSON.parse(message);

            // Subscribe to game updates
            if (type === "subscribe" && gameId) {
                if (!activeGameConnections.has(gameId)) {
                    activeGameConnections.set(gameId, []);
                }
                activeGameConnections.get(gameId).push(ws);
                logTrace(`Subscribed to game updates for gameId ${gameId}`);
            }

            // Subscribe to lobby updates
            if (type === "lobby") {
                if (!waitingGameConnections.has(ws)) {
                    waitingGameConnections.add(ws);
                }

                watchLobbyUpdates();
            }

            // Subscribe to account updates
            if (type === "account") {
                if (!accountConnections.has(ws.user.userId)) {
                    accountConnections.set(ws.user.userId, []);
                }
                accountConnections.get(ws.user.userId).push(ws);
            }

            if (type === "friends") {
                if (!friendsConnections.has(ws.user.userId)) {
                    friendsConnections.set(ws.user.userId, []);
                }
                friendsConnections.get(ws.user.userId).push(ws);
            }

            if (type === "gameChat" && gameId) {
                if (!gameChatConnections.has(gameId)) {
                    gameChatConnections.set(gameId, []);
                }
                gameChatConnections.get(gameId).push(ws);
            }
        }
        catch (error) {
            logError(`Failed to process WebSocket message: ${error.stack || error.message}`);
        }
    });

    ws.on("error", (error) => {
        console.error("⚠️ WebSocket error:", error);
    });

    // Handle WebSocket disconnection
    ws.on("close", () => {
        for (const [gameId, sockets] of activeGameConnections.entries()) {
            activeGameConnections.set(gameId, sockets.filter((client) => client !== ws));
        }

        for (const [userId, sockets] of accountConnections.entries()) {
            accountConnections.set(userId, sockets.filter((client) => client !== ws));
        }

        waitingGameConnections.delete(ws);
    });
});

let globalAccountStream = null;
/**
 * Watches for changes in the user's account document in the database.
 *
 * Uses a MongoDB change stream to listen for updates in the `users` collection.
 * When a change occurs, it fetches the updated user statistics and sends them
 * to all connected WebSocket clients.
 *
 * @async
 * @function watchAccountUpdates
 * @param {string} userId - The ID of the user whose account updates are being watched.
 * @returns {void}
 */
const watchGlobalAccounts = async () => {
    if (globalAccountStream) return;

    try {
        const collection = db.collection("users");
        globalAccountStream = collection.watch();

        globalAccountStream.on("change", async (change) => {
            if (!change.documentKey || !change.documentKey._id) return;

            const userId = change.documentKey._id.toString();
            const clients = accountConnections.get(userId) || [];

            if (clients.length === 0) return;

            const user = await collection.findOne(
                { _id: new ObjectId(userId) },
                {
                    projection: {
                        statistics: 1,
                        avatar: 1,
                        uploadedAvatar: 1,
                        clickSound: 1,
                        cardTheme: 1,
                        titles: 1,
                        friends: 1,
                        pendingRequests: 1,
                        sentRequests: 1,
                        friendCode: 1,
                        achievements: 1,
                    },
                }
            );

            if (!user) return;

            const format = user.titles || [];
            const active = format.find(title => title.active) || null;

            if (!user) {
                logError(`User with ID ${userId} not found while getting updated account.`);
                return;
            }

            const data = {
                statistics: user.statistics,
                avatar: user.avatar,
                uploadedAvatar: user.uploadedAvatar,
                titles: format,
                selectedTitle: active,
                clickSound: user.clickSound,
                cardTheme: user.cardTheme,
            }

            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "accountUpdate",
                        data
                    }));
                }
            });

            const isUpdate = change.operationType === "update";

            if (!isUpdate) return;

            const updatedFields = change.updateDescription.updatedFields || {};
            const updatedKeys = Object.keys(updatedFields);

            const isStatisticUpdate = updatedKeys.some(key =>
                key.startsWith("statistics")
            );

            if (isStatisticUpdate) {
                const newTitles = await checkAchievements(user);

                if (newTitles.length > 0) {
                    const updatedTitles = user.titles.filter(title => newTitles.includes(title._id));
                    clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "titlesUpdate",
                                data: updatedTitles
                            }));
                        }
                    });
                }
            }

            const isAchievementUpdate = updatedKeys.some(key =>
                key === "achievements"
            );

            if (isAchievementUpdate) {
                const updatedAchievements = user.achievements;

                //Get All Achievements, check if unlocked and format them so the client can display them

                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "achievementsUpdate",
                            data: updatedAchievements
                        }));
                    }
                });
            }

            const isFriendUpdate = updatedKeys.some(key =>
                key.startsWith("friends") ||
                key.startsWith("pendingRequests") ||
                key.startsWith("sentRequests") ||
                key.startsWith("avatar")
            );

            if (!isFriendUpdate) return;

            const friendsData = {
                friends: user.friends.map(friend => ({
                    ...friend,
                    messages: (friend.messages || []).slice(-13)
                })),
                pendingRequests: user.pendingRequests || [],
                sentRequests: user.sentRequests || [],
                friendCode: user.friendCode || "",
            };

            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "friendsUpdate",
                        data: friendsData,
                    }));
                }
            });
        });
    } catch (error) {
        logError(`Error watching account updates: ${error.stack || error.message}`);
    }
};
watchGlobalAccounts();

let lobbyChangeStream = null;
/**
 * Watches for changes in the `games` collection and sends updated waiting game data.
 *
 * Uses a MongoDB change stream to listen for updates in the `games` collection.
 * When a change occurs, it fetches the latest waiting games and sends them
 * to all connected WebSocket clients subscribed to lobby updates.
 *
 * @async
 * @function watchLobbyUpdates
 * @returns {void}
 */
const watchLobbyUpdates = async () => {
    if (lobbyChangeStream) return;

    try {
        const collection = db.collection("games");

        lobbyChangeStream = collection.watch();

        lobbyChangeStream.on("change", async (change) => {
            const games = await collection.find(
                { status: "waiting" },
                {
                    projection: {
                        _id: 1,
                        name: 1,
                        players: 1,
                        settings: 1,
                    },
                }
            ).toArray();

            if (!games) return;

            const format = await Promise.all(
                games
                    .filter(game => game.settings && game.players?.length < game.settings.playerLimit)
                    .map(async (game) => {
                        const avatars = await Promise.all(
                            game.players.slice(0, 3).map(async (playerId) => {
                                return playerId?.avatar || "default.svg";
                            })
                        );

                        return {
                            id: game._id.toString(),
                            name: game.name,
                            playerCount: game.players.length,
                            settings: game.settings,
                            avatars,
                        };
                    })
            );

            waitingGameConnections.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "lobbysUpdate",
                        data: format
                    }));
                }
            });
        });
    }
    catch (error) {
        logError(`Error watching games updates: ${error.stack || error.message}`);
    }
};

let globalGameStream = null;
/**
 * Watches the "games" collection in MongoDB for updates to a specific game.
 * When a change is detected for the specified gameId, it notifies all connected WebSocket clients subscribed to that game.
 *
 * @async
 * @function watchGameUpdates
 * @param {string} gameId - The unique identifier of the game to watch for updates.
 * @throws {Error} Logs an error if the change stream fails to start or encounters an issue.
 */
const watchGlobalGames = async () => {
    if (globalGameStream) return;

    try {
        const collection = db.collection("games");
        globalGameStream = collection.watch();

        globalGameStream.on("change", async (change) => {

            const gameId = change.documentKey._id.toString();
            if (!gameId) return;

            const clients = activeGameConnections.get(gameId) || [];
            const chats = gameChatConnections.get(gameId) || [];
            if (clients.length === 0) return;

            const isUpdate = change.operationType === "update";
            const updatedFields = isUpdate ? change.updateDescription.updatedFields || {} : {};
            const updatedKeys = Object.keys(updatedFields) || {};

            const game = await collection.findOne(
                { _id: new ObjectId(gameId) },
                {
                    projection: {
                        _id: 1,
                        players: 1,
                        round: 1,
                        lastRound: 1,
                        activePlayer: 1,
                        phase: 1,
                        busfahrer: 1,
                        endGame: 1,
                        exen: 1,
                        drinkCount: 1,
                        phaseCards: 1,
                        cards: 1,
                        messages: 1,
                    },
                }
            );
            if (!game) return;

            //Game Update
            if (!isUpdate || Object.keys(updatedFields).some(field =>
                ["round", "lastRound", "activePlayer", "phase", "busfahrer", "endGame", "players"].includes(field)) ||
                Object.keys(updatedFields).some(field =>
                    ["round", "lastRound", "activePlayer", "phase", "busfahrer", "endGame", "players"].some(key =>
                        field.startsWith(key)
                    )
                )
            ) {
                const playerInfo = game.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    avatar: p.avatar,
                    title: p.title,
                    drinks: p.drinks,
                }));

                const busfahrerIds = game.busfahrer || [];
                const busfahrerName = busfahrerIds
                    .map(id => game.players.find(p => p.id === id)?.name)
                    .filter(Boolean)
                    .join(" & ");

                const data = {
                    players: playerInfo,
                    round: game.round,
                    flipped: game.round === game.lastRound || game.round === 6,
                    busfahrerIds,
                    busfahrerName,
                    endGame: !!game.endGame,
                    currentPlayer: game.activePlayer,
                };

                logTrace(`Game update for gameId ${gameId}: ${JSON.stringify(data)}`);
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "gameUpdate", data }));
                    }
                });
            }

            //Player Update
            if (isUpdate && Object.keys(updatedFields).some(field => 
                ["players", "drinks"].some(key => field.startsWith(key)))) {
                const player = game.players.find(p => p.id === game.activePlayer);
                if (player && player.exen !== undefined) {
                    const data = { exen: player.exen };
                    clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: "playersUpdate", data }));
                        }
                    });
                }
            }

            //Drink Count Update
            if (isUpdate && updatedFields.hasOwnProperty("drinkCount")) {
                const data = { drinks: game.drinkCount };
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "drinkUpdate", data }));
                    }
                });
            }

            //Cards / Phase Cards Update
            if (isUpdate && Object.keys(updatedFields).some(field =>
                field.startsWith("cards") || field.startsWith("phaseCards"))) {

                const phaseRows = [];
                for (let row = 0; row < 3; row++) {
                    phaseRows.push(game.phaseCards?.[row]?.cards || []);
                }

                const gCards = game.cards || [];
                const diamondRows = [];
                let idx = 0;
                const maxRows = 5;

                diamondRows.push(gCards.slice(idx, idx + 2));
                idx += 2;

                for (let row = 2; row <= maxRows; row++) {
                    diamondRows.push(gCards.slice(idx, idx + row));
                    idx += row;
                }

                for (let row = maxRows - 1; row >= 2; row--) {
                    diamondRows.push(gCards.slice(idx, idx + row));
                    idx += row;
                }

                diamondRows.push(gCards.slice(idx, idx + 2));

                const data = {
                    phaseCards: phaseRows,
                    diamondCards: diamondRows
                }

                clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "cardsUpdate", data }));
                    }
                });
            }

            if (!isUpdate) return;

            //Game Chat Update
            const isGameMessage = updatedKeys.some(key =>
                key.startsWith("message")
            );

            if (!isGameMessage) return;

            chats.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "gameChat", data: null }));
                }
            });

        });

    } catch (error) {
        logError(`Error watching game updates: ${error.stack || error.message}`);
    }
};
watchGlobalGames();

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

    if (!token) {
        return res.json({ isAuthenticated: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ isAuthenticated: true });
    }
    catch (error) {
        logError(`Invalid token attempt: ${error.stack || error.message}`);
        res.json({ isAuthenticated: false });
    }
});

/**
 * @swagger
 * /get-friend-requests:
 *   get:
 *     summary: Get the user's friend requests.
 *     description: Returns a list of pending (received) and sent friend requests for the authenticated user.
 *     responses:
 *       200:
 *         description: List of friend requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "65f3acba8b67b28925e254b3"
 *                       username:
 *                         type: string
 *                         example: "PendingFriend1"
 *                 sentRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "65f3acba8b67b28925e254b2"
 *                       username:
 *                         type: string
 *                         example: "SentFriend1"
 *       401:
 *         description: Unauthorized. User must be logged in.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-friend-requests", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { pendingRequests: 1, sentRequests: 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json({
            pending: user.pendingRequests || [],
            sent: user.sentRequests || [],
        });
    } catch (error) {
        logError(`Error fetching friend requests: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

/**
 * @swagger
 * /get-friends:
 *   get:
 *     summary: Retrieve the user's friends list.
 *     description: Returns a list of friends for the authenticated user.
 *     responses:
 *       200:
 *         description: Successfully retrieved the friends list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "65f3acba8b67b28925e254b3"
 *                       username:
 *                         type: string
 *                         example: "Friend1"
 *       401:
 *         description: Unauthorized. User must be logged in.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
app.get("/get-friends", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { friends: 1, } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const friendsRaw = user.friends || [];

        const friendIds = friendsRaw.map(f => new ObjectId(f.userId));

        // Fetch current avatars and usernames from the DB
        const friendProfiles = await db.collection("users")
            .find({ _id: { $in: friendIds } })
            .project({ avatar: 1, username: 1 })
            .toArray();

        const friendMap = new Map();
        friendProfiles.forEach(profile => {
            friendMap.set(profile._id.toString(), {
                avatar: profile.avatar || "default.svg",
                username: profile.username || "Unknown",
            });
        });

        const syncedFriends = friendsRaw.map(friend => {
            const profile = friendMap.get(friend.userId.toString()) || {};
            return {
                ...friend,
                avatar: profile.avatar,
                username: profile.username,
                messages: (friend.messages || []).slice(-13),
                unreadCount: profile.unreadCount || 0,
            };
        });

        return res.status(200).json({
            friends: syncedFriends,
        });
    } catch (error) {
        logError(`Error fetching friends: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

/**
 * @swagger
 * /get-friend-code:
 *   get:
 *     summary: Retrieves the friend code of the authenticated user.
 *     description: Fetches the friend code for the logged-in user based on their authentication token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the friend code.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friendCode:
 *                   type: string
 *                   example: "ABCD1234"
 *       401:
 *         description: Unauthorized. Token is missing or invalid.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
app.get("/get-friend-code", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { friendCode: 1, } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json({
            friendCode: user.friendCode || "",
        });
    } catch (error) {
        logError(`Error fetching friend code: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

app.get("/game-messages", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { messages: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found." });
        }

        const lastMessages = (game.messages || [])
        .slice(-18)
        .map((msg) => ({
            ...msg,
            name: msg.senderId.toString() === userId.toString() ? "You" : msg.name,
        }));

        return res.status(200).json({ messages: lastMessages || [] });
    } catch (error) {
        logError(`Error fetching game messages: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

/**
 * @swagger
 * /get-account:
 *   get:
 *     summary: Retrieve user account details
 *     description: Fetches the user's account information, including statistics and avatar, based on the authenticated user ID.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user account details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                   description: User's game statistics.
 *                 avatar:
 *                   type: string
 *                   description: URL or identifier of the user's avatar.
 *       401:
 *         description: Unauthorized. User authentication token is missing or invalid.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error occurred while fetching user data.
 */
app.get("/get-account", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const userObj = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { statistics: 1, avatar: 1, uploadedAvatar: 1, titles: 1, } }
        );

        if (!userObj) {
            return res.status(404).json({ error: "User not found" });
        }

        const format = userObj.titles || [];
        const active = format.find(title => title.active) || null;

        const account = {
            statistics: userObj.statistics,
            avatar: userObj.avatar,
            uploadedAvatar: userObj.uploadedAvatar,
            titles: format,
            selectedTitle: active,
        }

        res.json(account);
    }
    catch (error) {
        logError(`Error fetching user statistics for userId ${userId}: ${error.stack || error.message}`);
        res.status(500).json({ error: "Failed to fetch user statistics" });
    }
});

/**
 * @swagger
 * /get-click-sound:
 *   get:
 *     summary: Retrieves the user's selected click sound preference.
 *     description: Fetches the preferred click sound from the database.
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *     responses:
 *       200:
 *         description: Returns the user's click sound preference.
 *       404:
 *         description: User not found.
 */
app.get("/get-click-sound", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { clickSound: 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ sound: user.clickSound || "ui-click.mp3" });
    } catch (error) {
        logError(`Error fetching click sound: ${error.message}`);
        res.status(500).json({ error: "Database error" });
    }
});

/**
 * @swagger
 * /get-card-theme:
 *   get:
 *     summary: Get the user's selected card theme.
 *     description: Retrieves the saved card back theme for the authenticated user.
 *     responses:
 *       200:
 *         description: Successfully retrieved card theme.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cardBack:
 *                   type: string
 *                   example: "default.svg"
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Server error.
 */
app.get("/get-card-theme", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { cardTheme: 1, color1: 1, color2: 1, } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const data = {
            theme: user.cardTheme || "default",
            color1: user.color1,
            color2: user.color2,
        }

        res.json(data);
    } catch (error) {
        logError(`Error fetching card theme: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/get-achievements", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { achievements: 1, statistics: 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const achievementList = await db.collection("achievements").find({}).toArray();
        const achievements = [];

        for (const achievement of achievementList) {
            const unlocked = user.achievements.some(id => id.equals(achievement._id));

            achievements.push({
                id: achievement._id,
                icon: achievement.icon,
                name: achievement.name,
                title: achievement.titleUnlocked,
                unlocked,
                description: achievement.description,
                conditions: Object.entries(achievement.conditions).map(([key, required]) => ({
                    key,
                    required,
                    current: unlocked ? required : (user.statistics?.[key] || 0)
                })),
            });
        }

        return res.status(200).json({ achievements });
    } catch (error) {
        logError(`Error fetching achievements: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

app.get("/get-game-name", authenticateToken, async (req, res) => {
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { name: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        return res.status(200).json({ name: game.name });
    }
    catch(error) {
        logError(`Error fetching game name: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch game name" });
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
            .project({ _id: 1, name: 1, players: 1, settings: 1 })
            .toArray();

        const format = await Promise.all(
            games
                .filter(game => game.settings && game.players?.length < game.settings.playerLimit)
                .map(async (game) => {
                    const avatars = await Promise.all(
                        game.players.slice(0, 3).map(async (playerId) => {
                            return playerId?.avatar || "default.svg";
                        })
                    );

                    return {
                        id: game._id.toString(),
                        name: game.name,
                        playerCount: game.players.length,
                        settings: game.settings,
                        avatars,
                    };
                })
        );

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
    const { gameId } = req.params;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, activePlayer: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const players = game.players.map(player => ({
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            title: player.title,
            drinks: player.drinks,
        }));

        const data = {
            players,
            currentPlayer: game.activePlayer,
        }

        res.status(200).json(data);
    }
    catch (error) {
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

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const isGameMaster = game.players.length > 0 && game.players[0].id === userId;

        return res.status(200).json(isGameMaster);
    }
    catch (error) {
        logError(`Error verifying game master (${gameId}): ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/drinks-given", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, drinkCount: 1, settings: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        let given = false;

        if(game.settings.giving === "Default") {
            given = true;
            return res.status(200).json(given);
        }

        const totalGiven = game.players.reduce((sum, player) => {
            return sum + (player.drinks);
        }, 0);

        given = totalGiven >= game.drinkCount;

        return res.status(200).json(given);
    }
    catch (error) {
        logError(`Error verifying game master (${gameId}): ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/get-drinks-received", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, drinkCount: 1, settings: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        let recieved = 0;

        if(game.settings.giving === "Default") {
            return res.status(200).json(recieved);
        }

        const player = game.players.find(p => p.id === userId);

        recieved = player.drinks;

        return res.status(200).json(recieved);
    }
    catch (error) {
        logError(`Error verifying game master (${gameId}): ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/use-give", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { settings: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const given = game.settings.giving === "Avatar" ? true : false;

        return res.status(200).json(given);
    }
    catch (error) {
        logError(`Checking if giving is avatar method (${gameId}): ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/is-owner", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { settings: 1, busfahrer: 1, tryOwner: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        let owner = (userId.toString() === game.tryOwner.toString());

        if(game.tryOwner === "")
            owner = true;

        if (!game.busfahrer.includes(userId)) {
            if(!game.settings.isEveryone)
                owner = false;
        }

        return res.status(200).json(owner);
    }
    catch (error) {
        logError(`Checking if user is owner (${gameId}): ${error.message}`);
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

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const player = game.players.find(p => p.id === userId);
        if (!player) {
            return res.status(404).json({ error: "Player not in game" });
        }

        return res.status(200).json(player.cards || []);
    }
    catch (error) {
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
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { cards: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        return res.status(200).json(game.cards || []);
    }
    catch (error) {
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
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { round: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        return res.status(200).json(game.round);
    }
    catch (error) {
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

    const { gameId } = req.query;

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
    catch (error) {
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

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { drinkCount: 1, phase: 1, round: 1, players: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
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
    catch (error) {
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
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { round: 1, lastRound: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const flipped = (game.round === game.lastRound) || (game.round === 6);

        return res.status(200).json(flipped);
    }
    catch (error) {
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
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { phaseCards: 1 } }
        );

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
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { busfahrer: 1, players: 1 } }
        );

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
    catch (error) {
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

    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { round: 1, players: 1 } }
        );

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
    catch (error) {
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
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { activePlayer: 1, players: 1 } }
        );

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
    catch (error) {
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
    const { gameId } = req.query;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { endGame: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const end = game.endGame || false;

        return res.status(200).json(end);
    }
    catch (error) {
        logError(`Error fetching end game status for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Failed to fetch end game" });
    }
});

// #endregion

// #region POST API Endpoints

// #region Authentication

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
            gamesJoined: 0,
            gamesPlayed: 0,
            gamesBusfahrer: 0,
            drinksGiven: 0,
            drinksSelf: 0,
            numberEx: 0,
            maxDrinksGiven: 0,
            maxDrinksSelf: 0,
            maxCardsSelf: 0,
            layedCards: 0,
            dailyLoginStreak: 0,
            gamesHosted: 0,
            topDrinker: 0,
            topDrinks: 0,
            rowsFlipped: 0,
            gamesWon: 0,
            cardsPlayedPhase1: 0,
            cardsLeft: 0,
            phase3Failed: 0,
            maxRounds: 0,
            changedTheme: 0,
            changedSound: 0,
            uploadedAvatar: 0,
            playersKicked: 0,
            gotKicked: 0,
            drinksRecieved: 0,
            maxDrinksRecieved: 0,
        };

        const friendCode = await generateUniqueFriendCode();

        const result = await usersCollection.insertOne({
            username,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: new Date(),
            avatar: "default.svg",
            uploadedAvatar: "",
            clickSound: "ui-click.mp3",
            cardTheme: "default.svg",
            color1: "#ffffff",
            color2: "#ff4538",
            statistics: stats,
            titles: [{
                name: "None",
                color: "#f5deb3",
                active: true,
            }],
            friendCode,
            friends: [],
            sentRequests: [],
            pendingRequests: [],
            blockedUsers: [],
            achievements: [],
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

    const { username, password } = req.body;

    try {
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const now = new Date();
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

        let newStreak = 1;
        if (lastLogin) {
            const diffInTime = now.getTime() - lastLogin.getTime();
            const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

            if (diffInDays === 1) {
                newStreak = (user.statistics?.dailyLoginStreak || 1) + 1;
            } else if (diffInDays === 0) {
                newStreak = user.statistics?.dailyLoginStreak || 1;
            } else {
                newStreak = 1;
            }
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    lastLogin: now,
                    "statistics.dailyLoginStreak": newStreak
                }
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "Strict",
            maxAge: 12 * 60 * 60 * 1000,
        });

        res.json({ success: true });
    }
    catch (error) {
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

        res.status(200).json({ success: true });
    } catch (error) {
        logError(`Logout error: ${error.stack || error.message}`);
        res.status(500).json({ success: false });
    }
});

// #endregion

// #region Friend System

/**
 * @swagger
 * /send-friend-request:
 *   post:
 *     summary: Send a friend request to another user.
 *     description: Allows an authenticated user to send a friend request to another user by username.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Ogoter374"
 *     responses:
 *       200:
 *         description: Friend request sent successfully.
 *       400:
 *         description: Request is invalid or user already added.
 *       404:
 *         description: Target user not found.
 *       401:
 *         description: Unauthorized. User must be logged in.
 *       500:
 *         description: Internal server error.
 */
app.post("/send-friend-request", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const { friendCode } = req.body;

        if (!friendCode) {
            return res.status(400).json({ error: "Friend Code is required." });
        }

        const sender = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const receiver = await db.collection("users").findOne({ friendCode });

        if (!receiver) {
            return res.status(404).json({ error: "User not found." });
        }

        if (receiver._id.equals(sender._id)) {
            return res.status(400).json({ error: "You can't add yourself." });
        }

        const alreadyFriends = sender.friends.some(f => f.userId.equals(receiver._id));
        const alreadySent = sender.sentRequests.some(r => r.userId.equals(receiver._id));
        const alreadyPending = sender.pendingRequests.some(r => r.userId.equals(receiver._id));

        if (alreadyFriends) {
            return res.status(400).json({ error: "You are already friends." });
        }

        if (alreadySent) {
            return res.status(400).json({ error: "Friend request already sent." });
        }

        if (alreadyPending) {
            return res.status(400).json({ error: "User already sent you a request." });
        }

        // Update sender
        await db.collection("users").updateOne(
            { _id: sender._id },
            {
                $push: {
                    sentRequests: { userId: receiver._id, username: receiver.username }
                }
            }
        );

        // Update receiver
        await db.collection("users").updateOne(
            { _id: receiver._id },
            {
                $push: {
                    pendingRequests: { userId: sender._id, username: sender.username }
                }
            }
        );

        return res.status(200).json({ message: "Friend request sent." });
    } catch (error) {
        logError(`Error sending friend request: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

/**
 * @swagger
 * /accept-friend-request:
 *   post:
 *     summary: Accept a friend request.
 *     description: Moves the requester from pendingRequests to the friends list of both users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "65f3acba8b67b28925e254b3"
 *     responses:
 *       200:
 *         description: Friend request accepted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request accepted."
 *                 friend:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "65f3acba8b67b28925e254b3"
 *                     username:
 *                       type: string
 *                       example: "AcceptedFriend"
 *       400:
 *         description: Invalid request or user is already a friend.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized. User must be logged in.
 *       500:
 *         description: Internal server error.
 */
app.post("/accept-friend-request", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { userId: friendId } = req.body;

    try {
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const friend = await db.collection("users").findOne({ _id: new ObjectId(friendId) });

        if (!friend) return res.status(404).json({ error: "User not found." });

        // Remove from pending requests
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $pull: { pendingRequests: { userId: new ObjectId(friendId) } },
                $push: { friends: { userId: friend._id, username: friend.username, avatar: friend.avatar, messages: [] } }
            }
        );

        // Remove from sent requests & add to friends
        await db.collection("users").updateOne(
            { _id: new ObjectId(friendId) },
            {
                $pull: { sentRequests: { userId: new ObjectId(userId) } },
                $push: { friends: { userId: user._id, username: user.username, avatar: user.avatar, messages: [] } }
            }
        );

        return res.status(200).json({ message: "Friend request accepted.", friend: { userId: friend._id, username: friend.username } });
    } catch (error) {
        logError(`Error accepting friend request: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

/**
 * @swagger
 * /decline-friend-request:
 *   post:
 *     summary: Decline a friend request.
 *     description: Removes the friend request from pendingRequests and sentRequests without adding the user as a friend.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "65f3acba8b67b28925e254b4"
 *     responses:
 *       200:
 *         description: Friend request declined successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend request declined."
 *       400:
 *         description: Invalid request or no pending request found.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized. User must be logged in.
 *       500:
 *         description: Internal server error.
 */
app.post("/decline-friend-request", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { userId: friendId } = req.body;

    try {
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const sender = await db.collection("users").findOne({ _id: new ObjectId(friendId) });

        if (!user) return res.status(404).json({ error: "User not found." });
        if (!sender) return res.status(404).json({ error: "User not found." });

        // Remove from pending requests
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { pendingRequests: { userId: new ObjectId(friendId) } } }
        );

        // Remove from sent requests on the sender's side
        await db.collection("users").updateOne(
            { _id: new ObjectId(friendId) },
            { $pull: { sentRequests: { userId: new ObjectId(userId) } } }
        );

        return res.status(200).json({ message: "Friend request declined." });
    } catch (error) {
        logError(`Error declining friend request: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

/**
 * @swagger
 * /remove-friend:
 *   post:
 *     summary: Removes a friend from the authenticated user's friend list.
 *     description: Deletes the specified friend from the user's friend list using authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "605c72b7e8472a3df6b0e1c5"
 *     responses:
 *       200:
 *         description: Successfully removed the friend.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Friend removed successfully."
 *       400:
 *         description: Bad request. The friendId is missing or invalid.
 *       404:
 *         description: Friend not found in the user's friend list.
 *       500:
 *         description: Server error.
 */
app.post("/remove-friend", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId } = req.body;

    try {
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { friends: { userId: new ObjectId(friendId) } } }
        );

        await db.collection("users").updateOne(
            { _id: new ObjectId(friendId) },
            { $pull: { friends: { userId: new ObjectId(userId) } } }
        );

        return res.status(200).json({ message: "Friend removed successfully." });
    } catch (error) {
        logError(`Error removing friend: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

// #endregion

// #region Messaging

/**
 * @swagger
 * /send-message:
 *   post:
 *     summary: Sends a chat message to a friend.
 *     description: Stores a new message in both the sender's and recipient's friend message arrays.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *               - message
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: The ObjectId of the friend to whom the message is sent.
 *                 example: "605c72b7e8472a3df6b0e1c5"
 *               message:
 *                 type: string
 *                 description: The content of the message to send.
 *                 example: "Hey, want to join a game?"
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Message sent successfully."
 *       400:
 *         description: Bad request. Message content is empty or malformed.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/send-message", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId, message } = req.body;

    try {
        const sender = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!sender) return res.status(404).json({ error: "User not found." });

        const senderMessage = {
            senderId: new ObjectId(userId),
            name: "You",
            message,
            timestamp: new Date(),
        };

        const recieverMessage = {
            senderId: new ObjectId(userId),
            name: sender.username,
            message,
            timestamp: new Date(),
        };

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId), "friends.userId": new ObjectId(friendId) },
            { $push: { "friends.$.messages": senderMessage } }
        );

        await db.collection("users").updateOne(
            { _id: new ObjectId(friendId), "friends.userId": new ObjectId(userId) },
            {
                $push: { "friends.$.messages": recieverMessage },
                $inc: { "friends.$.unreadCount": 1 }
            }
        );

        return res.status(200).json({ message: "Message sent successfully." });
    } catch (error) {
        logError(`Error sending message: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

/**
 * @swagger
 * /mark-messages-read:
 *   post:
 *     summary: Mark messages from a friend as read.
 *     description: 
 *       Marks all messages from a specified friend as read for the currently authenticated user.
 *       This sets the `unreadCount` flag to false in the user's friends array.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: The ObjectId of the friend whose messages should be marked as read.
 *     responses:
 *       200:
 *         description: Messages successfully marked as read.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized. The user must be authenticated.
 *       500:
 *         description: Server error while marking messages as read.
 */
app.post("/mark-messages-read", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { friendId } = req.body;

    try {
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId), "friends.userId": new ObjectId(friendId) },
            { $set: { "friends.$.unreadCount": 0 } }
        );

        return res.json({ success: true });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

app.post("/send-game-message", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { gameId, message } = req.body;

    try {
        const game = await db.collection("games").findOne({ _id: new ObjectId(gameId) });
        if (!game) return res.status(404).json({ error: "Game not found." });

        const player = game.players.find(p => p.id.toString() === userId);
        if (!player) return res.status(404).json({ error: "Player not found in this game." });

        const gameMessage = {
            senderId: new ObjectId(userId),
            name: player.name,
            message,
            timestamp: new Date(),
        };

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            { $push: { messages: gameMessage } }
        );

        return res.status(200).json({ message: "Message sent successfully." });
    } catch (error) {
        logError(`Error sending message: ${error.message}`);
        return res.status(500).json({ error: "Something went wrong." });
    }
});

// #endregion

// #region User Profile

/**
 * @swagger
 * /upload-avatar:
 *   post:
 *     summary: Uploads a user avatar and deletes the previous one.
 *     description: Allows users to upload an image to use as their avatar. Deletes the previous avatar if it exists.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: avatar
 *         type: file
 *         required: true
 *         description: The avatar image to upload.
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully.
 *       400:
 *         description: Bad request or invalid file type.
 */
app.post("/upload-avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
    const userId = req.user.userId;

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { avatar: 1, uploadedAvatar: 1, } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.uploadedAvatar && user.uploadedAvatar.trim() !== "") {
            const oldAvatarPath = path.join(uploadDir, user.uploadedAvatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        const newAvatarUrl = `${req.file.filename}`;
        user.uploadedAvatar = newAvatarUrl;
        user.avatar = newAvatarUrl;

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { avatar: newAvatarUrl, uploadedAvatar: newAvatarUrl } }
        );

        await db.collection("users").updateMany(
            { "friends.userId": new ObjectId(userId) },
            {
                $set: { "friends.$[elem].avatar": newAvatarUrl },
                $inc: { "statistics.uploadedAvatar": 1 },
            },
            {
                arrayFilters: [{ "elem.userId": new ObjectId(userId) }],
            }
        );

        res.json({ avatarUrl: newAvatarUrl });
    } catch (err) {
        logError(`Error updating avatar: ${err.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /set-avatar:
 *   post:
 *     summary: Sets a user's avatar.
 *     description: Updates the user's avatar in the database with a preset or uploaded image.
 *     parameters:
 *       - in: body
 *         name: avatar
 *         description: The selected avatar filename.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             avatar:
 *               type: string
 *               example: "avatar2.svg"
 *     responses:
 *       200:
 *         description: Avatar updated successfully.
 *       400:
 *         description: Invalid avatar.
 *       401:
 *         description: Unauthorized user.
 */
app.post("/set-avatar", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { avatar } = req.body;

    try {
        if (!avatar || typeof avatar !== "string") {
            return res.status(400).json({ error: "Invalid avatar" });
        }

        const avatarPath = avatar;

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { avatar: avatarPath } }
        );

        await db.collection("users").updateMany(
            { "friends.userId": new ObjectId(userId) },
            { $set: { "friends.$[elem].avatar": avatarPath } },
            {
                arrayFilters: [{ "elem.userId": new ObjectId(userId) }],
            }
        );

        res.json({ message: "Avatar updated successfully", avatarUrl: avatarPath });
    } catch (error) {
        logError(`Error updating avatar: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /set-click-sound:
 *   post:
 *     summary: Updates the user's selected click sound preference.
 *     description: Stores the preferred click sound in the user's profile in the database.
 *     parameters:
 *       - in: body
 *         name: userId
 *         description: The ID of the user.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             sound:
 *               type: string
 *     responses:
 *       200:
 *         description: Successfully updated the sound preference.
 *       400:
 *         description: Bad request, missing parameters.
 */
app.post("/set-click-sound", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { sound } = req.body;

    try {
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: { clickSound: sound },
                $inc: { "statistics.changedSound": 1 },
            },
        );
        res.json({ message: "Sound preference saved" });
    } catch (error) {
        logError(`Error updating click sound: ${error.message}`);
        res.status(500).json({ error: "Database error" });
    }
});

/**
 * @swagger
 * /set-card-theme:
 *   post:
 *     summary: Set the user's selected card theme.
 *     description: Updates and saves the user's chosen card back theme.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardBack:
 *                 type: string
 *                 example: "hexagon.svg"
 *     responses:
 *       200:
 *         description: Successfully updated card theme.
 *       400:
 *         description: Bad request - Missing or invalid cardBack.
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Server error.
 */
app.post("/set-card-theme", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { theme, color1, color2 } = req.body;

    try {
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: { cardTheme: theme, color1: color1, color2: color2 },
                $inc: { "statistics.changedTheme": 1 },
            },
        );

        res.status(200).json({ message: "Card theme updated successfully" });
    } catch (error) {
        logError(`Error updating card theme: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @swagger
 * /set-title:
 *   post:
 *     summary: Update the user's selected title.
 *     description: Sets the selected title as active and deactivates the previously active title.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The name of the title to activate.
 *     responses:
 *       200:
 *         description: Title updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Title not found or not unlocked.
 *       500:
 *         description: Internal server error.
 */
app.post("/set-title", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { title } = req.body;

    try {
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const titleIndex = user.titles.findIndex(t => t.name === title);

        if (titleIndex === -1) {
            return res.status(400).json({ error: "Title not found" });
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    "titles.$[].active": false
                }
            }
        );

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId), "titles.name": title },
            {
                $set: {
                    "titles.$.active": true
                }
            }
        );

        res.status(200).json({ message: "Title updated successfully" });
    } catch (error) {
        logError(`Error updating title: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
});

// #endregion

// #region Achievement System

/**
 * @swagger
 * /add-achievement:
 *   post:
 *     summary: Add a new achievement to the database.
 *     description: Creates a new achievement with title, icon, description, and unlock conditions.
 *     tags:
 *       - Achievements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               titleUnlocked:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   color:
 *                     type: string
 *               conditions:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *     responses:
 *       200:
 *         description: Achievement added successfully.
 *       400:
 *         description: Missing required fields or invalid input.
 *       500:
 *         description: Internal server error.
 */
app.post("/add-achievement", async (req, res) => {
    try {
        const { name, description, icon, titleUnlocked, conditions } = req.body;

        if (!name || !description || !icon || !titleUnlocked || !conditions) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const newAchievement = {
            name,
            description,
            icon,
            titleUnlocked: {
                name: titleUnlocked.name,
                color: titleUnlocked.color
            },
            conditions
        };

        await db.collection("achievements").insertOne(newAchievement);

        res.status(200).json({ message: "Achievement added successfully." });
    } catch (error) {
        console.error("Error adding achievement:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// #endregion

// #region Lobby System

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

    const { gameName, playerName, isPrivate, gender, settings } = req.body;

    try {
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { avatar: 1, titles: 1, } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const activeTitle = user.titles?.find(title => title.active) || null;

        const statistics = {
            topDrinker: { drinks: 0, id: "" },
            schluckePerPlayer: [
                { id: userId, drinks: 0 }
            ],
            roundsPerPlayer: [
                { id: userId, rounds: 1 }
            ],
        };

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
                avatar: user.avatar,
                title: activeTitle,
                hadTurn: false,
            }],
            status: "waiting",
            private: isPrivate,
            activePlayer: userId,
            cards: [],
            drinkCount: 0,
            round: 1,
            lastRound: 0,
            phase: "phase1",
            createdAt: new Date(),
            statistics,
            settings,
            messages: [],
            turnOrder: [],
        };

        const result = await db.collection("games").insertOne(newGame);

        res.status(200).json({ success: true, gameId: result.insertedId });
    }
    catch (error) {
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
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1 } }
        );

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

    const { playerName, gender } = req.body;
    const { gameId } = req.params;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, status: 1, settings: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.status !== "waiting") {
            return res.status(400).json({ error: "Game is not joinable" });
        }

        if (game.players.some(player => player.id === userId)) {
            return res.status(400).json({ error: "Player already in game" });
        }

        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { avatar: 1, titles: 1, } }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (game.players.length >= game.settings.playerLimit) {
            return res.status(400).json({ error: "Game is full" });
        }

        const activeTitle = user.titles?.find(title => title.active) || null;

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
                        exen: false,
                        avatar: user.avatar,
                        title: activeTitle,
                        hadTurn: false,
                    },
                    "statistics.schluckePerPlayer": {
                        id: userId,
                        drinks: 0
                    },
                    "statistics.roundsPerPlayer": {
                        id: userId,
                        rounds: 1
                    },
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: "Failed to join game" });
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(user._id) },
            { $inc: { "statistics.gamesJoined": 1 } }
        );

        res.status(200).json({ message: "Player joined game" });
    }
    catch (error) {
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

    const { gameId, id } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, statistics: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameMasterId = game.players[0].id;

        if (gameMasterId !== userId) {
            return res.status(403).json({ error: "Only the Game Master can kick players" });
        }

        if (gameMasterId === id) {
            return res.status(403).json({ error: "The Game Master cannot kick himself" });
        }

        const updatedPlayers = game.players.filter(player => player.id !== id);
        const updatedStatistics = game.statistics;
        updatedStatistics.schluckePerPlayer = game.statistics.schluckePerPlayer.filter(player => player.id !== userId);
        updatedStatistics.roundsPerPlayer = game.statistics.roundsPerPlayer.filter(player => player.id !== userId);

        await db.collection("users").updateOne(
            { _id: new ObjectId(gameMasterId) },
            { $inc: { "statistics.playersKicked": 1 } }
        );

        await db.collection("users").updateOne(
            { _id: new ObjectId(id) },
            { $inc: { "statistics.gotKicked": 1 } }
        );

        const result = await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { players: updatedPlayers, statistics: updatedStatistics } }
        );

        if (result.modifiedCount === 0) {
            return res.status(500).json({ error: "Failed to update game data" });
        }

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "kicked", id }));
            }
        });

        return res.status(200).json({ message: "Player kicked successfully" });
    }
    catch (error) {
        logError(`Error kicking player from game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error kicking player" });
    }
});

// #endregion

// #region Game System

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

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, activePlayer: 1, settings: 1, turnOrder: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players.length === 0 || game.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the game" });
        }

        const settings = game.settings;

        let deck = createDeck(settings.shuffling);
        const updatedPlayers = game.players.map((player) => {
            const playerCards = deck.splice(0, 10).map(card => ({ ...card, played: false }));
            return { ...player, cards: playerCards };
        });

        const pyramid = deck.splice(0, 15).map(card => ({ ...card, flipped: false }));

        const order = updatedPlayers.map(player => player.id);

        const result = await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { players: updatedPlayers, cards: pyramid, status: "started", turnOrder: order } }
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

        await db.collection("users").updateOne(
            { _id: new ObjectId(game.players[0].id) },
            { $inc: { "statistics.gamesHosted": 1 } }
        );

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "start" }));
            }
        });

        return res.status(200).json({ message: "Game started successfully" });
    }
    catch (error) {
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

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, statistics: 1, endGame: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players[0].id !== userId) {
            const updatedPlayers = game.players.filter(player => player.id !== userId);
            const updatedStatistics = game.statistics;
            updatedStatistics.schluckePerPlayer = game.statistics.schluckePerPlayer.filter(player => player.id !== userId);
            updatedStatistics.roundsPerPlayer = game.statistics.roundsPerPlayer.filter(player => player.id !== userId);

            const result = await db.collection("games").updateOne(
                { _id: new ObjectId(gameId) },
                { $set: { players: updatedPlayers, statistics: updatedStatistics } }
            );

            if (result.modifiedCount === 0) {
                return res.status(500).json({ error: "Failed to update game data" });
            }

            return res.status(200).json({ success: true, message: "one" });
        }

        if (game.players[0].id === userId) {
            if (game.endGame) {
                const stats = game.statistics;

                await db.collection("users").updateOne(
                    { _id: new ObjectId(stats.topDrinker.id) },
                    {
                        $inc: { "statistics.topDrinker": 1 },
                        $set: { "statistics.topDrinks": stats.topDrinker.drinks }
                    }
                );
            }

            const deleteResult = await db.collection("games").deleteOne({ _id: new ObjectId(gameId) });

            if (deleteResult.deletedCount === 0) {
                return res.status(500).json({ error: "Failed to delete game" });
            }

            const clients = activeGameConnections.get(gameId) || [];
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "close", userId }));
                }
            });

            return res.status(200).json({ success: true, message: "all" });
        }
    }
    catch (error) {
        logError(`Error leaving game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error leaving lobby" });
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

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, settings: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const { players, settings } = game;

        if (players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the next phase" });
        }

        const busMode = settings.busMode;
        const busfahrer = selectBusfahrer(busMode, players);

        for (const player of players) {
            const unplayedCards = player.cards.filter(card => !card.played).length;

            const user = await db.collection("users").findOne(
                { _id: new ObjectId(player.id) },
                { projection: { statistics: 1 } }
            );

            if (user.statistics.cardsLeft < unplayedCards) {
                await db.collection("users").updateOne(
                    { _id: new ObjectId(player.id) },
                    { $set: { "statistics.cardsLeft": unplayedCards } }
                );
            }

            await db.collection("users").updateOne(
                { _id: new ObjectId(player.id) },
                { $set: { "statistics.cardsPlayedPhase1": 10 - unplayedCards } }
            );
        };

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
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "phase2" }));
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

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, settings: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can start the next phase" });
        }

        const settings = game.settings;

        let deck = createDeck(settings.shuffling);
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
                    endGame: false,
                    tryOwner: "",
                }
            }
        );

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "phase3" }));
            }
        });

        return res.status(200).json({ message: "Phase 3 started!" });
    }
    catch (error) {
        logError(`Error starting Phase 3 for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error starting Phase 3" });
    }
});

// #endregion

// #region Phase 1 Actions

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
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, cards: 1, round: 1, lastRound: 1 } }
        );

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

        if (rowIdx !== currentRound) {
            return res.status(400).json({ error: `Only row ${currentRound} can be flipped in this round` });
        }

        let pyramid = game.cards || [];
        let idx = 0;

        // Calculate the index where the row starts in the pyramid
        for (let i = 1; i < rowIdx; i++) {
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

        for (const player of game.players) {
            await db.collection("users").updateOne(
                { _id: new ObjectId(player.id) },
                { $inc: { "statistics.rowsFlipped": 1 } }
            );
        }

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
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, cards: 1, activePlayer: 1, round: 1, drinkCount: 1, settings: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current Player can lay down cards" });
        }

        const { players, cards, round, drinkCount } = game;

        const playerIndex = players.findIndex(p => p.id === userId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: "Player not in game" });
        }

        const player = players[playerIndex];

        if (cardIdx < 0 || cardIdx >= player.cards.length) {
            return res.status(400).json({ error: "Invalid card index" });
        }

        let idx = 0;
        let rowIdx = round;

        // Calculate the starting index of the current row
        for (let i = 1; i < rowIdx; i++) {
            idx += i;
        }

        const rowCards = cards.slice(idx, idx + rowIdx);
        const card = players[playerIndex].cards[cardIdx];

        if (card.played) {
            return res.status(400).json({ error: "Card has already been played" });
        }

        const matchStyle = game.settings.matching;
        const isInRow = rowCards.some(rCard => doesCardMatch(card, rCard, matchStyle));

        if(!isInRow) {
            return res.status(400).json({ error: "Card does not match any card in the current row" });
        }

        let updatedDrinkCount = drinkCount;
    
        let drinks = 0;
        if(isInRow) {
            if(game.settings.isChaos) {
                const shouldMultiply = Math.random() < process.env.CHAOS_MODE;
                const chaosMultiplier = shouldMultiply ? rowIdx : 1;
                updatedDrinkCount += card.number * chaosMultiplier;
            } else {
                updatedDrinkCount += rowIdx;
            }
        }

        if (isInRow) {
            players[playerIndex].cards[cardIdx].played = true;
            updatedDrinkCount += drinks;
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
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, activePlayer: 1, round: 1, drinkCount: 1, settings: 1, turnOrder: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (game.activePlayer !== userId) {
            return res.status(403).json({ error: "Only the current Player can click Next Player" });
        }

        const { players, round, drinkCount, settings, turnOrder } = game;

        const nextPlayerId = getNextPlayerId(settings.turning, turnOrder, players, userId);
        
        let nextRound = round;
        let updatedPlayers = players;

        const allHadTurn = game.players.every(p => p.hadTurn === true);
        if (allHadTurn && nextRound < 6) {
            nextRound += 1;
            updatedPlayers = game.players.map(p => ({ ...p, hadTurn: false }));
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

        for (const player of players) {
            const targetUser = await db.collection("users").findOne({ _id: new ObjectId(player.id) });
            if (!targetUser) continue;

            const userStats = targetUser.statistics || {
                drinksSelf: 0,
                maxDrinksSelf: 0,
            };

            userStats.drinksSelf += player.drinks;
            userStats.maxDrinksSelf = Math.max(userStats.maxDrinksSelf || 0, player.drinks);

            await db.collection("users").updateOne(
                { _id: new ObjectId(player.id) },
                { $set: { statistics: userStats } }
            );
        }

        updatedPlayers = updatedPlayers.map(p => ({ ...p, drinks: 0 }));

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    activePlayer: nextPlayerId,
                    players: updatedPlayers,
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

app.post("/give-schluck", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId, inc, playerId } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const player = game.players.find(player => player.id === playerId);

        if (!player) {
            return res.status(404).json({ error: "Player not found" });
        }

        const currentDrinks = player.drinks;
        const updatedDrinks = inc ? currentDrinks + 1 : Math.max(0, currentDrinks - 1);

        const updateResult = await db.collection("games").updateOne(
            { _id: new ObjectId(gameId), "players.id": playerId },
            { $set: { "players.$.drinks": updatedDrinks } }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ error: "Failed to update player drinks" });
        }

        res.status(200).json({ message: `Gave ${count} Schluck to ${player.name}` });
    }
    catch (error) {
        logError(`Error giving schluck to player ${playerId} in game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Error giving schluck" });
    }
});

// #endregion

// #region Phase 2 Actions

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
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, round: 1, phaseCards: 1, drinkCount: 1, activePlayer: 1 } }
        );

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
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, activePlayer: 1, round: 1, drinkCount: 1, statistics: 1 } }
        );

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

            const updatedStatistics = game.statistics;
            const player = updatedStatistics.schluckePerPlayer.find(player => player.id.toString() === userId.toString());
            player.drinks += game.drinkCount;

            if (player.drinks > updatedStatistics.topDrinker.drinks) {
                updatedStatistics.topDrinker = { id: userId, drinks: player.drinks };
            }

            if (player.drinks === updatedStatistics.topDrinker.drinks && userId !== updatedStatistics.topDrinker.id) {
                updatedStatistics.topDrinker = { id: "", drinks: player.drinks };
            }

            await db.collection("games").updateOne(
                { _id: new ObjectId(gameId) },
                { $set: { statistics: updatedStatistics } }
            );
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



// #endregion

// #region Phase 3 Actions

/**
 * @swagger
 * /flip-phase3:
 *   post:
 *     summary: Reset flipped state of all pyramid cards except the first and last.
 *     description: Sets all `flipped` fields in the game's `cards` array to `false`, except for the first and last cards which stay `true`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: string
 *                 description: The ID of the game to update.
 *     responses:
 *       200:
 *         description: Cards flipped state updated successfully.
 *       400:
 *         description: Missing gameId or game not found.
 *       500:
 *         description: Internal server error.
 */
app.post("/flip-phase", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { cards: 1, settings: 1, tryOwner: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if(game.settings.isEveryone) {
            if(userId.toString() !== game.tryOwner.toString() && game.tryOwner !== "") {
                return res.status(403).json({ error: "Only the player who started the try can retry" });
            }
        }

        const updatedCards = game.cards.map((card, index) => ({
            ...card,
            flipped: index === 0 || index === game.cards.length - 1
        }));

        await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { cards: updatedCards } }
        );

        return res.status(200).json({ message: "All cards flipped to false" });
    } catch (error) {
        logError(`Error flipping cards for game ${gameId}: ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
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

    const { gameId } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, busfahrer: 1, statistics: 1, settings: 1, tryOwner: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const settings = game.settings;

        if(game.settings.isEveryone) {
            if(userId.toString() !== game.tryOwner.toString() && game.tryOwner !== "") {
                return res.status(403).json({ error: "Only the player who started the try can retry" });
            }
        } else {

        }

        let deck = createDeck(settings.shuffling);
        const diamond = deck.splice(0, 27).map(card => ({ ...card, flipped: false }));

        // Flip the first and last card in the diamond
        diamond[0].flipped = true;
        diamond[26].flipped = true;

        //Need to wait so that the player doesn't see the new cards before their flipped state is reset
        await new Promise(resolve => setTimeout(resolve, 120));

        const updatedStatistics = game.statistics;
        const player = updatedStatistics.roundsPerPlayer.find(player => player.id.toString() === userId.toString());
        player.rounds++;

        const result = await db.collection("games").updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    cards: diamond,
                    drinkCount: 0,
                    lastRound: 0,
                    round: 9,
                    lastCard: diamond[26],
                    endGame: false,
                    statistics: updatedStatistics,
                    tryOwner: "",
                }
            }
        );

        for (const player of game.busfahrer) {

            await db.collection("users").updateOne(
                { _id: new ObjectId(player) },
                { $inc: { "statistics.phase3Failed": 1 } }
            );
        }

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
app.post("/open-new-game", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const { gameId } = req.body;

    try {
        const oldGame = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { players: 1, name: 1, private: 1, activePlayer: 1, statistics: 1, settings: 1 } }
        );

        if (!oldGame) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (oldGame.players[0].id !== userId) {
            return res.status(403).json({ error: "Only the Game Master can restart the game" });
        }

        const players = oldGame.players.map(player => ({
            id: player.id,
            name: player.name,
            role: player.role,
            gender: player.gender,
            cards: [],
            drinks: 0,
            exen: false,
            avatar: player.avatar,
            title: player.title,
            hadTurn: false,
        }));

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const stats = oldGame.statistics;
        const player = stats.roundsPerPlayer.find(player => player.id.toString() === userId.toString());

        let maxRounds = user.statistics.maxRounds;
        if (maxRounds > player.rounds) {
            maxRounds = player.rounds;
        }


        await db.collection("users").updateOne(
            { _id: new ObjectId(stats.topDrinker.id) },
            {
                $inc: { "statistics.topDrinker": 1 },
                $set: { "statistics.topDrinks": stats.topDrinker.drinks, "statistics.maxRounds": maxRounds, }
            }
        );

        const playerIds = oldGame?.statistics?.schluckePerPlayer?.map(p => p.id) || [];

        const newStatistics = {
            topDrinker: { drinks: 0, id: "" },
            schluckePerPlayer: playerIds.map(id => ({ id, drinks: 0 })),
            roundsPerPlayer: playerIds.map(id => ({ id, rounds: 1 })),
        };

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
            phase: "phase1",
            createdAt: new Date(),
            statistics: newStatistics,
            settings: oldGame.settings,
            messages: [],
            turnOrder: [],
        });

        const newId = newGame.insertedId.toString()

        const clients = activeGameConnections.get(gameId) || [];
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "newGame", newId }));
            }
        });

        await db.collection("games").deleteOne({ _id: new ObjectId(gameId) });

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

    const { gameId, cardIdx, btnType } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { cards: 1, lastCard: 1, drinkCount: 1, round: 1, settings: 1, busfahrer: 1, tryOwner: 1 } }
        );

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const gameCards = game.cards;
        if (cardIdx < 0 || cardIdx >= gameCards.length) {
            return res.status(404).json({ error: "Invalid card index" });
        }

        if(!game.settings.isEveryone) {
            if (!game.busfahrer.includes(userId)) {
                return res.status(403).json({ error: "Only the busfahrer can check the cards" });
            }
        }

        let owner = game.tryOwner;
        if(cardIdx === 25) {
            owner = userId;
        }

        if(owner !== userId) {
            return res.status(403).json({ error: "Only the player who started the try can check the card" });
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
                        tryOwner: owner,
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
                        tryOwner: "",
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

    const { gameId, cardIdx, btnType, lastType } = req.body;

    try {
        const game = await db.collection("games").findOne(
            { _id: new ObjectId(gameId) },
            { projection: { cards: 1, lastCard: 1, drinkCount: 1, round: 1, busfahrer: 1 } }
        );

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

            for (const player of game.busfahrer) {
                await db.collection("users").updateOne(
                    { _id: new ObjectId(player) },
                    { $inc: { "statistics.gamesWon": 1 } }
                );
            }

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
                        tryOwner: "",
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

// #endregion

const apiServer = http2.createSecureServer(sslOptions, app);

apiServer.listen(port, () => {
    logInfo(`Server running on ${process.env.BASE_URL}`);
});

apiServer.on("error", (err) => {
    logError(`Server error: ${err.message}`);
});

server.listen(wbsPort, () => {
    logInfo(`WebSocket server running on ${process.env.WBS_URL}`);
});
