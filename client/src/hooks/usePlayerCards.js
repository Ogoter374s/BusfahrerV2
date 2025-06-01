// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';
import { useParams } from "react-router-dom";

const usePlayerCards = () => {
    const { gameId } = useParams();

    const [playerCards, setPlayerCards] = useState([]);

    const fetchPlayerCards = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-player-cards?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch player cards');
            }

            const pCards = await response.json();
            setPlayerCards(pCards);
        } catch (error) {
            console.error('Error fetching player cards:', error);
        }
    };

    return {
        playerCards,
        fetchPlayerCards,
    }
};

export default usePlayerCards;