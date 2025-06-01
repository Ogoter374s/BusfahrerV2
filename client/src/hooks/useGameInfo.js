// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';
import { useParams } from "react-router-dom";

const useGameInfo = (phase) => {
    const { gameId } = useParams();

    const [currentName, setCurrentName] = useState('');
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);
    const [drinkCount, setDrinkCount] = useState(0);
    const [isNextPhase, setIsNextPhase] = useState(false);
    const [drinksReceived, setDrinksReceived] = useState(0);
    const [drinksGiven, setDrinksGiven] = useState(false);

    const [currentRound, setCurrentRound] = useState(1);
    const [allCardsPlayed, setAllCardsPlayed] = useState(false);
    const [hasToEx, setHasToEx] = useState(false);

    const fetchRound = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-round?gameId=${gameId}`,
                {
                    credentials: 'include',
                },
            );

            const round = await response.json();

            setCurrentRound(round);

            if( phase === 1) {
                setIsNextPhase(round === 6);
            } else if (phase === 2) {
                setIsNextPhase(round === 4);
            }
        } catch (error) {
            console.error('Error fetching round data:', error);
        }
    };

    const fetchCurrentPlayer = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-current-player?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const player = await response.json();
            
            setCurrentName(player.playerName);
            setIsCurrentPlayer(player.isCurrent);
        } catch (error) {
            console.error('Error fetching current player:', error);
        }
    };

    const fetchDrinkCount = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-drink-count?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const drinks = await response.json();
            setDrinkCount(drinks);
        } catch (error) {
            console.error('Error fetching drink count:', error);
        }
    };

    const fetchDrinksReceived = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-drinks-received?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const drinks = await response.json();
            setDrinksReceived(drinks);
        } catch (error) {
            console.error('Error fetching drinks received:', error);
        }
    };

    const fetchDrinksGiven = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}drinks-given?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const given = await response.json();
            setDrinksGiven(given);
        } catch (error) {
            console.error('Error fetching drinks given status:', error);
        }
    };

    const fetchAllCardsPlayed = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}all-cards-played?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch played cards data');
            }

            const allPlayed = await response.json();
            setAllCardsPlayed(allPlayed);
        } catch (error) {
            console.error('Error fetching played cards:', error);
        }
    };
    
    const fetchHasToEx = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-has-to-ex?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch has-to-ex data');
            }

            const exen = await response.json();
            setHasToEx(exen);
        } catch (error) {
            console.error('Error fetching has-to-ex data:', error);
        }
    };

    return {
        currentName,
        isCurrentPlayer,
        fetchCurrentPlayer,
        drinkCount,
        setDrinkCount,
        fetchDrinkCount,
        isNextPhase,
        currentRound,
        setCurrentRound,
        setIsNextPhase,
        fetchRound,
        drinksReceived,
        fetchDrinksReceived,
        drinksGiven,
        fetchDrinksGiven,
        allCardsPlayed,
        fetchAllCardsPlayed,
        hasToEx,
        fetchHasToEx,
    }
};

export default useGameInfo;