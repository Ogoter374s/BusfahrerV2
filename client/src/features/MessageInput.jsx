/**
 * @fileoverview MessageInput component for sending messages in a chat application.
 * <br><br>
 * This component includes an input field for typing messages and handles sending messages on pressing the Enter key.
 */

/**
 * A component that provides an input field for sending messages in a chat application.
 * <br> <br>
 * <strong>handleKeyDown:</strong> <br>
 * - A function that listens for the Enter key press to send the message and clear the input field.
 * 
 * @function MessageInput
 * @param {string} value - The current value of the input field.
 * @param {Function} setValue - Function to update the input field value.
 * @param {Function} onSend - Function to call when the message is sent.
 * @returns {JSX.Element} The rendered MessageInput component.
 */
const MessageInput = ({ value, setValue, onSend }) => {

    /**
     * Function to handle key down events in the input field.
     * It checks if the Enter key is pressed, and if so, calls the onSend function
     * and clears the input field.
     */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSend();
            setValue('');
        }
    };

    return (
        // Input field for sending messages
        <input
            type="text"
            placeholder="Type a message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="message-input"
        />
    );
};

export default MessageInput;
