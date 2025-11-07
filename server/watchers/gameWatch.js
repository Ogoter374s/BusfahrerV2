/**
 * @fileoverview Watches the MongoDB change stream for the 'games' collection
 * and notifies connected clients of any updates to game documents.
 */

// Database
import { db } from "../database/mongoClient.js";

// Websocket
import { gameConnections } from "../websockets/connectionMaps.js";

// Services
import { checkGameUpdate } from "../services/gameService.js";

// Utilities
import { logError, logTrace } from "../utils/logger.js";

let initialized = false;
let gameStream = null;

/**
 * Watches the 'games' collection for changes and notifies connected clients.
 * <br><br>
 * This function sets up a change stream on the 'games' collection in the database. <br>
 * When a change is detected, it retrieves the updated game document and notifies connected clients.
 * <br><br>
 * 
 * @function watchGameStream
 * @returns {void}
 */
export default function watchGameStream() {
    if (initialized) return;
    initialized = true;

    if (gameStream) return;

    try {
        const collection = db.collection('games');
        gameStream = collection.watch();

        gameStream.on('change', async (change) => {
            if (!change.documentKey || !change.documentKey._id) return;

            const gameId = change?.documentKey?._id;
            if (!gameId.toString()) {
                logError("Game ID not found in change event");
                return;
            }

            const clients = gameConnections.get(gameId.toString()) || [];
            if (clients.length === 0) {
                logTrace(`No clients found for game ${gameId.toString()}`);
                return;
            }

            const game = await collection.findOne(
                { _id: gameId }
            );

            if (!game) {
                logError(`Game not found for ID ${gameId.toString()}`);
                return;
            }

            if (change.operationType !== 'update') return;

            const updateFields = change.updateDescription?.updatedFields || {};
            const updateKeys = Object.keys(updateFields);

            checkGameUpdate(updateKeys, game, clients);
        });
    } catch (error) {
        logError(`Error watching game stream: ${error.message}`);
    }
}