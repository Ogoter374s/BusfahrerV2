/**
 * @fileoverview Chat Messages Component
 * <br><br>
 * This component displays a list of chat messages. <br>
 * It automatically scrolls to the latest message when new messages are added.
 */

// React
import { useRef, useEffect } from 'react';

/**
 * A component that displays a list of chat messages. <br>
 * It automatically scrolls to the latest message when new messages are added.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This hook is used to scroll to the latest message whenever the `messages` prop changes.
 * <br><br>
 * 
 * @function ChatMessages
 * @param {Array} messages - An array of message objects, each containing `name` and `message` properties.
 * @returns {JSX.Element} The rendered chat messages component.
 */
const ChatMessages = ({messages}) => {
    const messageEndRef = useRef(null);

    /**
     * Scrolls to the latest message whenever the `messages` prop changes.
     * This ensures that the most recent message is always visible to the user.
     */
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Renders a message indicating that there are no lobby messages yet if the `messages` array is empty.    
    if (messages?.length == 0) {
        return (
            <p className="chatMessages-txt">
                No lobby messages yet.
            </p>
        );
    }

    return (
        <div className="chatMessages-wrapper">
            {messages.map((msg, index) => (
                <p
                    key={index}
                    className="chatMessages-item"
                >
                    <strong>{msg.name}:</strong> {msg.message}
                </p>
            ))}

            {/* Scroll target */}
            <div ref={messageEndRef} />
        </div>
    );
};

export default ChatMessages;