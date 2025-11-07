/**
 * @fileoverview WebSocket heartbeat setup to maintain active connections.
 */

// Variable to hold the heartbeat interval
let heartbeatInterval = null;

/**
 * Sets up a heartbeat mechanism for WebSocket connections.
 * <br><br>
 * This function initializes a periodic ping to all connected clients to ensure they are still alive. <br>
 * If a client does not respond to the ping, it is considered dead and the connection is terminated.
 * <br><br>
 * 
 * @function setupHeartbeat
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 * @returns {void}
 */
export default function setupHeartbeat(wss, timeout = 30000) {
    if (heartbeatInterval) return;

    heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) return ws.terminate();
            
            ws.isAlive = false;
            ws.ping();
        });
    }, timeout);
}