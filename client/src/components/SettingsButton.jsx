/**
 * SettingsButton.jsx — Renders a settings or login button based on user authentication.
 *
 * Displays a button that redirects users to the account page if authenticated,
 * or to the login/register access screen otherwise. Plays a click sound on interaction.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useNavigate } from 'react-router-dom';

/**
 * SettingsButton component function.
 *
 * Handles redirection based on the user's authentication status.
 * Plays a click sound using the global sound manager when clicked.
 *
 * @function SettingsButton
 * @param {Object} props - Component properties.
 * @param {boolean} props.isAuthenticated - Indicates if the user is logged in.
 * @returns {JSX.Element} The rendered settings/login button.
 */
function SettingsButton({ isAuthenticated }) {
    const navigate = useNavigate();

    /**
     * Handles the button click event.
     *
     * Plays a UI click sound and navigates the user to either
     * the account settings page (if authenticated) or the access screen.
     */
    const handleClick = () => {
        SoundManager.playClickSound();
        navigate(isAuthenticated ? '/account' : '/access');
    };

    /**
     * Renders the settings button container.
     *
     * Displays an icon representing either settings or login,
     * based on the authentication state.
     */
    return (
        <div className="settings-button">
            <button className="btn" onClick={handleClick}>
                <img
                    src={isAuthenticated ? 'settings.svg' : 'login.svg'}
                    alt="Settings"
                    className="settings-icon"
                />
            </button>
        </div>
    );
}

export default SettingsButton;
