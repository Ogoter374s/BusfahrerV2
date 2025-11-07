/**
 * @fileoverview Initializes and starts the WebSocket server with TLS support,
 * heartbeat mechanism, and connection handling.
 */

import fs from 'fs';
import https from "https";
import http2 from "http2";
import crypto from "crypto";
import { WebSocketServer } from "ws";

// WebSocket
import setupHeartbeat from "./heartbeat.js";
import handleConnection from "./connectionHandler.js";

// Watchers
import initializeWatchers from "../watchers/index.js";

// Utilities
import { logInfo, logTrace } from "../utils/logger.js";

const wbsPort = process.env.WBS_PORT;
const ticketFile = process.env.TLS_TICKET_KEYS_FILE;

/**
 * Loads or generates TLS ticket keys for session resumption.
 * <br><br>
 * If the ticket keys file exists, it reads and returns the keys. <br>
 * If not, it generates new keys, saves them to the file, and returns them.
 * <br><br>
 * 
 * @function loadTicketKeys
 * @returns {Buffer} The TLS ticket keys.
 */
function loadTicketKeys() {
    if (fs.existsSync(ticketFile)) {
        return fs.readFileSync(ticketFile);
    }

    const keys = crypto.randomBytes(48);
    fs.writeFileSync(ticketFile, keys);
    logTrace(`Generated new TLS ticket keys and saved to ${ticketFile}`);
    return keys;
}

/**
 * Starts the WebSocket server with TLS support. <br>
 * This function sets up the WebSocket server, heartbeat mechanism, and connection handling. <br>
 * It also initializes file watchers for real-time updates.
 * <br><br>
 * 
 * @function startWebSocketServer
 * @param {Object} app - The Express application instance.
 * @returns {Object} The HTTP/2 secure server instance.
 */
export default function startWebSocketServer(app) {
    const ticketKeys = loadTicketKeys();

    const sslOptions = {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
        allowHTTP1: true,

        honorCipherOrder: true,
        sessionTimeout: 300,
        ticketKeys,
    };

    const server = https.createServer(sslOptions);
    const wss = new WebSocketServer({ server });

    // Setup heartbeat and connection handling
    setupHeartbeat(wss);
    wss.on("connection", (ws, req) => handleConnection(ws, req));

    const apiServer = http2.createSecureServer(sslOptions, app);

    server.listen(wbsPort, () => {
        logInfo(`WebSocket server running on ${process.env.WBS_URL}`);
        logTrace(`WebSocket server running on ${process.env.WBS_URL}`);
    });

    // Initialize watchers for real-time updates
    initializeWatchers();

    return apiServer;
}