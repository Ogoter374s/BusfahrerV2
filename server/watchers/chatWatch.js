/**
 * @fileoverview Watches the MongoDB change stream for chat updates and notifies connected clients via WebSockets.
 */

// Database
import { db } from "../database/mongoClient.js";

// Websocket
import { chatConnections } from "../websockets/connectionMaps.js";

// Services
import { checkChatUpdate } from "../services/chatService.js";

// Utilities
import { logError, logTrace } from "../utils/logger.js";

let initialized = false;
let chatStream = null;

/**
 * Watches the MongoDB change stream for chat updates and notifies connected clients via WebSockets. <br>
 * This function initializes a change stream on the 'chats' collection and listens for update events. <br>
 * When a chat document is updated, it retrieves the updated chat and notifies all connected clients associated with that chat.
 * <br><br>
 * 
 * @function watchChatStream
 * @returns {void}
 */
export default function watchChatStream() {
    if (initialized) return;
    initialized = true;

    if (chatStream) return;

    try {
        const collection = db.collection('chats');
        chatStream = collection.watch();

        chatStream.on('change', async (change) => {
            if (!change.documentKey || !change.documentKey._id) return;

            const chatId = change?.documentKey?._id;
            if (!chatId.toString()) {
                logError("Chat ID not found in change event");
                return;
            }

            const clients = chatConnections.get(chatId.toString()) || [];
            if (clients.size === 0) {
                logTrace(`No clients found for chat ${chatId.toString()}`);
                return;
            }

            const chat = await collection.findOne(
                { _id: chatId }
            );

            if (!chat) {
                logError(`Chat not found for ID ${chatId.toString()}`);
                return;
            }

            if (change.operationType !== 'update') return;

            const updateFields = change.updateDescription?.updatedFields || {};
            const updateKeys = Object.keys(updateFields);

            // Notify clients about the chat update
            checkChatUpdate(updateKeys, chat, clients);
        });
    } catch (error) {
        logError(`Error watching chat stream: ${error.message}`);
    }
}