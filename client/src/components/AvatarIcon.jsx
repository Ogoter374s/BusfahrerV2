/**
 * @fileoverview Avatar Component
 * <br><br>
 * This component displays a user's avatar image. <br>
 * It supports both local and remote images, with optional click handling and styling.
 */

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from "../utils/soundManager";

/**
 * A component that displays a user's avatar image. <br>
 * It supports both local and remote images, with optional click handling and styling.
 * <br><br>
 * <strong>handleClick:</strong> <br>
 * This function is called when the avatar image is clicked. <br>
 * If the avatar is local, it plays a click sound. <br>
 * If an `onClick` handler is provided, it calls that function as well.
 * <br><br>
 * 
 * @function Avatar
 * @param {string} src - The source URL or filename of the avatar image.
 * @param {string} [name="Avatar"] - The name of the user, used for the alt text.
 * @param {boolean} [isLocal=false] - Whether the avatar image is a local file.
 * @param {function} [onClick] - Optional click handler function.
 * @param {string} [className] - Optional CSS class for styling the avatar image.
 * @returns {JSX.Element} The rendered avatar image component.
 */
const Avatar = ({ src, name = "Avatar", isLocal = false, onClick, className }) => {
    if(!src) return null;

    /**
     * Handles the click event on the avatar image.
     * If the avatar is local, it plays a click sound.
     * If an `onClick` handler is provided, it calls that function as well.
     */
    const handleClick = () => {
        if (isLocal) SoundManager.playClickSound();
        if (onClick) onClick();
    };

    const imageSrc = src.startsWith("http") || src.startsWith("/") ? src : `${BASE_URL}avatars/${src}`;
    const cssClass = className || (isLocal ? "avatar" : "player-avatar");

    return (
        <img
            src={imageSrc}
            alt={`${name}'s Avatar`}
            className={cssClass}
            onClick={handleClick}
            draggable="false"
        />
    );
};

export default Avatar;