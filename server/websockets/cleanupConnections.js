/**
 * @fileoverview Manages the cleanup of WebSocket connections when clients disconnect. <br>
 * This includes scheduling cleanup tasks, cancelling them if the client reconnects,
 * and removing the client's WebSocket from various connection maps.
 */

// Services
import { leaveLobby } from "../services/lobbyService.js";
import { leaveGame } from "../services/gameService.js";

// Websocket
import {
    pendingRemovals,

    friendsConnections,
    userConnections,

    lobbiesConnections,

    lobbyConnections,
    chatConnections,
    gameConnections
} from "./connectionMaps.js";

// Utilities
import { logError, logTrace } from "../utils/logger.js";

/**
 * Schedules a cleanup task for a disconnected client WebSocket. <br>
 * If the client does not reconnect within 5 seconds, their connections will be cleaned up,
 * and they will be removed from any lobby or game they were part of.
 * <br><br>
 * 
 * @function scheduleClientCleanup
 * @param {WebSocket} ws - The WebSocket connection of the disconnected client.
 * @return {void}
 */
export function scheduleClientCleanup(ws, timeout = 15000) {
    const userId = ws.user?.userId;
    const lobbyId = ws.lobbyId;
    const key = `${userId}:${ws.type}`;

    logTrace(`Scheduling cleanup for user ${key} in ${timeout} milliseconds`);

    // Schedule the cleanup task
    const timeoutId = setTimeout(async () => {
        logTrace(`Executing cleanup for user ${key} after timeout`);

        // Perform the cleanup
        cleanupConnections(ws);

        // If the user was in a lobby or game, remove them
        if (lobbyId) {
            if (ws.type === 'lobby') {
                logTrace(`User ${key} was in lobby ${lobbyId}, proceeding to remove from lobby`);

                try {
                    await leaveLobby(userId, lobbyId);
                    logTrace(`User ${key} removed from lobby ${lobbyId} during cleanup`);
                } catch (error) {
                    logError(`Error during cleanup for user ${key}: ${error.message}`);
                }
            }

            if (ws.type === 'game') {
                logTrace(`User ${key} was in game ${lobbyId}, proceeding to remove from game`);

                try {
                    await leaveGame(lobbyId, userId);
                    logTrace(`User ${key} removed from game ${lobbyId} during cleanup`);
                } catch (error) {
                    logError(`Error during cleanup for user ${key}: ${error.message}`);
                }
            }
        }

        // Remove from pending removals
        pendingRemovals.delete(key);
    }, timeout);

    pendingRemovals.set(key, timeoutId);
}

/**
 * Cancels a scheduled cleanup task for a reconnected client WebSocket. <br>
 * If the client reconnects before the cleanup timeout, their scheduled cleanup will be cancelled.
 * <br><br>
 * 
 * @function cancelClientCleanup
 * @param {WebSocket} ws - The WebSocket connection of the reconnected client.
 * @return {void}
 */
export function cancelClientCleanup(ws) {
    const userId = ws.user.userId;
    const key = `${userId}:${ws.type}`;

    if (pendingRemovals.has(key)) {
        clearTimeout(pendingRemovals.get(key));
        pendingRemovals.delete(key);
        logTrace(`Cancelled pending removal for user ${key} (reconnected)`);
    }
}

/**
 * Cleans up all references to a disconnected client WebSocket from various connection maps. <br>
 * This includes removing the WebSocket from user connections, friends connections,
 * lobby connections, chat connections, and game connections.
 * <br><br>
 * 
 * @function cleanupConnections
 * @param {WebSocket} ws - The WebSocket connection of the disconnected client.
 * @return {void}
 */
export function cleanupConnections(ws) {

    // 1. UserConnections (Map<userId, [sockets]>)
    for (const [userId, sockets] of userConnections.entries()) {
        const filtered = sockets.filter((client) => client !== ws);
        if (filtered.length > 0) {
            userConnections.set(userId, filtered);
        } else {
            userConnections.delete(userId);
        }
    }

    // 2. FriendsConnections (Map<userId, [sockets]>)
    for (const [userId, sockets] of friendsConnections.entries()) {
        const filtered = sockets.filter((client) => client !== ws);
        if (filtered.length > 0) {
            friendsConnections.set(userId, filtered);
        } else {
            friendsConnections.delete(userId);
        }
    }

    // 3. LobbiesConnections (Set<sockets>)
    if (lobbiesConnections.has(ws)) {
        lobbiesConnections.delete(ws);
    }

    // 4. LobbyConnections (Map<lobbyId, Map<userId, socket>>)
    for (const [lobbyId, userMap] of lobbyConnections.entries()) {
        for (const [userId, socket] of userMap.entries()) {
            if (socket === ws) {
                userMap.delete(userId);
            }
        }
        if (userMap.size === 0) {
            lobbyConnections.delete(lobbyId);
        }
    }

    // 5. ChatConnections (Map<lobbyId, [sockets]>)
    for (const [lobbyId, sockets] of chatConnections.entries()) {
        const filtered = sockets.filter((client) => client !== ws);
        if (filtered.length > 0) {
            chatConnections.set(lobbyId, filtered);
        } else {
            chatConnections.delete(lobbyId);
        }
    }

    // 6. GameConnections (Map<lobbyId, Map<userId, socket>>)
    for (const [lobbyId, userMap] of gameConnections.entries()) {
        for (const [userId, socket] of userMap.entries()) {
            if (socket === ws) {
                userMap.delete(userId);
            }
        }
        if (userMap.size === 0) {
            gameConnections.delete(lobbyId);
        }
    }
};