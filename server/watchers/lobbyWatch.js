/**
 * @fileoverview Watches the 'lobbies' collection for changes and notifies connected clients of updates.
 */

// Database
import { db } from "../database/mongoClient.js";

// Websocket
import { lobbyConnections } from "../websockets/connectionMaps.js";

// Services
import { checkLobbyUpdate } from "../services/lobbyService.js";

// Utilities
import { logError, logTrace } from "../utils/logger.js";

let initialized = false;
let lobbyStream = null;

/**
 * Watches the 'lobbies' collection for changes and notifies connected clients of updates.
 * <br><br>
 * This function sets up a change stream on the 'lobbies' collection and listens for changes. <br>
 * When a change is detected, it retrieves the affected lobby and notifies connected clients
 * about the specific updates.
 * <br><br>
 * 
 * @function watchLobbyStream
 * @returns {void}
 */
export default function watchLobbyStream() {
    if (initialized) return;
    initialized = true;

    if (lobbyStream) return;

    try {
        const collection = db.collection('lobbies');
        lobbyStream = collection.watch();

        lobbyStream.on('change', async (change) => {
            if (!change.documentKey || !change.documentKey._id) return;

            const lobbyId = change?.documentKey?._id;
            if (!lobbyId.toString()) {
                logError("Lobby ID not found in change event");
                return;
            }

            const clients = lobbyConnections.get(lobbyId.toString()) || [];
            if (clients.length === 0) {
                logTrace(`No clients found for lobby ${lobbyId.toString()}`);
                return;
            }

            const lobby = await collection.findOne(
                { _id: lobbyId }
            );

            if (!lobby) {
                logError(`Lobby not found for ID ${lobbyId.toString()}`);
                return;
            }

            if (change.operationType !== 'update') return;

            const updateFields = change.updateDescription?.updatedFields || {};
            const updateKeys = Object.keys(updateFields);

            checkLobbyUpdate(updateKeys, lobby, clients);
        });
    } catch (error) {
        logError(`Error watching lobby stream: ${error.message}`);
    }
}