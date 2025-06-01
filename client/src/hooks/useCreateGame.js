
// Utilities
import BASE_URL from "../utils/config";

// React
import { useNavigate } from "react-router-dom";

let PopupManager = null;

const useCreateGame = () => {
    const navigate = useNavigate();

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    const createGame = async ({ gameName, playerName, isPrivate, gender, settings }) => {
        const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;

        if (!gameName?.trim()) {
            PopupManager.showPopup({
                title: "Invalid Game Name",
                message: "Please provide a valid game name.",
                icon: '🚫',
            });
            return;
        }

        if (!nameRegex.test(gameName.trim())) {
            PopupManager.showPopup({
                title: "Invalid Game Name",
                message: "Game name must contain only letters (A–Z or a–z).",
                icon: '🚫',
            });
            return;
        }

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
            gameName: gameName.trim().slice(0, 16),
            playerName: playerName.trim().slice(0, 26),
            isPrivate,
            gender,
            settings,
        };

        try {
            const response = await fetch(`${BASE_URL}create-game`, {
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
                    title: "Game Creation",
                    message: "Failed to create the game.",
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error("Error creating game:", error);
        }
    };

    // #region Game Modes

    const shuffleStyles = [
        { name: "Normal", type: "Fisher-Yates" },
        { name: "Chaotic", type: "Chaotic" },
    ];

    const cardMatchStyles = [
        { name: "Number-only", type: "Number-only" },
        { name: "Type-only", type: "Type-only" },
        { name: "Exact", type: "Exact" },
    ];

    const turnModes = [
        { name: "Default", type: "Default" },
        { name: "Reverse", type: "Reverse" },
        { name: "Random", type: "Random" },
    ];

    const busfahrerSelectionMode = [
        { name: "Default", type: "Default" },
        { name: "Reversed", type: "Reverse" },
        { name: "Random", type: "Random" },
    ];

    const schluckGiveMode = [
        { name: "Default", type: "Default" },
        { name: "Per Avatar", type: "Avatar" },
    ];

    // #endregion

    return {
        setPopupManager,
        createGame,
        shuffleStyles,
        cardMatchStyles,
        turnModes,
        busfahrerSelectionMode,
        schluckGiveMode,
    };
};

export default useCreateGame;
