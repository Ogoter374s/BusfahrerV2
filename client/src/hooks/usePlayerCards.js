/**
 * @fileoverview usePlayerCards Hook
 * <br><br>
 * This custom React hook manages the state and fetching of player cards for a specific game. <br>
 * It provides functionality to retrieve player cards from the server and store them in state.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';

/**
 * Custom React hook to manage player cards for a specific game. <br>
 * It provides functionality to fetch player cards from the server and store them in state.
 * <br><br>
 * <strong>fetchPlayerCards:</strong> <br>
 * This asynchronous function fetches the player cards for the specified game ID from the server. <br>
 * It updates the `playerCards` state with the retrieved data.
 * <br><br>
 * 
 * @function usePlayerCards
 * @param {string} gameId - The ID of the game for which to manage player cards.
 * @returns {object} An object containing the player cards state and a function to fetch them.
 */
const usePlayerCards = (gameId) => {
    const [playerCards, setPlayerCards] = useState([]);

    /**
     * Fetches the player cards for the specified game ID from the server. <br>
     * Updates the `playerCards` state with the retrieved data.
     */
    const fetchPlayerCards = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-player-cards/${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setPlayerCards(data.cards);
        } catch (error) {
            console.error('Error fetching player cards:', error);
        }
    };

    return {
        playerCards,
        setPlayerCards,
        
        fetchPlayerCards,
    }
};

export default usePlayerCards;