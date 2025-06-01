// Utilities
import BASE_URL from "../utils/config";

// React
import { useNavigate } from "react-router-dom";

let PopupManager = null;

const useJoinGame = () => {
    const navigate = useNavigate();

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    const joinGame = async ({ gameId, playerName, gender, isSpectator }) => {
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
            const response = await fetch(`${BASE_URL}join-game/${gameId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                navigate(`/game/${data.gameId}`);
            } else {
                PopupManager.showPopup({
                    title: "Joining Game",
                    message: "Failed to join the game.",
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error("Error joining game:", error);
        }
    };

    return {
        setPopupManager,
        joinGame,
    };
};

export default useJoinGame;