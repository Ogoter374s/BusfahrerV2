/**
 * @fileoverview useGameCards Hook
 * <br><br>
 * This custom React hook manages the fetching and state of game cards for a specific game. <br>
 * It provides functionality to retrieve game cards from the server and store them in state.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';

/**
 * A custom React hook that manages the fetching and state of game cards for a specific game. <br>
 * It provides functionality to retrieve game cards from the server and store them in state.
 * <br><br>
 * <strong>fetchGameCards:</strong> <br>
 * This asynchronous function fetches the game cards from the server for the specified game ID. <br>
 * It updates the `cards` state variable with the retrieved data.
 * <br><br>
 * 
 * @function useGameCards
 * @param {string} gameId - The ID of the game for which to fetch cards.
 * @returns {object} An object containing the `cards` state variable, `setCards` function, and `fetchGameCards` function.
 */
const useGameCards = (gameId) => {
    const [cards, setCards] = useState([]);

    /**
     * Fetches the game cards from the server for the specified game ID. <br>
     * It updates the `cards` state variable with the retrieved data.
     */
    const fetchGameCards = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-game-cards/${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setCards(data.cards);
        } catch (error) {
            console.error('Error fetching game cards:', error);
        }
    };

    return {
        cards,
        setCards,

        fetchGameCards
    }
};

export default useGameCards;