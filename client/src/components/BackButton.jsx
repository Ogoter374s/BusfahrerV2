/**
 * @fileoverview BackButton component
 * <br><br>
 * This component renders a back button that navigates to a specified route when clicked. <br>
 * It plays a click sound effect on interaction and can be styled with custom dimensions.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useNavigate } from 'react-router-dom';

/**
 * A button component that navigates back to a specified route when clicked.
 * <br><br>
 * <strong>handleClick:</strong> <br>
 * Plays a click sound effect using the `SoundManager` utility and navigates to the specified route.
 * <br><br>
 * @function BackButton
 * @param {string} [to='/'] - The route to navigate to when the button is clicked. Defaults to '/'.
 * @returns {JSX.Element} The rendered BackButton component.
 */
function BackButton({ to = '/' }) {
    const navigate = useNavigate();

    /**
     * Handles the click event on the back button.
     * Plays a click sound effect using the `SoundManager` utility and navigates to the specified route.
     */
    const handleClick = () => {
        SoundManager.playClickSound();
        navigate(to);
    };

    return (
        <button className="backBtn-style"
            style={{ backgroundImage: `url('/icons/back.svg')` }}
            onClick={handleClick}
        />
    );
}

export default BackButton;
