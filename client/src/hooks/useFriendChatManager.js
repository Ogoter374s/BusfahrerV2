/**
 * useFriendChatManager.js — Custom React hook for managing friend-based chat state and behavior.
 *
 * Handles chat sidebar toggling, active tab state, friend messaging, friend code updates,
 * message sending, and tracking of pending friend requests and unread messages.
 * Centralizes chat logic for use in sidebar UI components.
 */

// Hooks
import useWebSocketConnector from './useWebSocketConnector';

// Utilities
import { SoundManager } from '../utils/soundManager';
import BASE_URL from '../utils/config';

// React
import { useEffect, useRef, useState } from 'react';

let PopupManager = null;

/**
 * useFriendChatManager hook function.
 *
 * Provides the complete reactive state and logic necessary for managing:
 * - Chat visibility and toggling
 * - Active tab switching (friends vs. game)
 * - Friend code management and submission
 * - Message composition, retrieval, and sending
 * - Pending friend requests and unread message handling
 *
 * @function useFriendChatManager
 * @returns {Object} An object containing:
 *   {boolean} isChatOpen - Indicates whether the chat sidebar is currently open.
 *   {Function} toggleChat - Function to toggle the chat sidebar visibility.
 *   {string} activeTab - The current active tab key ("friends", "game", etc.).
 *   {Function} setActiveTab - Function to set the current tab.
 *   {Array} pendingRequests - Array of incoming friend request objects.
 *   {Array} friends - List of friend objects, each potentially with messages and unread counts.
 *   {string|null} selectedFriend - ID of the friend currently selected in chat.
 *   {string} friendCode - Current input value for adding a new friend.
 *   {Function} setFriendCode - State setter for the friend code input.
 *   {string} userFriendCode - The current user's own friend code for sharing.
 *   {string} newMessage - Composed message value for the current chat.
 *   {Function} setNewMessage - Setter for updating message composition state.
 *   {Function} fetchMessages - Function to retrieve chat messages with the selected friend.
 *   {Function} sendMessage - Function to send a new message to the selected friend.
 */
function useFriendChatManager() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendCode, setFriendCode] = useState('');
    const [userFriendCode, setUserFriendCode] = useState('');
    const [newMessage, setNewMessage] = useState('');

    const selectedFriend = useRef('');
    const init = useRef(false);
    const [activeTab, setActiveTab] = useState('friends');

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    /**
     * Initializes WebSocket connection and loads initial friend data on mount.
     *
     * Sets up a persistent WebSocket to receive real-time friend updates.
     * On open, sends an "account" subscription message.
     * On receiving a "friendsUpdate" message, updates the friends list, pending requests, and friend code.
     * Also performs initial fetches for friend requests, friends, and the user's friend code.
     * Cleans up the WebSocket connection on component unmount.
     *
     * @function useEffect (initialization)
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchFriendRequests();
        fetchFriends();
        fetchUserFriendCode();
    }, []);

    useWebSocketConnector("account", {}, (message) => {
        if (message.type === 'friendsUpdate') {
            setFriends(message.data.friends);
            setPendingRequests(message.data.pendingRequests);
            setUserFriendCode(message.data.friendCode);
        }
    });

    /**
     * playClickSound — Plays a UI sound effect for feedback on interactions.
     *
     * Centralized click sound handler for consistent feedback across the chat UI.
     *
     * @function playClickSound
     */
    const playClickSound = () => SoundManager.playClickSound();

    /**
     * toggleChat — Toggles the visibility of the chat sidebar.
     *
     * Plays a click sound and switches the open/closed state of the chat panel.
     *
     * @function toggleChat
     */
    const toggleChat = () => {
        playClickSound();
        setIsChatOpen((prev) => !prev);
    };

    /**
     * fetchFriendRequests — Retrieves the user's pending friend requests from the backend.
     *
     * Sends a request to fetch incoming friend requests and updates the local state.
     *
     * @function fetchFriendRequests
     */
    const fetchFriendRequests = async () => {
        const res = await fetch(`${BASE_URL}get-friend-requests`, {
            credentials: 'include',
        });
        const data = await res.json();
        setPendingRequests(data.pending || []);
    };

    /**
     * fetchFriends — Retrieves the user's full friend list from the backend.
     *
     * Updates the local friend state with current data, including unread counts and message metadata.
     *
     * @function fetchFriends
     */
    const fetchFriends = async () => {
        const res = await fetch(`${BASE_URL}get-friends`, {
            credentials: 'include',
        });
        const data = await res.json();
        setFriends(data.friends || []);
    };

    /**
     * fetchUserFriendCode — Fetches the user's unique friend code.
     *
     * Retrieves the friend code from the backend and stores it for use in the UI.
     *
     * @function fetchUserFriendCode
     */
    const fetchUserFriendCode = async () => {
        const res = await fetch(`${BASE_URL}get-friend-code`, {
            credentials: 'include',
        });
        const data = await res.json();
        setUserFriendCode(data.friendCode);
    };

    /**
     * fetchMessages — Marks messages as read and loads message history for a selected friend.
     *
     * Sends a request to mark all messages as read and updates the friend list afterward.
     * Also sets the currently selected friend in a persistent ref.
     *
     * @function fetchMessages
     * @param {string} friendId - The ID of the friend whose messages are being viewed.
     */
    const fetchMessages = async (friendId) => {
        playClickSound();
        selectedFriend.current = friendId;

        await fetch(`${BASE_URL}mark-messages-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendId }),
        });

        fetchFriends();
    };

    /**
     * sendMessage — Sends a chat message to the currently selected friend.
     *
     * Posts the message content to the backend.
     * If successful, clears the input field. Otherwise, displays an error alert.
     *
     * @function sendMessage
     */
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
        if (!res.ok) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error(data.error);
        }
    };

    return {
        setPopupManager,
        isChatOpen,
        toggleChat,
        activeTab,
        setActiveTab,
        pendingRequests,
        friends,
        selectedFriend: selectedFriend.current,
        friendCode,
        setFriendCode,
        userFriendCode,
        newMessage,
        setNewMessage,
        fetchMessages,
        sendMessage,
    };
}

export default useFriendChatManager;
