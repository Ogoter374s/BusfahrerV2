/**
 * ChatSidebar.jsx — Renders the social chat sidebar for managing friends and messaging.
 *
 * Integrates friend requests, friend management, private messages, and UI toggling into a compact sidebar.
 * Powered by the `useFriendChatManager` hook for state management and message operations.
 */

// Components
import PopupModal from './PopUpModal';

// Features
import ChatToggleButton from '../features/ChatToggleButton';
import ChatTabs from '../features/ChatTabs';
import FriendRequestList from '../features/FriendRequestList';
import FriendList from '../features/FriendList';
import FriendInput from '../features/FriendInput';
import FriendMessages from '../features/FriendMessages';
import FriendCode from '../features/FriendCode';
import MessageInput from '../features/MessageInput';

// Hooks
import useFriendChatManager from '../hooks/useFriendChatManager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import React, { useState, useEffect } from 'react';

/**
 * ChatSidebar component function.
 *
 * Manages the visibility and contents of the friend chat system.
 * Includes tabs for friend interactions, request notifications, message history, and friend code input.
 * Dynamically displays components based on the active tab and selected friend.
 *
 * @function ChatSidebar
 * @returns {JSX.Element} The rendered chat sidebar and toggle UI.
 */
const ChatSidebar = () => {
    /**
     * Retrieves and binds chat-related state and handlers using a custom hook.
     *
     * The `useFriendChatManager` hook provides internal logic for managing:
     * - Sidebar open/close toggle
     * - Active tab selection
     * - Friend list and friend code updates
     * - Incoming/outgoing messages
     * - Friend requests and chat history
     */
    const {
        setPopupManager,
        isChatOpen,
        toggleChat,
        activeTab,
        setActiveTab,
        pendingRequests,
        friends,
        selectedFriend,
        friendCode,
        setFriendCode,
        userFriendCode,
        newMessage,
        setNewMessage,
        fetchMessages,
        sendMessage,
    } = useFriendChatManager();

    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    useEffect(() => {
        PopupManager.initPopupManager(setPopup);
        setPopupManager(PopupManager);
    }, []);

    /**
     * Renders the chat toggle and sidebar layout.
     *
     * - Displays the toggle button with friend and request info.
     * - Renders tab controls and conditionally shows friend-related components.
     * - Includes message input if a friend is selected.
     */
    return (
        <>
            {/* Chat Toggle + Notifications */}
            <ChatToggleButton
                isChatOpen={isChatOpen}
                toggleChat={toggleChat}
                pendingRequests={pendingRequests}
                friends={friends}
            />

            {/* Sidebar Container */}
            <div className={`chat-sidebar ${isChatOpen ? 'open' : ''}`}>
                {/* Tab Navigation (Friends/Requests) */}
                <ChatTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    showGameTab={false}
                />

                {/* Friend Requests Section */}
                <FriendRequestList pendingRequests={pendingRequests} />

                {/* Friend Chat Interface */}
                {activeTab === 'friends' && (
                    <>
                        {/* List of Friends */}
                        <FriendList
                            friends={friends}
                            onSelect={fetchMessages}
                        />

                        {/* Add Friend Input */}
                        <FriendInput
                            friendCode={friendCode}
                            setFriendCode={setFriendCode}
                        />

                        {/* Message History Display */}
                        <FriendMessages
                            friends={friends}
                            selectedFriend={selectedFriend}
                        />

                        {/* Display User's Friend Code */}
                        <FriendCode userFriendCode={userFriendCode} />

                        {/* Input for Sending Messages (Shown Only if Friend is Selected) */}
                        {selectedFriend && (
                            <MessageInput
                                value={newMessage}
                                setValue={setNewMessage}
                                onSend={sendMessage}
                            />
                        )}
                    </>
                )}
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

export default ChatSidebar;
