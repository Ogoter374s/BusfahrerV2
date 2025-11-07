/**
 * @fileoverview Custom hook to manage lobby functionalities such as creating, joining,
 * leaving lobbies, fetching lobby info, and handling game master actions.
 * <br><br>
 * This hook provides various functions and state variables to manage lobby-related operations. <br>
 * It includes functions to create and join lobbies, leave lobbies, fetch lobby information,
 * and handle game master actions like starting the game and kicking players. <br>
 * It also manages state variables for players, spectators, lobby info, and game master status.
 */

// Hooks
import useWebSocketConnector from './useWebSocketConnector';
import useSpectatorManager from './useSpectatorManager';

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from "../utils/popupManager";

// React
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";

/**
 * Custom hook that manages lobby functionalities including creating, joining,
 * leaving lobbies, fetching lobby info, and handling game master actions.
 * <br><br>
 * <strong>useSpectatorManager:</strong> <br>
 * This hook utilizes the `useSpectatorManager` hook to manage spectator-related functionalities within the lobby. <br>
 * It provides state variables and functions to handle spectators, including checking if the user is a spectator,
 * setting spectators, and managing the list of spectators.
 * <br><br>
 * <strong>fetchGameMaster:</strong> <br>
 * This function checks if the current user is the game master of the lobby. <br>
 * It makes a GET request to the server and updates the `isGameMaster` state based on the response.
 * <br><br>
 * <strong>fetchPlayers:</strong> <br>
 * This function fetches the list of players in the lobby. <br>
 * It makes a GET request to the server and updates the `players` state with the retrieved data.
 * <br><br>
 * <strong>fetchLobbyInfo:</strong> <br>
 * This function fetches the lobby information. <br>
 * It makes a GET request to the server and updates the `lobbyInfo` state with the retrieved data.
 * <br><br>
 * <strong>joinLobby:</strong> <br>
 * This function allows a user to join a lobby with the provided parameters. <br>
 * It validates the input and sends a request to the server to join the lobby. <br>
 * It displays popups for errors or success messages.
 * <br><br>
 * <strong>leaveJoin:</strong> <br>
 * This function allows a user to leave the current lobby and join another one. <br>
 * It plays a click sound effect and sends a request to the server to leave the lobby. <br>
 * If successful, it navigates the user to the specified route; otherwise, it shows an error popup.
 * <br><br>
 * <strong>leaveLobby:</strong> <br>
 * This function handles the click event for the leave button. <br>
 * It plays a click sound effect and sends a POST request to the server to leave the game or lobby. <br>
 * If successful, it navigates the user to the lobbies page; otherwise, it shows an error popup.
 * <br><br>
 * <strong>kickPlayer:</strong> <br>
 * This function allows the game master to kick a player from the lobby. <br>
 * It makes a POST request to the server with the player ID to be kicked. <br>
 * If successful, it updates the `players` state to remove the kicked player.
 * <br><br>
 * <strong>startGame:</strong> <br>
 * This function allows the game master to start the game. <br>
 * It makes a POST request to the server to initiate the game start. <br>
 * If successful, it navigates the user to the game page; otherwise, it shows an error popup.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * The `useEffect` hook is used to initialize the lobby manager when the component mounts. <br>
 * It fetches the initial lobby information, player list, and game master status.
 * <br><br>
 * 
 * @function useLobbyManager
 * @returns {object} An object containing functions and state variables to manage lobby functionalities.
 */
const useLobbyManager = () => {
    const init = useRef(false);
    const navigate = useNavigate();
    const { lobbyId } = useParams();

    const [isGameMaster, setIsGameMaster] = useState(false);
    const [players, setPlayers] = useState([]);
    const [lobbyInfo, setLobbyInfo] = useState(null);

    /**
     * Spectator management using the useSpectatorManager hook.
     * This provides state and functions to manage spectators within the lobby.
     */
    const {
        isSpectator,
        setSpectators,
        spectators,
    } = useSpectatorManager(true);

    /**
     * Fetches and updates the game master status of the current user.
     * Makes a GET request to the server to check if the user is the game master of the lobby.
     * Updates the `isGameMaster` state based on the response.
     */
    const fetchGameMaster = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-lobby-master/${lobbyId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            setIsGameMaster(data.isMaster);
        } catch (error) {
            console.error('Error checking game master status:', error);
        }
    };

    /**
     * Fetches and updates the list of players in the lobby.
     * Makes a GET request to the server to retrieve the players in the lobby.
     * Updates the `players` state with the retrieved data.
     */
    const fetchPlayers = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-lobby-players/${lobbyId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            setPlayers(data.players);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    /**
     * Fetches and updates the lobby information.
     * Makes a GET request to the server to retrieve the lobby info.
     * Updates the `lobbyInfo` state with the retrieved data.
     */
    const fetchLobbyInfo = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-lobby-info/${lobbyId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            setLobbyInfo(data.info);
        } catch (error) {
            console.error('Error fetching lobby info:', error);
        }
    };

    /**
     * Joins a lobby with the provided parameters.
     * Validates input and sends a request to the server.
     * Displays popups for errors or success.
     */
    const joinLobby = async ({ lobbyId, playerName, gender, isSpectator }) => {
        const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;

        if (!playerName?.trim()) {
            PopupManager.showPopup({
                title: "Invalid Player Name",
                message: "Please provide a valid player name.",
                icon: '🚫',
            });
            return;
        }

        if (!nameRegex.test(playerName.trim())) {
            PopupManager.showPopup({
                title: "Invalid Player Name",
                message: "Player name must contain only letters (A–Z or a–z).",
                icon: '🚫',
            });
            return;
        }

        const payload = {
            playerName: playerName.trim().slice(0, 26),
            gender,
            spectator: isSpectator,
        };

        try {
            const response = await fetch(`${BASE_URL}join-lobby/${lobbyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                navigate(`/lobby/${data.lobbyId}`);
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
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error("Error joining lobby:", error);
        }
    };

    /**
     * Leaves the current lobby and joins another one.
     * Plays a click sound effect and sends a request to the server.
     * If successful, navigates the user to the specified route; otherwise, shows an error popup.
     */
    const leaveJoin = async (to = "") => {
        SoundManager.playClickSound();
        try {
            const response = await fetch(`${BASE_URL}leave-join/${lobbyId}`, {
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
            console.error('Error leaving join:', error);
        }
    };

    /**
     * Handles the click event for the leave button.
     * Plays a click sound effect and sends a POST request to the server to leave the game or lobby.
     * If successful, navigates the user to the lobbies page; otherwise, shows an error popup.
     */
    const leaveLobby = async (to = "") => {
        SoundManager.playClickSound();

        try {
            const response = await fetch(`${BASE_URL}leave-lobby/${lobbyId}`, {
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
        }
    };

    /**
     * Kicks a player from the lobby.
     * Makes a POST request to the server with the player ID to be kicked. <br>
     * If successful, it updates the `players` state to remove the kicked player.
     */
    const kickPlayer = async (id) => {
        SoundManager.playClickSound();
        try {
            const response = await fetch(`${BASE_URL}kick-lobby-player/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ playerId: id })
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
                title: "Kicking Player",
                message: "Failed to kick the player. Please try again.",
                icon: '❌',
            });
            console.error('Error kicking player:', error);
        }
    };

    /**
     * Starts the game if the current user is the game master.
     * Makes a POST request to the server to initiate the game start. <br>
     * If successful, it navigates the user to the game page; otherwise, it shows an error popup.
     */
    const startGame = async () => {
        if (!isGameMaster) return;

        try {
            const response = await fetch(`${BASE_URL}start-game/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
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
                title: "Starting Game",
                message: "Failed to start the game. Please try again.",
                icon: '❌',
            });
            console.error('Error starting game:', error);
        }
    };

    /**
     * useEffect hook that initializes the lobby manager when the component mounts.
     * It fetches the initial lobby information, player list, and game master status.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchGameMaster();
        fetchPlayers();
        fetchLobbyInfo();
    }, [lobbyId]);

    /**
     * WebSocket connector to handle real-time lobby updates.
     * Listens for messages related to lobby updates, role updates, kick updates, close updates, and start updates.
     */
    useWebSocketConnector("lobby", { lobbyId }, init.current, (message) => {
        if (message.type === 'lobbyUpdate') {
            setPlayers(message.data.players || []);
            setSpectators(message.data.spectators || []);
        }

        if (message.type === 'roleUpdate') {
            setIsGameMaster(message.data.isGameMaster);
        }

        if (message.type === 'kickUpdate') {
            PopupManager.showPopup({
                title: "Player Kicked",
                message: "You have been removed from the game",
                icon: '❌',
                to: '/lobbies',
            });
        }

        if (message.type === 'closeUpdate') {
            PopupManager.showPopup({
                title: "Game Closed",
                message: "The Game has been closed by the Game Master.",
                icon: '❌',
                to: '/lobbies',
            });
        }

        if (message.type === 'startUpdate') {
            navigate(`/game/${message.data.gameId}`);
        }
    });

    return {
        leaveJoin,
        joinLobby,

        leaveLobby,
        kickPlayer,
        startGame,

        isGameMaster,
        players,

        isSpectator,
        spectators,

        lobbyInfo,
    };
};

export default useLobbyManager;