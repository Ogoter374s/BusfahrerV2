import BASE_URL, { WBS_URL } from './config';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Create() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendCode, setFriendCode] = useState('');
    const [userFriendCode, setUserFriendCode] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [selectedChat, setSelectedChat] = useState('');
    const selectedFriend = useRef('');

    const [gameName, setGameName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [gender, setGender] = useState('Male');

    const navigate = useNavigate();
    const wsRef = useRef(null);
    const init = useRef(false);

    /**
     * Fetches the user's selected click sound preference.
     *
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio source accordingly.
     * Uses HttpOnly cookies for authentication.
     *
     * @function fetchSoundPreference
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchSoundPreference = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-click-sound`, {
                credentials: 'include',
            });

            const data = await response.json();

            setSelectedSound(data.sound);
            soundRef.current.src = `/sounds/${data.sound}`;
        } catch (error) {
            console.error('Error fetching sound preference:', error);
        }
    };

    // #region Friend Functions

    /**
     * Fetches pending friend requests for the authenticated user.
     *
     * Sends a GET request to the backend endpoint `/get-friend-requests`
     * using HttpOnly cookies for authentication. Updates the local state
     * with the list of pending friend requests.
     *
     * @function fetchFriendRequests
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchFriendRequests = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-friend-requests`, {
                credentials: 'include',
            });
            const data = await response.json();
            setPendingRequests(data.pending || []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    /**
     * Fetches the list of friends for the authenticated user.
     *
     * Sends a GET request to the backend endpoint `/get-friends`
     * using HttpOnly cookies for authentication. Updates the local state
     * with the list of friends retrieved from the server.
     *
     * @function fetchFriends
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchFriends = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-friends`, {
                credentials: 'include',
            });
            const data = await response.json();
            setFriends(data.friends || []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    /**
     * Fetches the user's unique friend code.
     *
     * Sends a GET request to the backend endpoint `/get-friend-code`
     * using HttpOnly cookies for authentication. Updates the local state
     * with the retrieved friend code.
     *
     * @function fetchUserFriendCode
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchUserFriendCode = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-friend-code`, {
                credentials: 'include',
            });
            const data = await response.json();
            setUserFriendCode(data.friendCode);
        } catch (error) {
            console.error('Error fetching friend code:', error);
        }
    };

    // #endregion

    useEffect(() => {
        if (init.current) return;
        init.current = true;

        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            wsRef.current = new WebSocket(WBS_URL);

            wsRef.current.onopen = () => {
                wsRef.current.send(JSON.stringify({ type: 'account' }));
            };

            wsRef.current.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'friendsUpdate') {
                    setFriends(message.data.friends);
                    setPendingRequests(message.data.pendingRequests);
                    setUserFriendCode(message.data.friendCode);
                }
            };
        }

        fetchFriendRequests();
        fetchFriends();
        fetchUserFriendCode();

        fetchSoundPreference();

        window.addEventListener('beforeunload', () => {
            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        });

        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, []);

    /**
     * Plays a cloned instance of the selected click sound effect.
     *
     * Clones the current audio element to allow overlapping playback,
     * resets the clone's playback position, and plays the sound.
     * Useful for rapid or repeated click feedback without delay.
     *
     * @function playClickSound
     */
    const playClickSound = () => {
        const clickClone = soundRef.current.cloneNode();
        clickClone.currentTime = 0;
        clickClone.play();
    };

    // #region Chat Functions

    /**
     * Toggles the visibility of the chat window.
     *
     * Plays a click sound and switches the chat open/close state.
     *
     * @function toggleChat
     */
    const toggleChat = () => {
        playClickSound();
        setIsChatOpen(!isChatOpen);
    };

    /**
     * Sends a friend request to another user using their friend code.
     *
     * Validates that the input is not empty, then sends a POST request to the backend
     * endpoint `/send-friend-request` with the friend code in the request body.
     * On success, notifies the user and clears the input field.
     * On failure, displays an error message.
     *
     * @function sendFriendRequest
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const sendFriendRequest = async () => {
        if (!friendCode.trim()) return;

        playClickSound();

        try {
            const response = await fetch(`${BASE_URL}send-friend-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendCode }),
                credentials: 'include',
            });

            const data = await response.json();
            if (response.ok) {
                alert('Friend request sent!');
                setFriendCode('');
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error sending request:', error);
        }
    };

    /**
     * Accepts a pending friend request from a specific user.
     *
     * Sends a POST request to the backend endpoint `/accept-friend-request`
     * with the user ID in the request body. If successful, the friend is added;
     * otherwise, an error message is displayed.
     *
     * @function acceptRequest
     * @async
     * @param {string} userId - The ID of the user whose friend request is being accepted.
     * @throws {Error} If the fetch operation fails.
     */
    const acceptRequest = async (userId) => {
        playClickSound();
        try {
            const response = await fetch(`${BASE_URL}accept-friend-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
            alert('Failed to accept friend request. Please try again.');
        }
    };

    /**
     * Declines a pending friend request from a specific user.
     *
     * Sends a POST request to the backend endpoint `/decline-friend-request`
     * with the user ID in the request body. If the request fails, an error message is shown.
     *
     * @function declineRequest
     * @async
     * @param {string} userId - The ID of the user whose friend request is being declined.
     * @throws {Error} If the fetch operation fails.
     */
    const declineRequest = async (userId) => {
        playClickSound();
        try {
            const response = await fetch(`${BASE_URL}decline-friend-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error declining friend request:', error);
            alert('Failed to decline friend request. Please try again.');
        }
    };

    /**
     * Removes a friend from the user's friend list.
     *
     * Prompts the user for confirmation before proceeding.
     * Sends a POST request to the backend endpoint `/remove-friend`
     * with the friend's ID in the request body. Displays an error
     * message if the operation fails.
     *
     * @function removeFriend
     * @async
     * @param {string} friendId - The ID of the friend to be removed.
     * @throws {Error} If the fetch operation fails.
     */
    const removeFriend = async (friendId) => {
        playClickSound();
        if (!window.confirm('Are you sure you want to remove this friend?'))
            return;

        try {
            const response = await fetch(`${BASE_URL}remove-friend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friendId }),
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error removing friend:', error);
            alert('Something went wrong.');
        }
    };

    /**
     * Fetches messages for a selected friend and marks them as read.
     *
     * Updates the selected chat state and stores the selected friend's ID.
     * Sends a POST request to the backend endpoint `/mark-messages-read` to
     * update the read status of messages. Then refreshes the friend list to
     * reflect updated message indicators.
     *
     * @function fetchMessages
     * @async
     * @param {string} friendId - The ID of the friend whose messages are being fetched.
     * @throws {Error} If the fetch operation fails.
     */
    const fetchMessages = async (friendId) => {
        playClickSound();

        selectedFriend.current = friendId;
        setSelectedChat(friendId);

        try {
            await fetch(`${BASE_URL}mark-messages-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friendId }),
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }

        fetchFriends();
    };

    /**
     * Sends a chat message to the selected friend.
     *
     * Validates that the message input is not empty. Sends a POST request to
     * the backend endpoint `/send-message` with the selected friend's ID and
     * the message content. Clears the input field on success, or displays an
     * error message on failure.
     *
     * @function sendMessage
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch(`${BASE_URL}send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    friendId: selectedFriend.current,
                    message: newMessage,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setNewMessage('');
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // #endregion

    /**
     * Creates a new game by sending the game details to the backend API.
     *
     * Sends a POST request with the game details, using HttpOnly cookie authentication.
     * Redirects the user to the new game page upon successful creation.
     * Alerts the user if authentication fails or if there's an error creating the game.
     * Limits game name length to a maximum of 16 characters.
     */
    const createGame = async () => {
        playClickSound();
        if (!gameName || gameName.trim() === '') {
            alert('Please provide a valid game name.');
            return;
        }

        if (!playerName || playerName.trim() === '') {
            alert('Please provide a valid player name.');
            return;
        }

        const trmGameName = gameName.trim().slice(0, 16);
        const trmPlayerName = playerName.trim().slice(0, 26);

        try {
            const response = await fetch(`${BASE_URL}create-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    gameName: trmGameName,
                    playerName: trmPlayerName,
                    isPrivate,
                    gender,
                }),
            });

            const data = await response.json();
            if (data.success) {
                navigate(`/game/${data.gameId}`);
            } else {
                alert('Failed to create the game.');
            }
        } catch (error) {
            console.error('Unexpected error creating the game:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="overlay-cont">
            {/* Background decorative overlay image */}
            <img src="overlay_account.svg" alt="Overlay" className="overlay-img" />

            {/* Container for creating a new game session */}
            <div className="create-menu">
                <div className="create-form-box">

                    {/* Game session title and branding logo */}
                    <img src="logo.svg" alt="Game Logo" className="create-logo" />
                    <h1 className="create-title">
                        Play
                        <span className="highlight">Game</span>
                    </h1>

                    {/* Form inputs for game and player details */}
                    <div className="rustic-form">
                        {/* Input for the game name */}
                        <input
                            type="text"
                            placeholder="Game Name"
                            className="rustic-input"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                        />

                        {/* Input for player's display name */}
                        <input
                            type="text"
                            placeholder="Player Name"
                            className="rustic-input"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                        />

                        {/* Gender selection dropdown */}
                        <label className="rustic-label">Gender:</label>
                        <select
                            className="gender-select"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Divers">Divers</option>
                        </select>

                        {/* Checkbox for marking game as private or public */}
                        <label className="rustic-checkbox">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={() => setIsPrivate(!isPrivate)}
                            />
                            Private Game
                        </label>
                    </div>
                </div>

                <div className="create-options-box">
                    <h2 className="create-options-title">Game Options</h2>
    
                    {/* Game options selection */}
                </div>
            </div>

            {/* Button to create the game */}
            <div className="create-cont">
                <button className="btn-create" onClick={createGame}>
                    <img
                        src="button.svg"
                        alt="Create Game"
                        className="create-icon"
                    />
                    <p className="btn-text">Create Game</p>
                </button>
            </div>

            {/* Navigation button to return to the homepage */}
            <div className="back-cont">
                <button
                    className="btn-back"
                    onClick={() => {
                        playClickSound();
                        navigate('/');
                    }}
                >
                    <img
                        src="back.svg"
                        alt="Back Button"
                        className="back-icon"
                    />
                </button>
            </div>

            {/* Sidebar Toggle Button (Only if Authenticated) */}
            <div
                className="chat-toggle-wrapper"
                style={{ left: isChatOpen ? '450px' : '0px' }}
            >
                <button className="chat-toggle-button" onClick={toggleChat}>
                    {isChatOpen ? '<' : '>'}
                </button>

                {/* Notification Circles */}
                <div className="friend-request-circles">
                    {pendingRequests.length > 0 && (
                        <div className="circle-request">
                            {pendingRequests.length}
                        </div>
                    )}
                </div>

                {/* Unread Message Circles */}
                <div className="unread-message-circles">
                    {friends.reduce((acc, f) => acc + (f.unreadCount || 0), 0) >
                        0 && (
                        <div className="circle-msg">
                            {friends.reduce(
                                (acc, f) => acc + (f.unreadCount || 0),
                                0,
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Chat Window */}
            <div className={`chat-sidebar ${isChatOpen ? 'open' : ''}`}>
                {/* Pending Friend Requests Section */}
                {pendingRequests.length > 0 && (
                    <div className="pending-requests">
                        {pendingRequests.map((request, index) => (
                            <div key={index} className="friend-request">
                                <span className="request-text">
                                    {request.username} wants to be friends
                                </span>

                                <div className="request-actions">
                                    <button
                                        className="accept-btn"
                                        onClick={() =>
                                            acceptRequest(request.userId)
                                        }
                                    >
                                        ✅
                                    </button>
                                    <button
                                        className="decline-btn"
                                        onClick={() =>
                                            declineRequest(request.userId)
                                        }
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* List of friends */}
                <div className="friend-list">
                    {friends.map((friend) => (
                        <div
                            className="friend"
                            key={friend.userId}
                            onClick={() => fetchMessages(friend.userId)}
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
                                className={'remove-friend-btn'}
                                onClick={() => removeFriend(friend.userId)}
                            />
                        </div>
                    ))}
                </div>

                {/* Input for Adding a Friend */}
                <div className="add-friend-container">
                    <input
                        type="text"
                        className="add-friend-input"
                        placeholder="Enter friend code..."
                        value={friendCode}
                        onChange={(e) => setFriendCode(e.target.value)}
                    />
                    <button onClick={sendFriendRequest}>Add Friend</button>
                </div>

                {/* Chat Messages */}
                <div className="message-area">
                    {selectedFriend.current ? (
                        (
                            friends.find(
                                (f) => f.userId === selectedFriend.current,
                            )?.messages || []
                        ).length > 0 ? (
                            friends
                                .find(
                                    (f) => f.userId === selectedFriend.current,
                                )
                                .messages.map((msg, index) => (
                                    <p
                                        key={index}
                                        className={
                                            msg.name === 'You'
                                                ? 'sent'
                                                : 'received'
                                        }
                                    >
                                        <strong>{msg.name}:</strong>{' '}
                                        {msg.message}
                                    </p>
                                ))
                        ) : (
                            <p>No messages yet.</p>
                        )
                    ) : (
                        <p>Select a friend to view messages.</p>
                    )}
                </div>

                {/* Friend Code Display */}
                <div className="friend-code-display">
                    <p>
                        Your Friend Code: <span>{userFriendCode}</span>
                    </p>
                    <img
                        src="/clipboard.png"
                        alt="Copy to clipboard"
                        className="clipboard-icon"
                        onClick={() => {
                            playClickSound();
                            navigator.clipboard.writeText(userFriendCode);
                        }}
                    />
                </div>

                {/* Input Box at the Bottom */}
                <input
                    type="text"
                    className="message-input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!selectedChat}
                />
            </div>
        </div>
    );
}

export default Create;
