/**
 * AvatarIcon.jsx — Reusable component for rendering player or user avatars.
 *
 * Supports local avatars with sound effects, customizable styling, and remote or preset image sources.
 * Used throughout the interface to represent users with optional interactivity.
 */

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from "../utils/soundManager";

/**
 * Avatar component function.
 *
 * Renders an avatar image with customizable source, alt text, and optional click behavior.
 * Automatically prefixes image paths unless already absolute or local.
 *
 * @function Avatar
 * @param {Object} props - Component properties.
 * @param {string} props.src - Image source path or URL.
 * @param {string} [props.name="Avatar"] - Name for alt text accessibility.
 * @param {boolean} [props.isLocal=false] - Whether this is the local player's avatar.
 * @param {Function} [props.onClick] - Optional click handler for interactivity.
 * @param {string} [props.className] - Custom CSS class for styling override.
 * @returns {JSX.Element} The rendered avatar image element.
 */
const Avatar = ({ src, name = "Avatar", isLocal = false, onClick, className }) => {

    /**
     * handleClick — Handles click events on the avatar.
     *
     * Plays a UI click sound if the avatar belongs to the local user,
     * and invokes a custom callback if provided.
     *
     * @function handleClick
     */
    const handleClick = () => {
        if (isLocal) SoundManager.playClickSound();
        if (onClick) onClick();
    };

    const imageSrc = src.startsWith("http") || src.startsWith("/") ? src : `${BASE_URL}avatars/${src}`;
    const cssClass = className || (isLocal ? "avatar" : "player-avatar");

    /**
     * Renders the avatar image element.
     *
     * Displays the avatar with resolved source, accessibility alt text,
     * styling class, and an optional click handler.
     * Prevents the image from being dragged to maintain layout integrity.
     */
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