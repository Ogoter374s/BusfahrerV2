/**
 * @fileoverview Handles WebSocket connections, including authentication and message routing.
 */

import jwt from 'jsonwebtoken';

// Middleware
import { extractTokenFromCookies } from '../middleware/authenticator.js';

// Websocket
import handleSubscriptions from './subscriptions.js';
import { scheduleClientCleanup } from './cleanupConnections.js';

// Utilities
import { logError, logTrace } from '../utils/logger.js';

/**
 * Handles a new WebSocket connection. <br>
 * This function authenticates the user via JWT token from cookies,
 * sets up message handling, and manages connection lifecycle events.
 * <br><br>
 * 
 * @function handleConnection
 * @param {WebSocket} ws - The WebSocket connection object.
 * @param {http.IncomingMessage} req - The HTTP request object.
 * @returns {void}
 */
export default function handleConnection(ws, req) {
    const token = extractTokenFromCookies(req);
    if (!token) {
        logError('No token provided in connection request');
        return ws.close(1008, 'Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        ws.user = decoded;
        ws.isAlive = true; // Initialize isAlive for heartbeat checks
        ws.on('pong', () => (ws.isAlive = true));

        logTrace(`User ${ws.user.userId} connected via WebSocket ${req.url}`);
    } catch (error) {
        console.error(`Error verifying token: ${error.message}`);
        return ws.close(1008, 'Unauthorized: Invalid or expired token');
    }

    // Set up message handling
    ws.on('message', (msg) => handleSubscriptions(ws, msg));

    // Handle errors and connection close
    ws.on('error', (error) => {
        logInfo('⚠️ WebSocket error:', error);
    });

    // Schedule cleanup on close
    ws.on('close', () => {
        scheduleClientCleanup(ws);
    });
};