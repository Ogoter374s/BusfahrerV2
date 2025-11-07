/**
 * @fileoverview SettingsButton component for managing user settings.
 * <br><br>
 * This component renders a button that navigates to the account settings or login page
 * based on the user's authentication status. It plays a click sound when clicked.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useNavigate } from 'react-router-dom';

/**
 * SettingsButton component renders a button that navigates to the account settings or login page based on the user's authentication status. <br>
 * It plays a click sound when clicked.
 * <br><br>
 * <strong>handleClick:</strong> <br>
 * This function is called when the button is clicked. <br>
 * It plays a click sound using the SoundManager utility. <br>
 * It navigates to the account settings page if the user is authenticated, or to the login page if not.
 * 
 * @function SettingsButton
 * @param {boolean} isAuthenticated - Indicates whether the user is authenticated.
 * @returns {JSX.Element} The rendered SettingsButton component.
 */
function SettingsButton({ isAuthenticated }) {
    const navigate = useNavigate();

    /**
     * Handles the button click event.
     * Plays a click sound and navigates to the account settings or login page based on authentication status.
     */
    const handleClick = () => {
        SoundManager.playClickSound();
        navigate(isAuthenticated ? '/account' : '/access');
    };

    const img = isAuthenticated ? "settings" : "login";

    return (
        // Settings Button
        <button className={"settings-btn"}
            style={{ backgroundImage: `url('/icons/${img}.svg')` }}
            onClick={handleClick}
        />
    );
}

export default SettingsButton;
