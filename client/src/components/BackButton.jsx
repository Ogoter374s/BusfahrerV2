/**
 * BackButton.jsx — A reusable back navigation button for the game interface.
 *
 * Provides a consistent UI element to return to a previous or default route.
 * Plays a sound effect and triggers navigation when clicked.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useNavigate } from 'react-router-dom';

/**
 * BackButton component function.
 *
 * Renders a styled back button that plays a click sound and navigates
 * to the specified route (default is homepage) when activated.
 *
 * @function BackButton
 * @param {Object} props - Component properties.
 * @param {string} [props.to="/"] - The route to navigate to on click.
 * @returns {JSX.Element} The rendered back button element.
 */
function BackButton({ to = '/' }) {
    const navigate = useNavigate();

    /**
     * Handles the back button click event.
     *
     * Plays a UI click sound using the SoundManager and navigates to the given route.
     */
    const handleClick = () => {
        SoundManager.playClickSound();
        navigate(to);
    };

    /**
     * Renders the back button layout.
     *
     * Displays a back icon wrapped in a styled container for visual consistency.
     */
    return (
        <div className="back-cont">
            <button className="btn-back" onClick={handleClick}>
                <img src="/back.svg" alt="Back Button" className="back-icon" />
            </button>
        </div>
    );
}

export default BackButton;
