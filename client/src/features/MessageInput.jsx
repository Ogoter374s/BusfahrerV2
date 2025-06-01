/**
 * Renders the list of friend request items.
 *
 * Displays the requester's username and action buttons for each request in the list.
 */

/**
 * MessageInput component function.
 *
 * Renders an input field bound to the current message value and provides interaction handlers.
 * Sends the message via the provided callback when the Enter key is pressed.
 *
 * @function MessageInput
 * @param {Object} props - Component properties.
 * @param {string} props.value - Current value of the input field.
 * @param {Function} props.setValue - State updater for the input value.
 * @param {Function} props.onSend - Callback function to send the message.
 * @returns {JSX.Element} The rendered message input field.
 */
const MessageInput = ({ value, setValue, onSend }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSend();
            setValue('');
        }
    };

    /**
     * Renders the chat input field.
     *
     * Allows users to type a message, update state, and trigger sending on key press.
     */
    return (
        <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
        />
    );
};

export default MessageInput;
