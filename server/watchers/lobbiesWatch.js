/**
 * @fileoverview Watches the lobbies collection for changes and notifies connected clients.
 */

// Database
import { db } from "../database/mongoClient.js"

// Websocket
import { lobbiesConnections } from "../websockets/connectionMaps.js";

// Services
import { checkLobbiesUpdate } from "../services/lobbyService.js";

// Utilities
import { logError, logTrace } from "../utils/logger.js";

let initialized = false;
let lobbiesStream = null;

/**
 * Watches the lobbies collection for changes and notifies connected clients.
 * <br><br>
 * This function sets up a change stream on the lobbies collection and listens for changes. <br>
 * When a change is detected, it checks if there are any connected clients for the affected lobby
 * and notifies them of the update.
 * <br><br>
 * 
 * @function watchLobbiesStream
 * @returns {void} 
 */
export default function watchLobbiesStream() {
    if (initialized) return;
    initialized = true;

    if (lobbiesStream) return;

    try {
        const collection = db.collection('lobbies');
        lobbiesStream = collection.watch();

        lobbiesStream.on('change', async (change) => {
            if (!change.documentKey || !change.documentKey._id) return;

            const lobbyId = change?.documentKey?._id;
            if (!lobbyId.toString()) {
                logError("Lobby ID not found in change event");
                return;
            }

            if (lobbiesConnections.size === 0) {
                logTrace(`No lobby connections to notify for lobby ${lobbyId.toString()}`);
                return;
            }

            checkLobbiesUpdate(lobbyId, lobbiesConnections, change.operationType);
        });
    } catch (error) {
        logError(`Error watching lobby stream: ${error.message}`);
    }
}