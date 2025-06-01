/**
 * ChatToggleButton.jsx — Controls the open/close state of the chat sidebar.
 *
 * Also displays visual indicators for pending friend requests and unread messages.
 * Dynamically adjusts its position based on whether the chat is open.
 */

/**
 * ChatToggleButton component function.
 *
 * Calculates unread messages and conditionally displays request and message indicators.
 * Allows users to toggle the visibility of the chat sidebar.
 *
 * @function ChatToggleButton
 * @param {Object} props - Component properties.
 * @param {boolean} props.isChatOpen - Whether the chat sidebar is currently open.
 * @param {Function} props.toggleChat - Callback to toggle the chat open/closed state.
 * @param {Array} props.pendingRequests - List of incoming friend requests.
 * @param {Array} props.friends - Friend list with unread message metadata.
 * @returns {JSX.Element} The rendered chat toggle button and notification bubbles.
 */
const ChatToggleButton = ({
    isChatOpen,
    toggleChat,
    pendingRequests,
    friends,
}) => {
    const unreadMessageCount = friends.reduce(
        (acc, f) => acc + (f.unreadCount || 0),
        0,
    );

    /**
     * Renders the toggle button layout and notifications.
     *
     * Includes:
     * - A toggle arrow button
     * - A red circle showing the number of friend requests
     * - A circle showing the count of unread messages
     * - All positioned relative to the sidebar's current state
     */
    return (
        <div
            className="chat-toggle-wrapper"
            style={{ left: isChatOpen ? '450px' : '0px' }}
        >
            <button className="chat-toggle-button" onClick={toggleChat}>
                {isChatOpen ? '<' : '>'}
            </button>

            {pendingRequests.length > 0 && (
                <div className="friend-request-circles">
                    <div className="circle-request">
                        {pendingRequests.length}
                    </div>
                </div>
            )}

            {unreadMessageCount > 0 && (
                <div className="unread-message-circles">
                    <div className="circle-msg">{unreadMessageCount}</div>
                </div>
            )}
        </div>
    );
};

export default ChatToggleButton;
