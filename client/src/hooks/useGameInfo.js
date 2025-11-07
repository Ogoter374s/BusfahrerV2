/**
 * @fileoverview Custom hook to manage and fetch game information.
 * <br><br>
 * This hook provides state variables and functions to fetch and update game-related data such as player rows, drink rows, game phases, and player roles.
 */

// Hooks
import useBusfahrer from './useBusfahrer';

// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';

/**
 * Custom hook that manages and fetches game information.
 * <br><br>
 * This hook provides state variables and functions to fetch and update game-related data such as player rows, drink rows, game phases, and player roles.
 * <br><br>
 * <strong>useBusfahrer:</strong> <br>
 * This hook utilizes the `useBusfahrer` hook to manage the Busfahrer (Game Master) related state and functions. <br>
 * It provides access to the Busfahrer name and a function to fetch the Busfahrer information from the server.
 * <br><br>
 * <strong>fetchPlayerInfo:</strong> <br>
 * This function fetches player information such as game master status and current player status from the server. <br>
 * It updates the corresponding state variables based on the response.
 * <br><br>
 * <strong>fetchTurnInfo:</strong> <br>
 * This function fetches turn-related information such as player rows, drink rows, game phases, and action enablement from the server. <br>
 * It updates the corresponding state variables with the fetched data.
 * <br><br>
 * <strong>fetchGameInfo:</strong> <br>
 * This function fetches the latest game information from the server, including player rows, drink rows, game phases, and player roles. <br>
 * It updates the corresponding state variables with the fetched data.
 * <br><br>
 * 
 * 
 */
const useGameInfo = (gameId) => {
    const [playerRow, setPlayerRow] = useState({ name: "", info: "" });
    const [drinkRow, setDrinkRow] = useState({ name: "", info: "" });
    const [drinksReceived, setDrinksReceived] = useState(0);

    const [isGameMaster, setIsGameMaster] = useState(false);
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);

    const [nextPlayerEnabled, setNextPlayerEnabled] = useState(false);
    const [nextPhaseEnabled, setNextPhaseEnabled] = useState(false);

    const [currentRow, setCurrentRow] = useState(-1);
    const [tryOver, setTryOver] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    const [phase, setPhase] = useState(-1);

    // Busfahrer (Game Master) related state and functions
    const {
        busfahrerName,
        setBusfahrerName,
        fetchBusfahrer,
    } = useBusfahrer(gameId);

    /**
     * Fetches player information such as game master status and current player status.
     * This function makes a GET request to the server to retrieve player-related data.
     * It updates the `isGameMaster`, `isCurrentPlayer`, and `drinksReceived` state variables based on the response.
     */
    const fetchPlayerInfo = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-player-info/${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setIsGameMaster(data.isGameMaster);
            setIsCurrentPlayer(data.isCurrentPlayer);
            if (data.drinksReceived !== undefined) setDrinksReceived(data.drinksReceived);
        } catch (error) {
            console.error('Error checking game master status:', error);
        }
    };

    /**
     * Fetches turn-related information such as player rows, drink rows, game phases, and action enablement.
     * This function makes a GET request to the server to retrieve turn-related data.
     * It updates the corresponding state variables with the fetched data.
     */
    const fetchTurnInfo = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-game-info/${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setPlayerRow(data.playerRow);
            setDrinkRow(data.drinkRow);
            setPhase(data.phase);

            if (data.nextPlayerEnabled !== undefined) setNextPlayerEnabled(data.nextPlayerEnabled);
            if (data.nextPhaseEnabled !== undefined) setNextPhaseEnabled(data.nextPhaseEnabled);

            if (data.currentRow !== undefined) setCurrentRow(data.currentRow);
            if (data.tryOver !== undefined) setTryOver(data.tryOver);
            if (data.gameOver !== undefined) setGameOver(data.gameOver);

            if (data.phase > 1) {
                fetchBusfahrer();
            }
        } catch (error) {
            console.error('Error fetching turn info:', error);
        }
    };

    /**
     * Fetches the latest game information including player rows, drink rows, game phases, and player roles.
     * This function calls `fetchPlayerInfo` and `fetchTurnInfo` to update the corresponding state variables with the latest data.
     */
    const fetchGameInfo = async () => {
        await fetchPlayerInfo();
        await fetchTurnInfo();
    };

    return {
        playerRow,
        setPlayerRow,

        drinkRow,
        setDrinkRow,

        drinksReceived,
        setDrinksReceived,

        isGameMaster,
        setIsGameMaster,

        isCurrentPlayer,
        setIsCurrentPlayer,

        nextPlayerEnabled,
        setNextPlayerEnabled,

        nextPhaseEnabled,
        setNextPhaseEnabled,

        phase,
        setPhase,

        busfahrerName,
        setBusfahrerName,

        currentRow,
        setCurrentRow,

        tryOver,
        setTryOver,

        gameOver,
        setGameOver,

        fetchGameInfo,
    }
};

export default useGameInfo;