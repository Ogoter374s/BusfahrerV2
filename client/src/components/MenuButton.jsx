/**
 * MenuButton.jsx — A reusable button component for the game's menu system.
 *
 * Supports styled buttons with optional icons, text, routing, and click handlers.
 * Plays a UI click sound and performs navigation or a custom action when clicked.
 * Can optionally render plain text instead of a paragraph tag when `textOnly` is enabled.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useNavigate } from 'react-router-dom';

/**
 * MenuButton component function.
 *
 * Renders a styled interactive button based on provided props.
 * Plays a sound, optionally invokes a callback, and performs route navigation when clicked.
 *
 * @function MenuButton
 * @param {Object} props - Component properties.
 * @param {string} props.wrapperClass - Class applied to the outer container.
 * @param {string} props.buttonClass - Class applied to the button element.
 * @param {string} [props.icon] - Optional path to an icon image.
 * @param {string} [props.alt] - Alt text for the icon image.
 * @param {string} [props.text] - Text to display inside the button.
 * @param {boolean} [props.disabled=false] - Whether the button should be disabled.
 * @param {string} [props.to] - Optional route to navigate to on click.
 * @param {Function} [props.onClick] - Optional custom click handler.
 * @param {boolean} [props.textOnly=false] - If true, renders plain text instead of a <p> element.
 * @returns {JSX.Element} The rendered button wrapped in its container.
 */
function MenuButton({
    wrapperClass,
    buttonClass,
    icon,
    alt,
    text,
    disabled = false,
    to,
    onClick,
    textOnly = false,
}) {
    const navigate = useNavigate();

    /**
     * Handles the button's click behavior.
     *
     * Plays a UI sound using the SoundManager, calls the optional `onClick` callback,
     * and navigates to the specified route if the `to` prop is provided.
     */
    const handleClick = () => {
        SoundManager.playClickSound();
        if (onClick) onClick();
        if (to) navigate(to);
    };

    /**
     * Renders the menu button element.
     *
     * Constructs a styled button that includes:
     * - An optional icon image
     * - A text label (either plain or wrapped in a <p> tag depending on `textOnly`)
     * - Disabled state handling
     */
    const button = (
        <button
            className={buttonClass}
            onClick={handleClick}
            disabled={disabled}
        >
            {icon && (
                <img src={icon} alt={alt} className={`${buttonClass}-icon`} />
            )}
            {text &&
                (textOnly ? (
                    text
                ) : (
                    <p className={`btn-text-${buttonClass.split('-')[1]}`}>
                        {text}
                    </p>
                ))}
        </button>
    );

    /**
     * Wraps the button in a container if `wrapperClass` is provided.
     *
     * If `wrapperClass` is not set to "none", wraps the button in a <div> with the given class.
     * Otherwise, returns the button element directly without a wrapper.
     */
    return wrapperClass !== 'none' ? (
        <div className={wrapperClass}>{button}</div>
    ) : (
        button
    );
}

export default MenuButton;
