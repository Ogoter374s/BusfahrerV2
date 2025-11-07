/**
 * @fileoverview Custom hook to manage and coordinate game state and actions.
 * <br><br>
 * This hook integrates various other hooks and provides functions to handle game actions such as laying cards, flipping rows, and leaving the game.
 */

// Hooks
import useWebSocketConnector from './useWebSocketConnector';
import usePlayerCards from './usePlayerCards';
import useAvatarInfo from './useAvatarInfo';
import useSpectatorManager from './useSpectatorManager';
import useGameInfo from './useGameInfo';
import useGameCards from './useGameCards';

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

// React
import { useRef, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";

/**
 * Custom hook that manages and coordinates game state and actions.
 * <br><br>
 * This hook integrates various other hooks and provides functions to handle game actions such as laying cards, flipping rows, and leaving the game.
 * <br><br>
 * <strong>usePlayerCards:</strong> <br>
 * This hook manages the player's cards and provides functions to fetch and update them.
 * <br><br>
 * <strong>handleLayCard:</strong> <br>
 * This function handles the action of laying a card. <br>
 * It checks if the player is the current player, plays a click sound, and makes a POST request to lay the specified card. <br>
 * If the action fails, it shows a popup with the error message.
 * <br><br>
 * <strong>handleRowClick:</strong> <br>
 * This function handles the action of flipping a row. <br>
 * It checks if the player is the game master and the current player, plays a click sound, and makes a POST request to flip the specified row. <br>
 * If the action fails, it shows a popup with the error message.
 * <br><br>
 * <strong>leaveGame:</strong> <br>
 * This function handles the action of leaving the game. <br>
 * It plays a click sound, makes a POST request to leave the game, and navigates to the specified route if successful. <br>
 * If the action fails, it shows a popup with the error message.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This effect runs once on mount and initializes the game state. <br>
 * It fetches the player's cards, game cards, and game information.
 * <br><br>
 * 
 * @function useGameManager
 * @returns {object} An object containing player cards, game cards, avatar info, game info, spectator status, and functions to handle game actions.
 */
const useGameManager = () => {
    const init = useRef(false);
    const navigate = useNavigate();
    const { lobbyId } = useParams();

    // Avatar information management and functions.
    const avatarInfo = useAvatarInfo();

    // Spectator management and functions.
    const { isSpectator } = useSpectatorManager();

    // Player cards management and functions.
    const {
        playerCards,
        setPlayerCards,
        fetchPlayerCards,
    } = usePlayerCards(lobbyId);

    // Game information management and functions.
    const gameInfo = useGameInfo(lobbyId);

    // Game cards management and functions.
    const gameCards = useGameCards(lobbyId);

    /**
     * Handles the action of laying a card.
     * It checks if the player is the current player, plays a click sound, and makes a POST request to lay the specified card.
     * If the action fails, it shows a popup with the error message.
     */
    const handleLayCard = async (cardIdx) => {
        if (!gameInfo.isCurrentPlayer) return;
        SoundManager.playClickSound();

        try {
            const response = await fetch(`${BASE_URL}lay-card/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ idx: cardIdx }),
            });

            const data = await response.json();

            if (!data.success) {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: "Lay Card Error",
                message: "Failed to lay the card. Please try again.",
                icon: '❌',
            });
            console.error('Error laying card:', error);
        }
    };

    /**
     * Handles the action of flipping a row.
     * It checks if the player is the game master and the current player, plays a click sound, and makes a POST request to flip the specified row.
     * If the action fails, it shows a popup with the error message.
     */
    const handleRowClick = async (rowIdx) => {
        if (!gameInfo.isGameMaster || !gameInfo.isCurrentPlayer) return;
        SoundManager.playClickSound();

        try {
            const response = await fetch(`${BASE_URL}flip-row/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ idx: rowIdx }),
            });

            const data = await response.json();

            if (!data.success) {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: "Flip Row Error",
                message: "Failed to flip the row. Please try again.",
                icon: '❌',
            });
            console.error('Error flipping row:', error);
        }
    };

    /**
     * Handles the action of leaving the game.
     * It plays a click sound, makes a POST request to leave the game, and navigates to the specified route if successful.
     * If the action fails, it shows a popup with the error message.
     */
    const leaveGame = async (to = "") => {
        SoundManager.playClickSound();
        try {
            const response = await fetch(`${BASE_URL}leave-game/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                if (to !== "") {
                    navigate(`/${to}`);
                }
            } else {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An error occurred while trying to leave. Please try again.',
                icon: '❌',
            });
            console.error('Error leaving game:', error);
            window._leavingManually = false;
        }
    };

    /**
     * Initializes the game state on mount.
     * It fetches the player's cards, game cards, and game information.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchPlayerCards();
        gameCards.fetchGameCards();
        gameInfo.fetchGameInfo();
    }, [lobbyId]);

    /**
     * WebSocket connector to handle real-time game updates.
     * It listens for various message types and updates the corresponding state variables accordingly.
     */
    useWebSocketConnector("game", { lobbyId }, init.current, (message) => {
        if (message.type === "avatarUpdate") {
            avatarInfo.setPlayers(message.data.players);
        }

        if (message.type === "settingUpdate") {
            avatarInfo.setUseGiving(message.data.settings.giving);
        }

        if (message.type == "playerDrinkUpdate") {
            avatarInfo.setDrinksGiven(message.data.given);
            avatarInfo.setCanUp(message.data.canUp);
            avatarInfo.setCanDown(message.data.canDown);
        }

        if (message.type === "playerCardUpdate") {
            setPlayerCards(message.data.cards);
        }

        if (message.type === "turnInfoUpdate") {
            gameInfo.setIsGameMaster(message.data.isGameMaster);
            gameInfo.setIsCurrentPlayer(message.data.isCurrentPlayer);

            if (message.data.drinksReceived !== undefined) gameInfo.setDrinksReceived(message.data.drinksReceived);
            if (message.data.nextPlayerEnabled !== undefined) gameInfo.setNextPlayerEnabled(message.data.nextPlayerEnabled);
            if (message.data.nextPhaseEnabled !== undefined) gameInfo.setNextPhaseEnabled(message.data.nextPhaseEnabled);
        }

        if (message.type === "gameInfoUpdate") {
            gameInfo.setPlayerRow(message.data.playerRow);
            gameInfo.setDrinkRow(message.data.drinkRow);
            gameInfo.setPhase(message.data.phase);
        }

        if (message.type === "phase3Update") {
            gameInfo.setCurrentRow(message.data.currentRow);
            gameInfo.setTryOver(message.data.tryOver);
            gameInfo.setGameOver(message.data.gameOver);
        }

        if (message.type === "gameCardUpdate") {
            gameCards.setCards(message.data.cards);
        }

        if (message.type === "nextPlayerUpdate") {
            gameInfo.setNextPlayerEnabled(message.data.nextPlayerEnabled);
            gameInfo.setNextPhaseEnabled(message.data.nextPhaseEnabled);
            gameInfo.setIsCurrentPlayer(message.data.isCurrentPlayer);
        }

        if (message.type === "busfahrerUpdate") {
            gameInfo.setBusfahrerName(message.data.busfahrerName);
        }

        if (message.type === 'closeUpdate') {
            PopupManager.showPopup({
                title: "Game Closed",
                message: "The Game has been closed by the Game Master.",
                icon: '❌',
                to: '/lobbies',
            });
        }

        if (message.type === "newGameUpdate") {
            navigate(`/lobby/${message.data.lobbyId}`);
        }
    });

    return {
        playerCards,
        handleLayCard,

        gameCards,
        handleRowClick,

        avatarInfo,
        gameInfo,
        isSpectator,

        leaveGame,
    };
}

export default useGameManager;