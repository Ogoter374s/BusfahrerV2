/**
 * @fileoverview Custom hook to manage WebSocket connections.
 * <br><br>
 * This hook establishes and manages a WebSocket connection to the server. <br>
 * It handles connection, message receiving, error handling, and reconnection logic.
 */

// Utilities
import { WBS_URL } from '../utils/config';

// React
import { useEffect, useRef } from 'react';

/** 
 * Custom hook that manages a WebSocket connection to the server.
 * <br><br>
 * This hook establishes a WebSocket connection, handles incoming messages,
 * manages reconnection logic, and cleans up the connection on unmount.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * Sets up the WebSocket connection when the component mounts or when the `type` or `payload` changes. <br>
 * It also handles cleanup by closing the connection when the component unmounts.
 * <br><br>
 * 
*/
function useWebSocketConnector(type, payload = {}, active, onMessage) {
    const wsRef = useRef(null);
    const init = useRef(false);

    const reconnectTimeout = useRef(null);
    const isUnmounted = useRef(false);

    /**
     * Sets up the WebSocket connection and manages its lifecycle.
     * It handles connection establishment, message receiving, error handling, and reconnection logic.
     * Cleans up the connection when the component unmounts.
     */
    useEffect(() => {
        if (active) return;
        if (init.current) return;
        init.current = true;

        isUnmounted.current = false;

        const connect = () => {
            if (isUnmounted.current) return;

            wsRef.current = new WebSocket(WBS_URL);

            wsRef.current.onopen = () => {
                wsRef.current.send(JSON.stringify({ type, ...payload }));
            };

            wsRef.current.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                onMessage?.(message);
            };

            wsRef.current.onclose = () => {
                if (!isUnmounted.current) {
                    reconnectTimeout.current = setTimeout(connect, 1000);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error(`WebSocket (${type}) error. Closing...`);
                wsRef.current.close();
            };
        };

        connect();

        window.addEventListener('beforeunload', () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        });

        return () => {
            isUnmounted.current = true;
            clearTimeout(reconnectTimeout.current);

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, [type, JSON.stringify(payload)]);
};

export default useWebSocketConnector;