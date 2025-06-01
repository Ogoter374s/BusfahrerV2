/**
 * FriendRequestList.jsx — Displays a list of incoming friend requests with accept and decline options.
 *
 * Plays a sound effect on interaction and handles friend request resolution via API calls.
 * Renders only when there are pending requests.
 */

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';

/**
 * FriendRequestList component function.
 *
 * Shows each pending friend request with the sender’s name and action buttons.
 * Handles request acceptance or decline with backend communication.
 *
 * @function FriendRequestList
 * @param {Object} props - Component properties.
 * @param {Array} props.pendingRequests - List of friend request objects awaiting user action.
 * @returns {JSX.Element|null} The rendered list of requests or null if none are pending.
 */
const FriendRequestList = ({ pendingRequests }) => {
    if (!pendingRequests || pendingRequests.length === 0) return null;

    /**
     * Plays a UI sound effect for request interactions.
     *
     * Triggered when either accepting or declining a request.
     */
    const playClickSound = () => SoundManager.playClickSound();

    /**
     * Accepts a friend request.
     *
     * Sends a POST request to the backend to confirm the friend connection.
     *
     * @param {string} userId - The user ID of the requester to accept.
     */
    const handleAccept = async (userId) => {
        playClickSound();
        await fetch(`${BASE_URL}accept-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId }),
        });
    };

    /**
     * Declines a friend request.
     *
     * Sends a POST request to remove or reject the incoming request.
     *
     * @param {string} userId - The user ID of the requester to decline.
     */
    const handleDecline = async (userId) => {
        playClickSound();
        await fetch(`${BASE_URL}decline-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId }),
        });
    };

    /**
     * Renders the list of friend request items.
     *
     * Displays the requester's username and action buttons for each request in the list.
     */
    return (
        <div className="pending-requests">
            {pendingRequests.map((request, index) => (
                <div key={index} className="friend-request">
                    <span className="request-text">
                        {request.username} wants to be friends
                    </span>
                    <div className="request-actions">
                        <button
                            className="accept-btn"
                            onClick={() => handleAccept(request.userId)}
                        >
                            ✔
                        </button>
                        <button
                            className="decline-btn"
                            onClick={() => handleDecline(request.userId)}
                        >
                            ✖
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FriendRequestList;
