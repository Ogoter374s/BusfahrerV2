/**
 * @fileoverview Custom hook to manage Busfahrer state and actions.
 * <br><br>
 * This hook provides state variables and functions to fetch and manage the Busfahrer (driver) status in a game.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';

/**
 * A custom React hook to manage Busfahrer state and actions.
 * <br><br>
 * This hook provides state variables and functions to fetch and manage the Busfahrer (driver) status in a game.
 * <br><br>
 * <strong>fetchBusfahrer:</strong> <br>
 * This asynchronous function fetches the current Busfahrer status and name from the server for the given game ID. <br>
 * It updates the state variable `busfahrerName` based on the server response.
 * <br><br>
 * 
 * @function useBusfahrer
 * @param {string} gameId - The unique identifier for the game.
 * @returns {Object} An object containing state variables and functions related to the Busfahrer.
 */
const useBusfahrer = (gameId) => {
    const [busfahrerName, setBusfahrerName] = useState('');

    /**
     * Fetches the current Busfahrer status and name from the server for the given game ID.
     * It updates the state variable `busfahrerName` based on the server response.
     */
    const fetchBusfahrer = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-busfahrer/${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setBusfahrerName(data.busfahrerName);
        } catch (error) {
            console.error('Error fetching busfahrer:', error);
        }
    };

    return {
        busfahrerName,
        setBusfahrerName,

        fetchBusfahrer,
    }
};

export default useBusfahrer;