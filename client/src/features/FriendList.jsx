/**
 * FriendList.jsx — Displays a list of the user's friends with avatars, usernames, and message notifications.
 *
 * Enables selection for chat initiation and removal of friends via a confirmation prompt.
 * Shows an unread message count indicator per friend.
 */

// Components
import PopupModal from "../components/PopUpModal";

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from "../utils/popupManager";

// React
import { useState, useEffect } from 'react';

/**
 * FriendList component function.
 *
 * Maps over the provided list of friends to render clickable friend items.
 * Allows selecting a friend to fetch messages and removing a friend via backend request.
 *
 * @function FriendList
 * @param {Object} props - Component properties.
 * @param {Array} props.friends - Array of friend objects to display.
 * @param {Function} props.onSelect - Callback triggered when a friend is selected.
 * @returns {JSX.Element} The rendered list of friends.
 */
const FriendList = ({ friends, onSelect }) => {
    const [popup, setPopup] = useState(PopupManager.defaultPopup);
    
    useEffect(() => {
        PopupManager.initPopupManager(setPopup);
    }, []);

    /**
     * Plays a UI click sound for interaction feedback.
     *
     * Called before actions such as removing a friend.
     */
    const playClickSound = () => SoundManager.playClickSound();

    /**
     * Sends a request to remove a friend.
     *
     * Asks for confirmation, then sends a POST request to the backend.
     * Alerts the user if the request fails.
     *
     * @param {string} friendId - The ID of the friend to remove.
     */
    const removeFriend = async (friendId) => {
        playClickSound();
        if (!window.confirm('Are you sure you want to remove this friend?'))
            return;

        const res = await fetch(`${BASE_URL}remove-friend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId }),
        });

        const data = await res.json();
        if (!res.ok) {
            PopupManager.showPopup({
                title: "Remove Friend", 
                message: data.error, 
                icon: '❌'
            });
        }
    };

    /**
     * Renders the friend list layout.
     *
     * Displays each friend's avatar, username, and unread message count.
     * Includes a remove button that prevents event bubbling to avoid unintended chat opening.
     */
    return (
        <>
            <div className="friend-list">
                {friends.map((friend) => (
                    <div
                        key={friend.userId}
                        className="friend"
                        onClick={() => onSelect(friend.userId)}
                    >
                        <div className="friend-info">
                            <img
                                src={`${BASE_URL}avatars/${friend.avatar}`}
                                alt="Avatar"
                                className="friend-avatar"
                            />
                            <p className="friend-text">{friend.username}</p>
                            {friend.unreadCount > 0 && (
                                <span className="unread-indicator">
                                    {friend.unreadCount}
                                </span>
                            )}
                        </div>
                        <button
                            className="remove-friend-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFriend(friend.userId);
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={PopupManager.closePopup}
            />
        </>
    );
};

export default FriendList;
