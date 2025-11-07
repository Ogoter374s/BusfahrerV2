/**
 * @fileoverview Watches the MongoDB 'users' collection for changes and notifies connected clients via WebSockets.
 */

// Database
import { db } from "../database/mongoClient.js"

// Websocket
import { userConnections } from "../websockets/connectionMaps.js";

// Services
import { checkAccountUpdate } from "../services/accountService.js";

// Utilities
import { logError, logTrace } from "../utils/logger.js";

let initialized = false;
let userStream = null;

/**
 * Watches the 'users' collection for changes and notifies connected clients.
 * <br><br>
 * This function sets up a change stream on the 'users' collection and listens for changes. <br>
 * When a change is detected, it checks if there are any connected clients for the affected user
 * and notifies them of the update.
 * <br><br>
 * 
 * @function watchUserStream
 * @returns {void} 
 */
export default function watchUserStream() {
    if(initialized) return;
    initialized = true;

    if(userStream) return;

    try {
        const collection = db.collection('users');
        userStream = collection.watch();

        userStream.on('change', async (change) => {
            if (!change.documentKey || !change.documentKey._id) return;

            const userId = change?.documentKey?._id;
            if(!userId.toString()) {
                logError("User ID not found in change event");
                return;
            }

            const clients = userConnections.get(userId.toString()) || [];
            if(clients.length === 0) {
                logTrace(`No clients found for user ${userId.toString()}`);
                return;
            }
            
            const user = await collection.findOne(
                { _id: userId }
            );

            if(!user) {
                logError(`User not found for ID ${userId.toString()}`);
                return;
            }

            if (change.operationType !== 'update') return;

            const updateFields = change.updateDescription?.updatedFields || {};
            const updateKeys = Object.keys(updateFields);

            checkAccountUpdate(updateKeys, user, clients);
        });
    } catch (error) {
        logError(`Error watching account stream: ${error.message}`);
    }
}