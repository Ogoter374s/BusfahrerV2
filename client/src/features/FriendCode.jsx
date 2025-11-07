/**
 * @fileoverview FriendCode component that displays the user's friend code and allows copying it to the clipboard.
 * <br><br>
 * This component includes a function to play a click sound when the friend code is copied
 * and a button to copy the friend code to the clipboard.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

/**
 * A component that displays the user's friend code and allows copying it to the clipboard.
 * <br> <br>
 * <strong>playClickSound:</strong> <br>
 * - A function that plays a click sound when the friend code is copied.
 * <br> <br>
 * <strong>copyToClipboard:</strong> <br>
 * - A function that copies the user's friend code to the clipboard and plays a click sound.
 * 
 * @function FriendCode
 * @param {string} userFriendCode - The user's friend code to be displayed and copied.
 * @returns {JSX.Element} The rendered FriendCode component.
 */
const FriendCode = ({ userFriendCode }) => {
    
    // Function to play a click sound
    const playClickSound = () => SoundManager.playClickSound();

    /**
     * Function to copy the user's friend code to the clipboard.
     * It plays a click sound when the code is copied.
     */
    const copyToClipboard = () => {
        playClickSound();
        navigator.clipboard.writeText(userFriendCode);
    };

    return (
        // Display the user's friend code and a button to copy it to the clipboard
        <div className="friendCode-wrapper">

            {/* Display the friend code with a bold style */}
            <p>
                Your Friend Code: <span className="text-[#c49a6c] font-bold"> {userFriendCode} </span>
            </p>

            {/* Button to copy the friend code to clipboard */}
            <img
                src="/chatSidebar/clipboard.png"
                alt="Copy to clipboard"
                onClick={copyToClipboard}
                className="friendCode-img"/>
        </div>
    );
};

export default FriendCode;
