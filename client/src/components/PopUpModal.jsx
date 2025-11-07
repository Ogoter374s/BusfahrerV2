/**
 * @fileoverview PopupModal Component
 * <br><br>
 * This component displays a modal popup with a title, message, and optional icon. <br>
 * It provides buttons for confirming or canceling the action, with sound effects for user interactions.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

/**
 * A modal popup component that displays a message with an optional icon and provides "OK" and "Cancel" buttons.
 * <br><br>
 * This component displays a modal popup with a title, message, and optional icon. <br>
 * It provides buttons for confirming or canceling the action, with sound effects for user interactions.
 * <br><br>
 * <strong>handleClose:</strong> <br>
 * This function is called when the user clicks the "OK" button. <br>
 * It plays a click sound and calls the `onOk` callback function.
 * <br><br>
 * <strong>handleCancel:</strong> <br>
 * This function is called when the user clicks the "Cancel" button. <br>
 * It plays a click sound and calls the `onCancel` callback function.
 * 
 * @function PopupModal
 * @param {boolean} isOpen - Whether the popup is currently open.
 * @param {string} title - The title of the popup.
 * @param {string} message - The message to display in the popup.
 * @param {JSX.Element} [icon] - An optional icon to display in the popup.
 * @param {function} onOk - Callback function to call when the "OK" button is clicked.
 * @param {function} onCancel - Callback function to call when the "Cancel" button is clicked.
 * @param {boolean} [useCancel=false] - Whether to show a "Cancel" button in the popup.
 * @returns {JSX.Element|null} The rendered PopupModal component or null if `isOpen` is false.
 */
function PopupModal({ isOpen, title, message, icon, onOk, onCancel, useCancel = false }) {
    if (!isOpen) return null;

    /**
     * Handles the "OK" button click event.
     * This function plays a click sound and calls the `onOk` callback function.
     */
    const handleClose = () => {
        SoundManager.playClickSound();
        onOk();
    };

    /**
     * Handles the "Cancel" button click event.
     * This function plays a click sound and calls the `onCancel` callback function.
     */
    const handleCancel = () => {
        SoundManager.playClickSound();
        onCancel();
    };

    return (
        // Popup background
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[9999]">

            {/* Popup Wrapper */}
            <div className="popup-wrapper">

                {/* Title and Icon */}
                <div className="popup-header">
                    {icon && <span className="
                        text-[1.6rem] sm:text-[1rem] lg:text-[2rem] 2xl:text-[2.5rem]
                    ">
                        {icon}
                    </span>}
                    <h2 className="
                        font-semibold
                        text-[1.6rem] sm:text-[1rem] lg:text-[2rem] 2xl:text-[2.5rem]
                    ">
                        {title}
                    </h2>
                </div>

                {/* Message */}
                <p className="
                    text-[1.2rem] sm:text-[0.7rem] lg:text-[1.35rem] 2xl:text-[1.75rem]
                ">
                    {message}
                </p>

                {/* Action Buttons */}
                <div className="
                    flex items-center justify-center gap-4"
                >

                    {/* "OK" Button */}
                    <button 
                        className="popup-btn bg-[#00c4ff]" 
                        onClick={handleClose}
                    >
                        OK
                    </button>

                    {/* "Cancel" Button (optional) */}
                    {useCancel && (
                        <button 
                            className="popup-btn bg-[#c0392b]" 
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PopupModal;