// Utilities
import BASE_URL from "../utils/config";

// React
import { useNavigate } from "react-router-dom";

let PopupManager = null;

const useLobbyManager = () => {
    const navigate = useNavigate();

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    const joinGame = async ({gameId, isPrivate=false}) => {
        if (isPrivate && (!privateCode || !privateCode.trim())) {
            PopupManager.showPopup({
                title: "Join Game",
                message: "Please enter a valid game code.",
                icon: '🚫',
            });
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}check-game-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (data.success) {
                navigate(`/join/${data.game}`);
            } else {
                PopupManager.showPopup({
                    title: "Join Game",
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: "Join Game",
                message: "Failed to join the game. Please try again.",
                icon: '❌',
            });
            console.error('Unexpected error joining game:', error);
        }
    };

    return {
        setPopupManager,
        joinGame,
    };
};

export default useLobbyManager;