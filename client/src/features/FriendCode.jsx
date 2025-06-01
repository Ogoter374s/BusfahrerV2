/**
 * FriendCode.jsx — Displays the current user's friend code with copy-to-clipboard functionality.
 *
 * Allows the user to share their friend code by clicking a clipboard icon.
 * Includes a sound effect to enhance feedback on interaction.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

/**
 * FriendCode component function.
 *
 * Renders the user's friend code along with a button to copy it to the clipboard.
 * Triggers a click sound when the copy action is performed.
 *
 * @function FriendCode
 * @param {Object} props - Component properties.
 * @param {string} props.userFriendCode - The current user's unique friend code.
 * @returns {JSX.Element} The rendered friend code display with copy support.
 */
const FriendCode = ({ userFriendCode }) => {
    /**
     * Plays a UI sound effect on interaction.
     *
     * Used to give feedback when the user clicks the clipboard icon.
     */
    const playClickSound = () => SoundManager.playClickSound();

    /**
     * Handles copying the friend code to the clipboard.
     *
     * Plays a sound effect and copies the provided friend code text
     * to the system clipboard using the Clipboard API.
     */
    const copyToClipboard = () => {
        playClickSound();
        navigator.clipboard.writeText(userFriendCode);
    };

    /**
     * Renders the friend code and clipboard icon layout.
     *
     * Displays the code in styled text and binds the icon's click
     * event to trigger the clipboard copy action.
     */
    return (
        <div className="friend-code-display">
            <p>
                Your Friend Code: <span>{userFriendCode}</span>
            </p>
            <img
                src="/clipboard.png"
                alt="Copy to clipboard"
                className="clipboard-icon"
                onClick={copyToClipboard}
            />
        </div>
    );
};

export default FriendCode;
