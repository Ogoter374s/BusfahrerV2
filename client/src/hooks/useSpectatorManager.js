/**
 * @fileoverview useSpectatorManager Hook
 * <br><br>
 * This custom React hook manages the spectator status and list of spectators for a specific game or lobby. <br>
 * It provides functionality to check if the current user is a spectator and to retrieve the list of spectators from the server.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useRef, useState } from 'react';
import { useParams } from "react-router-dom";

/**
 * Custom React hook to manage spectator status and list of spectators for a specific game or lobby. <br>
 * It provides functionality to check if the current user is a spectator and to retrieve the list of spectators from the server.
 * <br><br>
 * <strong>fetchIsSpectator:</strong> <br>
 * This asynchronous function checks if the current user is a spectator for the specified game or lobby ID. <br>
 * It updates the `isSpectator` state with the retrieved data.
 * <br><br>
 * <strong>fetchSpectators:</strong> <br>
 * This asynchronous function fetches the list of spectators for the specified lobby ID from the server. <br>
 * It updates the `spectators` state with the retrieved data.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This hook is used to fetch the initial spectator status and list when the component mounts.
 * <br><br>
 * 
 * @function useSpectatorManager
 * @param {boolean} [isLobby=false] - Whether to manage spectators for a lobby instead of a game.
 * @returns {object} An object containing the spectator status and list of spectators.
 */
const useSpectatorManager = (isLobby = false) => {
    const [isSpectator, setIsSpectator] = useState(false);
    const [spectators, setSpectators] = useState([]);

    const init = useRef(false);
    const { lobbyId } = useParams();

    let type = "game";
    if (isLobby) {
        type = "lobby";
    }

    /**
     * Fetches whether the current user is a spectator for the specified game or lobby ID. <br>
     * Updates the `isSpectator` state with the retrieved data.
     */
    const fetchIsSpectator = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-${type}-spectator/${lobbyId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const data = await response.json();
            setIsSpectator(data.isSpectator);
        } catch (error) {
            console.error('Error checking spectator status:', error);
        }
    };

    /**
     * Fetches the list of spectators for the specified lobby ID from the server. <br>
     * Updates the `spectators` state with the retrieved data.
     */
    const fetchSpectators = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-lobby-spectators/${lobbyId}`, {
                credentials: 'include',
            });

            const data = await response.json();

            setSpectators(data.spectators);
        } catch (error) {
            console.error('Error fetching spectators:', error);
        }
    };

    /**
     * Fetches the initial spectator status and list when the component mounts.
     * This hook is used to fetch the initial spectator status and list when the component mounts.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchIsSpectator();
        fetchSpectators();
    }, [lobbyId]);

    return {
        spectators,
        setSpectators,

        isSpectator,
    };
};

export default useSpectatorManager;