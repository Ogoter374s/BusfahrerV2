/**
 * @fileoverview Initializes all database watchers for real-time updates. 
 * <br><br>
 * This module imports and invokes individual watcher functions for different collections.
 */

// Watchers
import watchUserStream from "./userWatch.js";
import watchLobbiesStream from "./lobbiesWatch.js";
import watchLobbyStream from "./lobbyWatch.js";
import watchFriendStream from "./friendWatch.js";
import watchChatStream from "./chatWatch.js";
import watchGameStream from "./gameWatch.js";

// Utilities
import { logInfo } from "../utils/logger.js";

/**
 * Initializes all database watchers to monitor changes in various collections.
 * <br><br>
 * This function calls individual watcher functions for users, lobbies, friends, chats, and games.
 * 
 * @function initializeWatchers
 * @returns {void}
 */
export default function initializeWatchers() {
    logInfo("Initializing database watchers...");
    
    watchUserStream();
    watchFriendStream();

    watchLobbiesStream();
    
    watchLobbyStream();
    watchChatStream();
    watchGameStream();
}