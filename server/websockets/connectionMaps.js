/**
 * @fileoverview Manages WebSocket connection mappings for different user interactions.
 * <br><br>
 * This module exports various Maps and Sets to track connections related to friends,
 * users, lobbies, chats, and games.
 */

// Map to track pending removals of WebSocket connections
export const pendingRemovals = new Map();

// Map to track friends' WebSocket connections
export const friendsConnections = new Map();

// Map to track users' WebSocket connections
export const userConnections = new Map();

// Map to track lobbies' WebSocket connections
export const lobbiesConnections = new Set();

// Map to track lobby-specific WebSocket connections
export const lobbyConnections = new Map();

// Map to track chat-specific WebSocket connections
export const chatConnections = new Map();

// Map to track game-specific WebSocket connections
export const gameConnections = new Map();