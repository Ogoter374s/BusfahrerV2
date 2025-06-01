/**
 * Renders the friend list layout.
 *
 * Displays each friend's avatar, username, and unread message count.
 * Includes a remove button that prevents event bubbling to avoid unintended chat opening.
 */

/**
 * FriendMessages component function.
 *
 * Determines the selected friend and retrieves their associated messages.
 * Conditionally renders a prompt, empty state, or formatted chat history.
 *
 * @function FriendMessages
 * @param {Object} props - Component properties.
 * @param {Array} props.friends - List of all friend objects, each possibly containing message history.
 * @param {string|null} props.selectedFriend - The userId of the currently selected friend.
 * @returns {JSX.Element} The rendered message view or appropriate placeholder text.
 */
const FriendMessages = ({ friends, selectedFriend }) => {
    const currentFriend = friends.find((f) => f.userId === selectedFriend);

    if (!selectedFriend) {
        return (
            <p className="message-area">Select a friend to view messages.</p>
        );
    }

    if (!currentFriend || !currentFriend.messages?.length) {
        return <p className="message-area">No messages yet.</p>;
    }

    /**
     * Renders conditional messaging states.
     *
     * - Displays a prompt if no friend is selected.
     * - Shows a "no messages" note if the selected friend has no messages.
     * - Otherwise, renders all messages with appropriate styling for sent vs. received.
     */
    return (
        <div className="message-area">
            {currentFriend.messages.map((msg, index) => (
                <p
                    key={index}
                    className={msg.name === 'You' ? 'sent' : 'received'}
                >
                    <strong>{msg.name}:</strong> {msg.message}
                </p>
            ))}
        </div>
    );
};

export default FriendMessages;
