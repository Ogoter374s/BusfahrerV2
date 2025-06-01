// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';
import { useParams } from "react-router-dom";

const useGameCards = () => {
    const { gameId } = useParams();

    const [gameCards, setGameCards] = useState([]);
    const [isRowFlipped, setIsRowFlipped] = useState(false);

    const fetchGameCards = async (phase) => {
        try {
            let url = '';
            if (phase === 2) {
                url = `${BASE_URL}get-phase-cards?gameId=${gameId}`;
            } else {
                url = `${BASE_URL}get-game-cards?gameId=${gameId}`;
            }

            const response = await fetch(
                url,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch game cards');
            }

            const gCards = await response.json();

            let structured = [];

            if (phase === 1) {
                // Pyramid: 1 -> 5 rows
                let idx = 0;
                for (let row = 1; row <= 5; row++) {
                structured.push(gCards.slice(idx, idx + row));
                idx += row;
                }

            } else if (phase === 2) {
                // 3-column layout from backend format
                for (let i = 0; i < 3; i++) {
                structured.push(gCards?.[i]?.cards || []);
                }

            } else if (phase === 3) {
                // Diamond: 2-5-2 (in/out)
                let idx = 0;
                structured.push(gCards.slice(idx, idx + 2));
                idx += 2;

                for (let row = 2; row <= 5; row++) {
                structured.push(gCards.slice(idx, idx + row));
                idx += row;
                }

                for (let row = 4; row >= 2; row--) {
                structured.push(gCards.slice(idx, idx + row));
                idx += row;
                }

                structured.push(gCards.slice(idx, idx + 2));
            }

            setGameCards(structured);
        } catch (error) {
            console.error('Error fetching game cards:', error);
        }
    };

    const fetchIsRowFlipped = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-is-row-flipped?gameId=${gameId}`,
                {
                    credentials: 'include',
                },
            );

            const flipped = await response.json();

            setIsRowFlipped(flipped);
        } catch (error) {
            console.error('Error fetching row flip status:', error);
        }
    };

    return {
        gameCards,
        setGameCards,
        fetchGameCards,
        isRowFlipped,
        setIsRowFlipped,
        fetchIsRowFlipped,
    }
};

export default useGameCards;