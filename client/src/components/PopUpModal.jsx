/**
 * PopUpModal.jsx — Reusable modal component for displaying alerts or informational popups.
 *
 * Shows a message with a title, optional icon, and confirmation button.
 * Only renders when the `isOpen` prop is true.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

/**
 * PopupModal component function.
 *
 * Renders a styled popup overlay containing a header, message body, and "OK" button.
 * Designed to be used for user notifications, confirmations, or alerts.
 *
 * @function PopupModal
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {string} props.title - Title text to display in the modal header.
 * @param {string} props.message - Message content displayed in the modal body.
 * @param {JSX.Element|string} [props.icon] - Optional icon or visual element for the header.
 * @param {Function} props.onClose - Callback function triggered when the "OK" button is clicked.
 * @returns {JSX.Element|null} The rendered modal or null if not open.
 */
function PopupModal({ isOpen, title, message, icon, onClose }) {
    if (!isOpen) return null;

    /**
     * Handles the OK button click: plays sound and closes the modal.
     */
    const handleClose = () => {
        SoundManager.playClickSound();
        onClose();
    };

    /**
     * Renders the modal layout conditionally.
     *
     * If `isOpen` is false, nothing is rendered.
     * When open, displays a centered overlay with structured content and dismiss interaction.
     */
    return (
        <div className="popup-overlay">
            <div className="popup-box">
                <div className="popup-header">
                    {icon && <span className="popup-icon">{icon}</span>}
                    <h2>{title}</h2>
                </div>
                <p className="popup-message">{message}</p>
                <button className="popup-button" onClick={handleClose}>
                    OK
                </button>
            </div>
        </div>
    );
}

export default PopupModal;
