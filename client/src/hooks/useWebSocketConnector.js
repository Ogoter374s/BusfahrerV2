// Utilities
import { WBS_URL } from '../utils/config';

// React
import { useEffect, useRef } from 'react';

function useWebSocketConnector (type, payload = {}, onMessage) {
    const wsRef = useRef(null);
    const init = useRef(false);

    useEffect(() => {
        if(init.current) return;
        init.current = true;

        const connect = () => {
            wsRef.current = new WebSocket(WBS_URL);

            wsRef.current.onopen = () => {
                wsRef.current.send(JSON.stringify({ type, ...payload }));
            };

            wsRef.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                onMessage?.(message);
            };

            wsRef.current.onclose = () => {
                console.warn('WebSocket connection closed. Reconnecting...');
                setTimeout(connect, 1000);
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
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, [type, JSON.stringify(payload)]);
};

export default useWebSocketConnector;