
// Hooks
import useWebSocketConnector from './useWebSocketConnector';
import useSpectatorManager from './useSpectatorManager';

// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";

let PopupManager = null;

const useGameManager = () => {
    const init = useRef(false);
    const { gameId } = useParams();
    const navigate = useNavigate();

    const [isGameMaster, setIsGameMaster] = useState(false);
    const [players, setPlayers] = useState([]);
    
    const {
        isSpectator,
        setSpectators,
        spectators,
    } = useSpectatorManager();

    const fetchGameMaster = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-game-master?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const isMaster = await response.json();
            setIsGameMaster(isMaster);
        } catch (error) {
            console.error('Error checking game master status:', error);
        }
    };

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-players/${gameId}`, {
                credentials: 'include',
            });

            const data = await response.json();

            setPlayers(data.players);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    useEffect(() => {
        if(init.current) return;
        init.current = true;

        fetchGameMaster();
        fetchPlayers();
    }, [gameId]);

    useWebSocketConnector("subscribe", { gameId }, (message) => { 
        // Handle game state updates
        if (message.type === 'gameUpdate') {
            console.log(message.data.players);
            setPlayers(message.data.players);
            setSpectators(message.data.spectators);
        }

        // Handle player being kicked from the game
        if (message.type === 'kicked') {
            PopupManager.showPopup({
                title: "Player Kicked",
                message: "You have been removed from the game",
                icon: '❌',
                to: '/lobbys',
            });
        }

        // Handle game being closed
        if (message.type === 'gameClosed') {
            PopupManager.showPopup({
                title: "Game Closed",
                message: "The Game has been closed by the Game Master.",
                icon: '❌',
                to: '/lobbys',
            });
        }

        // Handle game start transition
        if (message.type === 'start') {
            navigate(`/phase1/${gameId}`);
        }
    });

    const startGame = async () => {
        if (!isGameMaster) return;

        try {
            const response = await fetch(`${BASE_URL}start-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (!response.ok) {
                PopupManager.showPopup({
                    title: "Starting Game",
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: "Starting Game",
                message: "Failed to start the game. Please try again.",
                icon: '❌',
            });
            console.error('Error starting game:', error);
        }
    };

    const kickPlayer = async (id, isSpect) => {
        try {
            const response = await fetch(`${BASE_URL}kick-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, id, isSpectator: isSpect }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error kicking player:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    return {
        setPopupManager,
        isGameMaster,
        startGame,
        kickPlayer,
        players,
        isSpectator,
        spectators,
    };
};

export default useGameManager;