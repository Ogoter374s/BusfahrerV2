import React, {useEffect, useRef, useState} from 'react';
import BASE_URL, {WBS_URL} from './config';

/**
 * Self-contained Chat Sidebar Component
 *
 * Manages chat state, WebSocket connection, and rendering logic.
 *
 * @component
 */
const ChatSidebar = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendCode, setFriendCode] = useState('');
    const [userFriendCode, setUserFriendCode] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [selectedChat, setSelectedChat] = useState('');
    const selectedFriend = useRef('');
    const wsRef = useRef(null);
    const init = useRef(false);

    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(`/sounds/ui-click.mp3`));

    const playClickSound = () => {
        const clone = soundRef.current.cloneNode();
        clone.currentTime = 0;
        clone.play();
    };

    const toggleChat = () => {
        playClickSound();
        setIsChatOpen((prev) => !prev);
    };

    const fetchFriendRequests = async () => {
        const res = await fetch(`${BASE_URL}get-friend-requests`, { credentials: 'include' });
        const data = await res.json();
        setPendingRequests(data.pending || []);
    };

    const fetchFriends = async () => {
        const res = await fetch(`${BASE_URL}get-friends`, { credentials: 'include' });
        const data = await res.json();
        setFriends(data.friends || []);
    };

    const fetchUserFriendCode = async () => {
        const res = await fetch(`${BASE_URL}get-friend-code`, { credentials: 'include' });
        const data = await res.json();
        setUserFriendCode(data.friendCode);
    };

    const fetchSoundPreference = async () => {
        try {
            const res = await fetch(`${BASE_URL}get-click-sound`, {
                credentials: 'include',
            });
            const data = await res.json();
            setSelectedSound(data.sound);
            soundRef.current.src = `/sounds/${data.sound}`;
        } catch (error) {
            console.error('Error fetching sound preference:', error);
        }
    };

    useEffect(() => {
        if (init.current) return;
        init.current = true;

        wsRef.current = new WebSocket(WBS_URL);

        wsRef.current.onopen = () => {
            wsRef.current.send(JSON.stringify({ type: 'account' }));
        };

        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'friendsUpdate') {
                setFriends(message.data.friends);
                setPendingRequests(message.data.pendingRequests);
                setUserFriendCode(message.data.friendCode);
            }
        };

        fetchFriendRequests();
        fetchFriends();
        fetchUserFriendCode();
        fetchSoundPreference();

        return () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, []);

    const sendFriendRequest = async () => {
        if (!friendCode.trim()) return;
        playClickSound();

        const res = await fetch(`${BASE_URL}send-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendCode }),
        });

        const data = await res.json();
        if (res.ok) {
            alert('Friend request sent!');
            setFriendCode('');
        } else {
            alert(data.error);
        }
    };

    const acceptRequest = async (userId) => {
        playClickSound();
        await fetch(`${BASE_URL}accept-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId }),
        });
    };

    const declineRequest = async (userId) => {
        playClickSound();
        await fetch(`${BASE_URL}decline-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId }),
        });
    };

    const removeFriend = async (friendId) => {
        playClickSound();
        if (!window.confirm('Are you sure you want to remove this friend?')) return;

        const res = await fetch(`${BASE_URL}remove-friend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId }),
        });

        const data = await res.json();
        if (!res.ok) alert(data.error);
    };

    const fetchMessages = async (friendId) => {
        playClickSound();
        selectedFriend.current = friendId;
        setSelectedChat(friendId);

        await fetch(`${BASE_URL}mark-messages-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId }),
        });

        fetchFriends();
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const res = await fetch(`${BASE_URL}send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                friendId: selectedFriend.current,
                message: newMessage,
            }),
        });

        const data = await res.json();
        if (res.ok) setNewMessage('');
        else alert(data.error);
    };

    return (
        <>
            {/* Chat Toggle + Notifications */}
            <div
                className="chat-toggle-wrapper"
                style={{ left: isChatOpen ? '450px' : '0px' }}
            >
                <button className="chat-toggle-button" onClick={toggleChat}>
                    {isChatOpen ? '<' : '>'}
                </button>

                <div className="friend-request-circles">
                    {pendingRequests.length > 0 && (
                        <div className="circle-request">{pendingRequests.length}</div>
                    )}
                </div>
                <div className="unread-message-circles">
                    {friends.reduce((acc, f) => acc + (f.unreadCount || 0), 0) > 0 && (
                        <div className="circle-msg">
                            {friends.reduce((acc, f) => acc + (f.unreadCount || 0), 0)}
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar UI */}
            <div className={`chat-sidebar ${isChatOpen ? 'open' : ''}`}>
                {/* Friend Requests */}
                {pendingRequests.length > 0 && (
                    <div className="pending-requests">
                        {pendingRequests.map((request, index) => (
                            <div key={index} className="friend-request">
                                <span className="request-text">
                                    {request.username} wants to be friends
                                </span>
                                <div className="request-actions">
                                    <button className="accept-btn" onClick={() => acceptRequest(request.userId)}>?</button>
                                    <button className="decline-btn" onClick={() => declineRequest(request.userId)}>?</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Friends List */}
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
                            <button className="remove-friend-btn" onClick={() => removeFriend(friend.userId)} />
                        </div>
                    ))}
                </div>

                {/* Add Friend */}
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

                {/* Messages */}
                <div className="message-area">
                    {selectedFriend.current ? (
                        (
                            friends.find((f) => f.userId === selectedFriend.current)?.messages || []
                        ).length > 0 ? (
                            friends
                                .find((f) => f.userId === selectedFriend.current)
                                .messages.map((msg, index) => (
                                    <p key={index} className={msg.name === 'You' ? 'sent' : 'received'}>
                                        <strong>{msg.name}:</strong> {msg.message}
                                    </p>
                                ))
                        ) : (
                            <p>No messages yet.</p>
                        )
                    ) : (
                        <p>Select a friend to view messages.</p>
                    )}
                </div>

                {/* Friend Code + Message Input */}
                <div className="friend-code-display">
                    <p>Your Friend Code: <span>{userFriendCode}</span></p>
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
        </>
    );
};

export default ChatSidebar;