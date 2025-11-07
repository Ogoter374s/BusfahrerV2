/**
 * @fileoverview Handles WebSocket subscriptions for various data types such as account, friends, lobbies, lobby, chat, and game updates.
 * <br><br>
 * This module processes incoming subscription requests from clients and manages their WebSocket connections accordingly.
 */

// Websocket
import { cancelClientCleanup } from "./cleanupConnections.js";
import { 
    friendsConnections, 
    userConnections, 
    lobbiesConnections, 
    lobbyConnections,
    chatConnections,
    gameConnections
} from "./connectionMaps.js";

// Utilities
import { logError, logInfo, logTrace } from "../utils/logger.js";

/**
 * Handles WebSocket subscriptions based on the message type.
 * <br><br>
 * This function processes incoming subscription requests from clients and manages their WebSocket connections accordingly.
 * <br><br>
 * 
 * @function handleSubscriptions
 * @param {WebSocket} ws - The WebSocket connection of the client.
 * @param {string} msg - The subscription message received from the client.
 * @returns {void}
 */
export default function handleSubscriptions(ws, msg) {
    try {
        const data = JSON.parse(msg);
        const { type } = data;

        logTrace(`Handling subscription of type: ${type}`);
        switch (type) {
            case 'account':
                ws.type = 'account';
                if(!userConnections.has(ws.user.userId))
                    userConnections.set(ws.user.userId, []);
                userConnections.get(ws.user.userId).push(ws);
                break;
            case 'friend':
                ws.type = 'friend';
                logInfo(`Subscribing to friend updates for user ${ws.user.userId}`);
                if(!friendsConnections.has(ws.user.userId))
                    friendsConnections.set(ws.user.userId, []);
                friendsConnections.get(ws.user.userId).push(ws);
                break;
            case 'lobbies':
                ws.type = 'lobbies';
                logInfo(`Subscribing to lobbies updates for user ${ws.user.userId}`);
                if(!lobbiesConnections.has(ws))
                    lobbiesConnections.add(ws);
                break;
            case 'lobby':
                ws.type = 'lobby';
                logInfo(`Subscribing to lobby updates for user ${ws.user.userId} for lobby ${data.lobbyId}`);
                ws.lobbyId = data.lobbyId;
                if(!lobbyConnections.has(data.lobbyId))
                    lobbyConnections.set(data.lobbyId, new Map());
                lobbyConnections.get(data.lobbyId).set(ws.user.userId, ws);
                break;
            case 'chat':
                ws.type = 'chat';
                logInfo(`Subscribing to chat updates for user ${ws.user.userId} for chat ${data.lobbyId}`);
                if(!chatConnections.has(data.lobbyId))
                    chatConnections.set(data.lobbyId, []);
                chatConnections.get(data.lobbyId).push(ws);
                break;
            case 'game':
                ws.type = 'game';
                logInfo(`Subscribing to game updates for user ${ws.user.userId} for game ${data.lobbyId}`);
                ws.lobbyId = data.lobbyId;
                if(!gameConnections.has(data.lobbyId))
                    gameConnections.set(data.lobbyId, new Map());
                gameConnections.get(data.lobbyId).set(ws.user.userId, ws);
                break;
        }

        // Cleanup cancellation
        cancelClientCleanup(ws);
    } catch (error) {
        logError(`Error handling subscription: ${error.message}`);
        ws.send(JSON.stringify({ error: 'Failed to handle subscription' }));
    }
};