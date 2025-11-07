/**
 * @fileoverview Watches the 'friends' collection for changes and notifies connected clients of updates.
 */

import { ObjectId } from 'mongodb';

// Database
import { db } from '../database/mongoClient.js';

// Websocket
import { friendsConnections } from '../websockets/connectionMaps.js';

// Services
import { checkFriendUpdate } from '../services/friendService.js';

// Utilities
import { logError, logTrace } from '../utils/logger.js';

let initialized = false;
let friendStream = null;

/**
 * Watches the 'friends' collection for changes and notifies connected clients of updates.
 * <br><br>
 * This function sets up a change stream on the 'friends' collection in the database.
 * 
 * @function watchFriendStream
 * @return {void}
 */
export default function watchFriendStream() {
    if (initialized) return;
    initialized = true;

    if (friendStream) return;

    try {
        const collection = db.collection('friends');
        friendStream = collection.watch();

        friendStream.on('change', async (change) => {
            if (!change.documentKey || !change.documentKey._id) return;

            const friendId = change?.documentKey?._id;
            if (!friendId.toString()) {
                logError("Friend ID not found in change event");
                return;
            }

            const friend = await collection.findOne(
                { _id: new ObjectId(friendId) }
            );

            if (!friend) {
                logError(`Friend document not found for user ID ${friendId.toString()}`);
                return;
            }

            const clients = friendsConnections.get(friend.userId.toString()) || [];

            if (clients.length === 0) {
                logTrace(`No clients found for user ${friend.userId.toString()}`);
                return;
            }

            if (change.operationType !== 'update') return;

            const updateFields = change.updateDescription?.updatedFields || {};
            const updateKeys = Object.keys(updateFields);

            checkFriendUpdate(updateKeys, friend, clients);
        });
    } catch (error) {
        logError(`Error watching friend stream: ${error.message}`);
    }
}