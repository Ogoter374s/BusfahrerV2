/**
 * @fileoverview MenuButton component for rendering buttons in the menu.
 * <br><br>
 * This component is used to create buttons with customizable styles, icons, and text.
 * It supports navigation to different routes and can handle click events with sound effects.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useNavigate } from 'react-router-dom';

/**
 * MenuButton component renders a customizable button with an icon and text.
 * <br>
 * It can be used for navigation or to trigger actions with sound effects.
 * <br><br>
 * <strong>handleClick:</strong> <br>
 * This function is called when the button is clicked. It plays a click sound using the SoundManager utility. <br>
 * If a `to` prop is provided, it navigates to the specified route using the `useNavigate` hook from React Router. <br>
 * If an `onClick` function is provided, it will be called before navigation.
 * 
 * @function MenuButton
 * @param {string} [wrapper] - Whether to wrap the button in a div.
 * @param {string} [wrapperClass] - Class for the wrapper div if `wrapper` is true.
 * @param {string} [buttonClass] - Class for the button element.
 * @param {string} [textClass] - Class for the text inside the button.
 * @param {string} icon - The icon to display on the button, without the file extension.
 * @param {string} text - The text to display on the button.
 * @param {boolean} [disabled=false] - Whether the button is disabled.
 * @param {string} [to] - Optional route to navigate to when the button is clicked.
 * @param {Function} [onClick] - Optional function to call when the button is clicked.
 * @returns {JSX.Element} The rendered MenuButton component.
 */
function MenuButton({
    wrapperClass,
    wrapper,
    buttonClass,
    textClass,
    icon,
    text,
    disabled = false,
    to,
    onClick,
    textOnly = false
}) {
    const navigate = useNavigate();

    /**
     * Handles the button click event.
     * Plays a click sound and navigates to the specified route if provided.
     * If an `onClick` function is provided, it will be called before navigation.
     */
    const handleClick = () => {
        SoundManager.playClickSound();
        if (onClick) onClick();
        if (to) navigate(to);
    };

    /**
     * Renders the button element with the specified classes, icon, and text.
     * The button's background image is set to the specified icon.
     * If the icon is "x", it applies a different class for styling.
     * The button is disabled if the `disabled` prop is true.
     */
    const button = (
        <button
            className={`relative flex items-center justify-center ${!disabled ? 'hover:scale-105' : ''} ${buttonClass}`}
            onClick={handleClick}
            disabled={disabled}
        >
            {icon && (
                <img
                    src={`/components/${icon}.svg`}
                    alt="button"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable="false"
                />
            )}
            {text && (
                <span className={`relative z-10 ${textClass} ${textOnly ? '' : "pointer-events-none"}`}>
                    {textOnly ? text : (
                        <p>{text}</p>
                    )}
                </span>
            )}
        </button>
    );

    return wrapper !== false ? (
        <div className={`${wrapperClass} "btn-container"`}>
            {button}
        </div>
    ) : (
        button
    );
}

export default MenuButton;
