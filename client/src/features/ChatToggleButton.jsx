/**
 * @fileoverview Renders a button to toggle the chat sidebar.
 * <br><br>
 * This component displays a button that toggles the visibility of the chat sidebar.
 * It also shows the count of pending friend requests and unread messages from friends.
 * <br>
 * The button's position and style change based on whether the chat is open or closed.
 */

/** 
 * This component calculates the total number of unread messages from friends and displays it alongside the count of
 * pending friend requests.<br> The button's position is adjusted based on the `isChatOpen`
 * prop, allowing for a smooth transition when toggling the chat sidebar.
 * <br><br>
 * The unread message count is derived from the `friends` array, summing up the `unreadCount` property of each friend.<br>
 * If there are pending requests, a badge is displayed showing the number of requests.<br>
 * If there are unread messages, another badge displays the total count of unread messages.
 * <br><br>
 * The button itself toggles the chat sidebar when clicked, changing its label based on the current
 * state of the chat (open or closed).
 * <br>
 * The component uses Tailwind CSS classes for styling and positioning, ensuring a responsive design that adapts to different screen sizes.
 * <br>
 * The button's position is adjusted using CSS transforms, allowing for a smooth transition effect when the chat sidebar is toggled.
 * <br>
 * The component is designed to be reusable and can be easily integrated into any chat interface.
 * 
 * @function ChatToggleButton
 * @param {boolean} isChatOpen - Indicates if the chat sidebar is currently open.
 * @param {Function} toggleChat - Function to toggle the chat sidebar visibility. 
 * @param {Array} pendingRequests - List of pending friend requests.
 * @param {Array} friends - List of friends, each with an `unreadCount` property.
 * @returns {JSX.Element} The rendered chat toggle button with pending requests and unread messages count.<br>
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

    return (
        // Toggle Button Wrapper
        <div
            className={`chatToggleWrapper
                ${isChatOpen ? 
                    "translate-x-[23.5vw] sm:translate-x-[25vw] lg:translate-x-[43.5vw] xl:translate-x-[35vw] 2xl:translate-x-[25vw]" 
                : "translate-x-0"}    
            `}
        >
            {/* Toggle Button */}
            <button 
                className="chatToggleBtn" 
                onClick={toggleChat}
            >
                {isChatOpen ? '<' : '>'}
            </button>

            {/* Pending Requests Count */}
            {pendingRequests.length > 0 && (
                <div className="pendingRequestWrapper">
                    <div className="pendingRequest">
                        <span className="mb-[0.45px] sm:mb-[2.5px] lg:mb-[1px] xl:mb-[3px] 2xl:mb-[2.5px]">
                            {pendingRequests.length}
                        </span>
                    </div>
                </div>
            )}

            {/* Unread Messages Count */}
            {unreadMessageCount > 0 && (
                <div className="pendingMessagWrapper">
                    <div className="pendingMessage">
                        <span className="mb-[0.45px] sm:mb-[2.5px] lg:mb-[1px] xl:mb-[3px] 2xl:mb-[2.5px]">
                            {unreadMessageCount}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatToggleButton;
