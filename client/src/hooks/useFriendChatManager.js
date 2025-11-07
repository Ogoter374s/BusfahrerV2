/**
 * @fileoverview useFriendChatManager Hook
 * <br><br>
 * This hook manages the friend chat functionality, including fetching friend requests, friends list,
 * user friend code, and handling messages. <br>
 * It also manages the chat UI state and interactions.
 */

// Hooks
import useWebSocketConnector from './useWebSocketConnector';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

// React
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * A custom hook that manages the friend chat functionality including: <br>
 * - Popup management <br>
 * - Chat toggle state <br>
 * - Active tab management (Friends/Requests) <br>
 * - Friend requests and friends list <br>
 * - Selected friend and friend code management <br>
 * - Message handling (fetching, sending, and input management) <br>
 * <br>
 * <strong>useEffect:</strong> <br>
 * Initializes the PopupManager and sets the popup state when the component mounts. <br>
 * This ensures that the PopupManager is ready to handle popups throughout the application.
 * <br> <br>
 * <strong>useWebSocketConnector:</strong> <br>
 * Connects to the WebSocket server to receive real-time updates on friend requests and friends list. <br>
 * It updates the state variables accordingly when a 'friendUpdate' message is received.
 * <br> <br>
 * <strong>playClickSound:</strong> <br>
 * Plays a click sound when certain actions are performed, enhancing user experience.
 * <br> <br>
 * <strong>toggleChat:</strong> <br>
 * Toggles the chat UI open/close state and plays a click sound.
 * <br> <br>
 * <strong>fetchFriendRequests:</strong> <br>
 * Fetches the current user's friend requests from the server and updates the state.
 * <br> <br>
 * <strong>fetchFriends:</strong> <br>
 * Fetches the current user's friends list from the server and updates the state.
 * <br> <br>
 * <strong>fetchInvitations:</strong> <br>
 * Fetches the current user's lobby invitations from the server and updates the state.
 * <br> <br>
 * <strong>fetchMessages:</strong> <br>
 * Fetches messages for the selected friend and marks them as read. <br>
 * It also plays a click sound and updates the selected friend state.
 * <br> <br>
 * <strong>sendMessage:</strong> <br>
 * Sends a new message to the selected friend. <br>
 * If the message is empty, it does nothing. <br>
 * If the message is sent successfully, it updates the friends list. <br>
 * If there is an error, it shows a popup with an error message. 
 * <br> <br>
 * <strong>handleAccept:</strong> <br>
 * Handles the acceptance of a friend request. <br>
 * Sends a POST request to the server to accept the friend request for the specified user ID. <br>
 * This function plays a click sound when the accept button is clicked.
 * <br> <br>
 * <strong>handleDecline:</strong> <br>
 * Handles the decline of a friend request. <br>
 * Sends a POST request to the server to decline the friend request for the specified user ID. <br>
 * This function plays a click sound when the decline button is clicked.
 * <br> <br>
 * <strong>sendFriendRequest:</strong> <br>
 * Handles the submission of the friend request. <br> 
 * It sends a POST request to the server with the entered friend code and displays a popup notification based on the response.
 * If the friend code input is empty, it does nothing. <br>
 * This function plays a click sound when the send button is clicked.
 * <br> <br>
 * <strong>removeFriend:</strong> <br>
 * Handles the removal of a friend. <br>
 * Sends a POST request to the server to remove the friend for the specified user ID. <br>
 * If the request is successful, it updates the friends list. <br>
 * If there is an error, it shows a popup with the error message.
 * <br> <br>
 * <strong>inviteFriend:</strong> <br>
 * Invites a friend to join a lobby after user confirmation. <br>
 * Sends a POST request to the server to send the invitation. <br>
 * If the request is successful, shows a success message; otherwise, shows an error message.
 * <br> <br>
 * <strong>handleInvitationAccept:</strong> <br>
 * Handles accepting a lobby invitation. <br>
 * Sends a POST request to the server to accept the invitation for the specified lobby ID. <br>
 * If the request is successful, navigates the user to the lobby join page. <br>
 * If there is an error, it shows a popup with the error message.
 * <br> <br>
 * <strong>handleInvitationDecline:</strong> <br>
 * Handles declining a lobby invitation. <br>
 * Sends a POST request to the server to decline the invitation for the specified lobby ID. <br>
 * If there is an error, it shows a popup with the error message.
 * <br> <br>
 * 
 * @function useFriendChatManager
 * @returns {Object} An object containing methods and state variables for managing the friend chat functionality
 */
function useFriendChatManager() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);

    const [friends, setFriends] = useState([]);
    const [friendCode, setFriendCode] = useState('');
    const [userFriendCode, setUserFriendCode] = useState('');

    const [newFriendMessage, setNewFriendMessage] = useState('');
    const [selectedFriend, setSelectedFriend] = useState('');

    const init = useRef(false);
    const navigate = useNavigate();

    /**
     * useEffect hook to initialize the friend chat manager.
     * It fetches friend requests, friends list, and user friend code when the component mounts.
     * This ensures that the initial state is set up correctly for the chat functionality.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchFriendRequests();
        fetchFriends();
        fetchInvitations();
    }, []);

    /**
     * useWebSocketConnector hook to listen for real-time updates from the server.
     * It updates the friends list and pending requests when a 'friendUpdate' message is received.
     * This allows the chat UI to reflect changes in friend status or requests without needing a page refresh.
     */
    useWebSocketConnector("friend", {}, init.current, (message) => {
        if (message.type === 'friendUpdate') {
            setPendingRequests(message.data.requests);
            setFriends(message.data.friends);
        }

        if (message.type === 'invitationUpdate') {
            setPendingInvitations(message.data.invitations);
        }
    });

    // Function to play a click sound
    const playClickSound = () => SoundManager.playClickSound();

    /**
     * Function to toggle the chat UI open/close state.
     * It plays a click sound when the chat is toggled.
     */
    const toggleChat = () => {
        playClickSound();
        setIsChatOpen((prev) => !prev);
    };

    /**
     * Function to fetch friend requests from the server.
     * It sends a request to the server to get the current user's pending friend requests
     * and updates the state with the received data.
     * If no pending requests are found, it initializes the state with an empty array.
     */
    const fetchFriendRequests = async () => {
        const res = await fetch(`${BASE_URL}get-friend-requests`, {
            credentials: 'include',
        });

        const data = await res.json();

        setPendingRequests(data.requests || []);
    };

    /**
     * Function to fetch the friends list from the server.
     * It sends a request to the server to get the current user's friends
     * and updates the state with the received data.
     * If no friends are found, it initializes the state with an empty array.
     * This allows the chat UI to display the current friends list.
     */
    const fetchFriends = async () => {
        const res = await fetch(`${BASE_URL}get-friends`, {
            credentials: 'include',
        });
        
        const data = await res.json();

        setFriends(data.friends || []);
        setUserFriendCode(data.friendCode);
    };

    /**
     * Fetches lobby invitations from the server.
     * It sends a request to the server to get the current user's pending lobby invitations
     * and updates the state with the received data.
     * If no pending invitations are found, it initializes the state with an empty array.
     * This allows the chat UI to display the current lobby invitations.
     */
    const fetchInvitations = async () => {
        const res = await fetch(`${BASE_URL}get-lobby-invitations`, {
            credentials: 'include',
        });

        const data = await res.json();
        setPendingInvitations(data.invitations || []);
    };

    /**
     * Function to fetch messages for the selected friend.
     * It sends a request to the server to get messages for the selected friend
     * and marks them as read. It also plays a click sound and updates the selected friend state.
     * If the selected friend has no messages, it initializes the messages state with an empty array.
     * This allows the chat UI to display messages for the selected friend.
     */
    const markMessages = async (friendId) => {
        playClickSound();
        setSelectedFriend(friendId);

        await fetch(`${BASE_URL}mark-friend-messages-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId }),
        });
    };

    /**
     * Function to send a new message to the selected friend.
     * It sends a request to the server with the selected friend's ID and the message content.
     * If the message is empty, it does nothing.
     * If the message is sent successfully, it updates the friends list.
     * If there is an error, it shows a popup with an error message.
     * This allows the user to send messages to their friends in real-time.
     */
    const sendFriendMessage = async () => {
        if (!newFriendMessage.trim()) return;

        const res = await fetch(`${BASE_URL}send-friend-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                friendId: selectedFriend,
                message: newFriendMessage,
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error(data.error);
        }
    };

    /**
     * Handles the acceptance of a friend request.
     * Sends a POST request to the server to accept the friend request for the specified user ID.
     * This function plays a click sound when the accept button is clicked.
     */
    const handleFriendAccept = async (friendId) => {
        playClickSound();

        const ressponse = await fetch(`${BASE_URL}accept-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId }),
        });

        const data = await ressponse.json();

        if (!data.success) {
            PopupManager.showPopup({
                title: "Add Friend",
                message: data.error,
                icon: '❌'
            });
        }
    };

    /**
     * Handles the decline of a friend request.
     * Sends a POST request to the server to decline the friend request for the specified user ID.
     * This function plays a click sound when the decline button is clicked.
     */
    const handleFriendDecline = async (friendId) => {
        playClickSound();
        const response = await fetch(`${BASE_URL}decline-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId }),
        });

        const data = await response.json();

        if (!data.success) {
            PopupManager.showPopup({
                title: "Add Friend",
                message: data.error,
                icon: '❌'
            });
        }
    };

    /**
     * Handles sending a friend request.
     * Sends a POST request to the server with the entered friend code and displays a popup notification based on the response.
     * If the friend code input is empty, it does nothing.
     * This function plays a click sound when the send button is clicked.
     */
    const sendFriendRequest = async (e) => {
        e.preventDefault();

        if (!friendCode.trim()) return;
        SoundManager.playClickSound();

        const res = await fetch(`${BASE_URL}send-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendCode }),
        });

        setFriendCode(''); // Clear input after sending request

        const data = await res.json();
        
        PopupManager.showPopup({
            title: "Add Friend",
            message: res.ok ? data.message : data.error,
            icon: res.ok ? '✅' : '❌',
        });
    };

    /**
     * Removes a friend from the list after user confirmation.
     * Sends a POST request to the server to remove the friend.
     * If the request is successful, shows a success message; otherwise, shows an error message.
     */
    const removeFriend = async (friendId) => {
        playClickSound();

        const confirmed = await PopupManager.showPopup({
            title: "Remove Friend",
            message: "Are you sure you want to remove this friend? This action cannot be undone.",
            icon: '❗️',
            useCancel: true,
        });

        if (!confirmed) return;

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
     * Invites a friend to join a lobby after user confirmation.
     * Sends a POST request to the server to send the invitation.
     * If the request is successful, shows a success message; otherwise, shows an error message.
     */
    const inviteFriend = async (friendId, lobbyId) => {
        if (!lobbyId) return;

        playClickSound();

        const confirmed = await PopupManager.showPopup({
            title: "Invite Friend",
            message: "Are you sure you want to invite this friend to the Game?",
            icon: '❗️',
            useCancel: true,
        });

        if (!confirmed) return;

        const res = await fetch(`${BASE_URL}send-lobby-invitation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId, lobbyId }),
        });

        const data = await res.json();

        PopupManager.showPopup({
            title: "Invite Friend",
            message: res.ok ? data.message : data.error,
            icon: res.ok ? '✅' : '❌',
        });
    };

    /**
     * Handles accepting a lobby invitation.
     * Sends a POST request to the server to accept the invitation for the specified lobby ID.
     * If the request is successful, navigates the user to the lobby join page.
     * If there is an error, it shows a popup with the error message.
     */
    const handleInvitationAccept = async (lobbyId) => {
        playClickSound();

        const response = await fetch(`${BASE_URL}accept-lobby-invitation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ lobbyId }),
        });

        const data = await response.json();

        if (data.success) {
            navigate(`/join/${data.lobby}`);
        } else {
            PopupManager.showPopup({
                title: data.title,
                message: data.error,
                icon: '❌'
            });
        }
    };

    /**
     * Handles declining a lobby invitation.
     * Sends a POST request to the server to decline the invitation for the specified lobby ID.
     * If there is an error, it shows a popup with the error message.
     */
    const handleInvitationDecline = async (lobbyId) => {
        playClickSound();

        const response = await fetch(`${BASE_URL}decline-lobby-invitation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ lobbyId }),
        });

        const data = await response.json();

        if (!data.success) {
            PopupManager.showPopup({
                title: data.title,
                message: data.error,
                icon: '❌'
            });
        }
    };

    return {
        isChatOpen,
        toggleChat,

        selectedFriend,

        userFriendCode,
        friendCode,
        setFriendCode,

        newFriendMessage,
        setNewFriendMessage,

        sendFriendMessage,
        markMessages,

        pendingRequests,
        sendFriendRequest,
        handleFriendAccept,
        handleFriendDecline,

        friends,
        removeFriend,
        inviteFriend,

        pendingInvitations,
        handleInvitationAccept,
        handleInvitationDecline,
    };
}

export default useFriendChatManager;
