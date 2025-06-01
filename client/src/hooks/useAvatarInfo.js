
// Hooks
import useWebSocketConnector from './useWebSocketConnector';

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';

// React
import { useEffect, useState, useRef } from 'react';
import { useParams } from "react-router-dom";

const useAvatarInfo = (phase) => {
    const init = useRef(false);
    const { gameId } = useParams();

    const [players, setPlayers] = useState([]);
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [useGive, setUseGive] = useState(true);
    const [drinks, setDrinks] = useState(false);

    const isPhase1 = phase === 1;

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-players/${gameId}`, {
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch players');

            const data = await response.json();
            setPlayers(data.players);
        } catch (error) {
            console.error('Error fetching players:', error);
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
            
            setIsCurrentPlayer(player.isCurrent);
        } catch (error) {
            console.error('Error fetching current player:', error);
        }
    };

    const fetchUseGive = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}use-give?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const given = await response.json();
            setUseGive(given && isPhase1);
        } catch (error) {
            console.error('Error fetching useGive status:', error);
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
            setDrinks(given);
        } catch (error) {
            console.error('Error fetching drinks given status:', error);
        }
    };
    
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchPlayers();
        fetchCurrentPlayer();
        fetchUseGive();
        fetchDrinksGiven();
    }, []);

    useWebSocketConnector("subscribe", {gameId}, (message) => {
        if (message.type === 'playersUpdate') {
            fetchDrinksGiven();
        }

        if (message.type === 'gameUpdate') {
            setPlayers(message.data.players);
            fetchCurrentPlayer();
        }
    });

    const giveSchluck = (inc) => async () => {
        if (!isCurrentPlayer) return;

        try {
            const response = await fetch(`${BASE_URL}give-schluck`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, inc, playerId: selectedPlayer }),
            });

            if (response.ok) {
                SoundManager.playClickSound();
            } else {
                throw new Error('Failed to give Schluck');
            }
        } catch (error) {
            console.error('Error giving Schluck:', error);
        }
    };

    return {
        players,
        selectedPlayer,
        setSelectedPlayer,
        isCurrentPlayer,
        useGive,
        drinks,
        giveSchluck,
    }
};

export default useAvatarInfo;