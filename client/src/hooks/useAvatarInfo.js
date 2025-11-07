/**
 * @fileoverview Custom hook to manage avatar information and drink-giving functionality.
 * <br><br>
 * This hook fetches player data, current player status, game settings, and drink information. <br>
 * It also provides functionality to give drinks to other players.
 */

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

// React
import { useEffect, useState, useRef } from 'react';
import { useParams } from "react-router-dom";

/**
 * Custom hook to manage avatar information and drink-giving functionality.
 * <br><br>
 * This hook fetches player data, current player status, game settings, and drink information. <br>
 * It also provides functionality to give drinks to other players.
 * <br><br>
 * <strong>fetchPlayers:</strong> <br>
 * Fetches the list of players in the game from the server and updates the `players` state.
 * <br><br>
 * <strong>fetchCurrentPlayer:</strong> <br>
 * Fetches information about the current player and updates the `isCurrentPlayer` state.
 * <br><br>
 * <strong>getGameSettings:</strong> <br>
 * Fetches game settings from the server and updates the `useGiving` state.
 * <br><br>
 * <strong>getDrinkInfo:</strong> <br>
 * Fetches drink information from the server and updates the relevant states.
 * <br><br>
 * <strong>giveDrinkToPlayer:</strong> <br>
 * Function to give a drink to a selected player, updating the server and playing a sound.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * The `useEffect` hook is used to initialize the fetching of data when the component using this hook mounts. <br>
 * It ensures that the data is fetched only once by using a ref to track initialization. <br>
 * This hook returns an object containing all relevant states and functions for managing avatar and drink-giving functionality.
 * <br><br>
 * 
 * @function useAvatarInfo
 * @returns {object} An object containing avatar and drink-giving related states and functions.
 */
const useAvatarInfo = () => {
    const init = useRef(false);
    const { lobbyId } = useParams();

    const [players, setPlayers] = useState([]);
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);
    const [useGiving, setUseGiving] = useState(true);

    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [drinksGiven, setDrinksGiven] = useState(false);
    const [canUp, setCanUp] = useState(false);
    const [canDown, setCanDown] = useState(false);

    /**
     * Fetches the list of players in the game from the server.
     * This function makes a GET request to the server to retrieve player information
     * for the current lobby and updates the `players` state with the received data.
     */
    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-game-players/${lobbyId}`, {
                credentials: 'include',
            });

            const data = await response.json();

            setPlayers(data.players);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    /**
     * Fetches information about the current player.
     * This function makes a GET request to the server to determine if the current user
     * is the player associated with this client and updates the `isCurrentPlayer` state.
     */
    const fetchCurrentPlayer = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-player-info/${lobbyId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setIsCurrentPlayer(data.isCurrentPlayer);
        } catch (error) {
            console.error('Error fetching current player:', error);
        }
    };

    /**
     * Fetches game settings from the server.
     * This function makes a GET request to retrieve settings for the current lobby
     * and updates the `useGiving` state based on the received settings.
     */
    const getGameSettings = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-game-settings/${lobbyId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setUseGiving(data.settings.giving);
        } catch (error) {
            console.error('Error fetching game settings:', error);
        }
    };

    /**
     * Fetches drink information from the server.
     * This function makes a GET request to retrieve drink-related information
     * for the current lobby and updates the relevant states accordingly.
     */
    const getDrinkInfo = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-drink-info/${lobbyId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();

            setDrinksGiven(data.given);
            setCanUp(data.canUp);
            setCanDown(data.canDown);
        } catch (error) {
            console.error('Error fetching drinks given status:', error);
        }
    };

    /**
     * Gives a drink to the selected player.
     * This function makes a POST request to the server to give a drink to the player
     * identified by `selectedPlayer`. It plays a click sound and handles any errors
     */
    const giveDrinkToPlayer = (inc) => async () => {
        SoundManager.playClickSound();

        if (!isCurrentPlayer) return;

        try {
            const response = await fetch(`${BASE_URL}give-drink-player/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ inc, playerId: selectedPlayer }),
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
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error('Error giving Schluck:', error);
        }
    };

    /**
     * useEffect hook that initializes data fetching when the component mounts.
     * This hook ensures that player data, current player status, game settings,
     * and drink information are fetched only once by using a ref to track initialization.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchPlayers();
        fetchCurrentPlayer();

        getGameSettings();
        getDrinkInfo();
    }, []);

    return {
        players,
        setPlayers,

        isCurrentPlayer,
        setIsCurrentPlayer,

        useGiving,
        setUseGiving,

        selectedPlayer,
        setSelectedPlayer,

        drinksGiven,
        setDrinksGiven,

        canUp,
        setCanUp,
        canDown,
        setCanDown,

        giveDrinkToPlayer,
    }
};

export default useAvatarInfo;