/**
 * @fileoverview Custom hook to manage lobbies in the Busfahrer game.
 * <br><br>
 * This hook provides state and functions to fetch, join, and update lobbies. <br>
 * It handles private lobby codes and integrates with navigation and popup management.
 */

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from "../utils/soundManager";
import { PopupManager } from "../utils/popupManager";

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";

/**
 * A custom hook to manage lobbies in the Busfahrer game. <br>
 * It provides state and functions to fetch, join, and update lobbies. <br>
 * It handles private lobby codes and integrates with navigation and popup management.
 * <br><br>
 * <strong>fetchLobbies:</strong> <br>
 * This function fetches the list of available lobbies from the server and updates the state.
 * <br><br>
 * <strong>joinLobby:</strong> <br>
 * This function handles the action of joining a lobby. <br>
 * It plays a click sound, validates the lobby code if it's private, and makes a POST request to check the lobby code. <br>
 * If successful, it navigates to the join page; otherwise, it shows a popup with the error message.
 * <br><br>
 * <strong>updateLobbies:</strong> <br>
 * This function updates the lobbies state based on the provided lobby data and action type. <br>
 * It can handle insertion, updating, and deletion of lobbies.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This hook is used to fetch the initial list of lobbies when the component mounts.
 * <br><br>
 * 
 * @function useLobbiesManager
 * @returns {object} An object containing the lobbies state, private code state, and functions to join and update lobbies.
 */
function useLobbiesManager() {
    const [privateCode, setPrivateCode] = useState('');
    const [lobbies, setLobbies] = useState([]);

    const navigate = useNavigate();
    const init = useRef(false);

    /**
     * Fetches the list of available lobbies from the server and updates the state.
     */
    const fetchLobbies = async () => {
        try {
            const res = await fetch(`${BASE_URL}get-lobbies`, {
                credentials: 'include',
            });
            const data = await res.json();
            
            setLobbies(data);
        } catch (err) {
            console.error('Failed to fetch lobbies:', err);
        }
    };

    /**
     * Handles the action of joining a lobby.
     * It plays a click sound, validates the lobby code if it's private, and makes a POST request to check the lobby code.
     * If successful, it navigates to the join page; otherwise, it shows a popup with the error message.
     */
    const joinLobby = async ({ lobbyCode = privateCode, isPrivate = false }) => {
        SoundManager.playClickSound();

        if (isPrivate && (!lobbyCode || !lobbyCode.trim())) {
            PopupManager.showPopup({
                title: "Join Lobby",
                message: "Please enter a valid lobby code.",
                icon: '🚫',
            });
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}check-lobby-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ lobbyCode }),
            });

            const data = await response.json();

            if (data.success) {
                navigate(`/join/${data.lobby}`);
            } else {
                PopupManager.showPopup({
                    title: "Join Lobby",
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: "Join Lobby",
                message: "Failed to join the lobby. Please try again.",
                icon: '❌',
            });
            console.error('Unexpected error joining lobby:', error);
        }
    };

    /**
     * Updates the lobbies state based on the provided lobby data and action type.
     * It can handle insertion, updating, and deletion of lobbies.
     */
    const updateLobbies = (lobbyData, type) => {
        setLobbies((prev) => {
            if (type === "delete") {
                return prev.filter((lobby) => lobby.id !== lobbyData);
            }

            if (type === "update" || type === "insert") {
                const exists = prev.some((lobby) => lobby.id === lobbyData.id);

                if (exists) {
                    return prev.map((lobby) =>
                        lobby.id === lobbyData.id ? lobbyData : lobby
                    );
                } else {
                    return [...prev, lobbyData];
                }
            }
        });
    }

    /**
     * Fetches the initial list of lobbies when the component mounts.
     * This effect runs only once due to the empty dependency array.
     * It initializes the lobbies state.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchLobbies();
    }, []);

    return {
        lobbies,
        updateLobbies,

        privateCode,
        setPrivateCode,

        joinLobby,
    };
};

export default useLobbiesManager;