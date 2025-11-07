/**
 * @fileoverview FriendMessages component that displays messages between the user and a selected friend.
 * <br><br>
 * This component fetches the messages for the selected friend from the friends list. <br>
 * Scrolls to the bottom when new messages are added and displays a message if no friend is selected
 * or if there are no messages for the selected friend.
 */

import {useEffect, useRef} from 'react';

/**
 * A component that displays messages between the user and a selected friend.<br>
 * It fetches the messages for the selected friend from the friends list. <br>
 * Scrolls to the bottom when new messages are added and displays a message if no friend is selected or if there are no messages for the selected friend.
 * <br> <br>
 * <strong>useEffect:</strong> <br>
 * - Scrolls to the bottom of the messages when new messages are added.<br>
 * - If no friend is selected, displays a message prompting the user to select a friend.<br>
 * - If no messages exist for the selected friend, displays a message indicating that there are no messages yet.<br>
 * 
 * @function FriendMessages
 * @param {Array} friends - The list of friends with their messages.
 * @param {string} selectedFriend - The userId of the currently selected friend.
 * @returns {JSX.Element} The rendered FriendMessages component.
 */
const FriendMessages = ({ friends, selectedFriend }) => {
    const currentFriend = friends.find((f) => f.userId === selectedFriend);
    const messageEndRef = useRef(null);

    /**
     * Scrolls to the bottom of the messages when new messages are added.
     * If no friend is selected, displays a message prompting the user to select a friend.
     * If no messages exist for the selected friend, displays a message indicating that there are no messages yet.
     */
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [currentFriend?.messages]);

    // If no friend is selected, display a message
    if (!selectedFriend) {
        return (
            <p className="friendMessages-txt">
                Select a friend to view messages.
            </p>
        );
    }

    // If no messages exist for the selected friend, display a message
    if (!currentFriend || !currentFriend.messages?.length) {
        return <p className="friendMessages-txt">
                    No messages yet.
                </p>;
    }

    return (
        // Display messages for the selected friend
        <div className="friendMessages-wrapper">
            {currentFriend.messages.map((msg, index) => (

                // Display each message
                <p
                    key={index}
                    className={`friendMessages-item
                        ${msg.name === 'You'
                            ? 'self-end bg-[#007bff] text-white text-right'
                            : 'self-start bg-[#444] text-white text-left'
                        }
                    `}
                >
                    <strong>{msg.name}:</strong> {msg.message}
                </p>
            ))}
            
            {/* Scroll target */}
            <div ref={messageEndRef} />
        </div>
    );
};

export default FriendMessages;
