/**
 * @fileoverview RetryButton component for retrying phase 3 of the game.
 * <br><br>
 * This component renders a button that allows retrying phase 3 of the game. <br>
 * It includes sound effects and visual feedback based on its clickable state.
 */

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

/**
 * A button that allows retrying phase 3 of the game. <br>
 * It includes sound effects and visual feedback based on its clickable state.
 * <br><br>
 * <strong>handleClick:</strong> <br>
 * This function is called when the button is clicked. <br>
 * It plays a click sound and sends a POST request to retry phase 3. <br>
 * If the request fails, it shows a popup with the error message.
 * <br><br>
 * 
 * @function RetryButton
 * @param {string} lobbyId - The unique identifier of the game lobby.
 * @param {boolean} canClick - Whether the button is currently clickable.
 * @returns {JSX.Element} The rendered RetryButton component.
 */
function RetryButton({ lobbyId, canClick }) {
    let imgUrl = '/icons/retry.svg';
    if (!canClick) imgUrl = '/icons/retry_disabled.svg';

    const isDisabled = canClick
        ? "hover:shadow-[6px_6px_12px_rgba(0,0,0,0.6)] hover:-translate-y-[3px] hover:scale-105"
        : "";

    const handleClick = async () => {
        SoundManager.playClickSound();
        try {
            const response = await fetch(`${BASE_URL}retry-phase3/${lobbyId}`, {
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
                message: 'An error occurred while retrying phase 3.',
                icon: '❌',
            });
            console.error('Error retrying phase 3:', error);
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

export default RetryButton;
