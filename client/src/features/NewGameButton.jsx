/**
 * @fileoverview NewGameButton.jsx
 * Component for the "New Game" button that allows users to start a new game in the lobby. <br>
 * It handles click events, plays a sound, and communicates with the server to open a new game.
 */

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

/**
 * A button component that allows users to start a new game in the lobby. <br>
 * It handles click events, plays a sound, and communicates with the server to open a new game.
 * <br><br>
 * <strong>handleClick:</strong> <br>
 * This function is called when the button is clicked. <br>
 * It plays a click sound and sends a POST request to the server to open a new game. <br>
 * If the server responds with an error, it shows a popup with the error message.
 * <br><br>
 * 
 * @function NewGameButton
 * @param {string} lobbyId - The ID of the lobby where the new game will be started.
 * @param {boolean} canClick - Whether the button is clickable or disabled.
 * @returns {JSX.Element} The rendered New Game button component.
 */
function NewGameButton({ lobbyId, canClick }) {
    let imgUrl = '/icons/new.svg';
    if (!canClick) imgUrl = '/icons/retry_disabled.svg';

    const isDisabled = canClick
        ? "hover:shadow-[6px_6px_12px_rgba(0,0,0,0.6)] hover:-translate-y-[3px] hover:scale-105"
        : "";

    /**
     * Handles the click event on the New Game button.
     * It plays a click sound and sends a POST request to the server to open a new game.
     * If the server responds with an error, it shows a popup with the error message.
     */
    const handleClick = async () => {
        SoundManager.playClickSound();
        try {
            const response = await fetch(`${BASE_URL}open-new-game/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
                message: 'An error occurred while opening a new game.',
                icon: '❌',
            });
            console.error('Error opening a new game:', error);
        }
    };

    return (
        <button
            className={`playerActionBtn ${isDisabled}`}
            style={{ backgroundImage: `url('${imgUrl}')` }}
            disabled={!canClick}
            onClick={handleClick}
        />
    );
}

export default NewGameButton;
