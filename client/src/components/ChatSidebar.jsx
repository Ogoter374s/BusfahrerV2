/**
 * @fileoverview ChatSidebar component that manages the chat interface.
 * <br><br>
 * This component includes a toggle button for opening/closing the chat,
 * tabs for navigating between friends and requests, and sections for displaying
 * friend requests, friends list, and messaging interface.
 * It also handles popups for notifications and messages.
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
import ChatMessages from '../features/ChatMessages';
import LobbyInvitation from '../features/LobbyInvitation';

// Hooks
import useFriendChatManager from '../hooks/useFriendChatManager';
import useChatManager from '../hooks/useChatManager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect } from 'react';

/**
 * A sidebar component for managing chat functionalities such as friend requests, friends list, and messaging.<br>
 * It includes a toggle button for opening/closing the chat, tabs for navigating between friends and requests,
 * and sections for displaying friend requests, friends list, and messaging interface.<br>
 * It also handles popups for notifications and messages.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * Initializes the PopupManager and sets the popup state when the component mounts.<br>
 * This ensures that the PopupManager is ready to handle popups throughout the application.
 * <br><br>
 * <strong>useFriendChatManager:</strong> <br>
 * A custom hook that manages the chat sidebar functionality including:<br>
 * - Popup management<br>
 * - Chat toggle state<br>
 * - Active tab management (Friends/Requests)<br>
 * - Friend requests and friends list<br>
 * - Selected friend and friend code management<br>
 * - Message handling (fetching, sending, and input management)<br>
 *
 * @function ChatSidebar
 * @returns {JSX.Element} The rendered ChatSidebar component.
 */
const ChatSidebar = ({ showChatTab = false }) => {

    /**
     * A custom hook that manages the chat sidebar functionality including:
     * - Popup management
     * - Chat toggle state
     * - Active tab management (Friends/Requests)
     * - Friend requests and friends list
     * - Selected friend and friend code management
     * - Message handling (fetching, sending, and input management) 
     */
    const {
        isChatOpen,
        toggleChat,
        pendingRequests,
        friends,
        selectedFriend,
        friendCode,
        setFriendCode,
        userFriendCode,
        newFriendMessage,
        setNewFriendMessage,
        sendFriendMessage,
        markMessages,
        handleFriendAccept,
        handleFriendDecline,
        sendFriendRequest,
        removeFriend,
        inviteFriend,
        pendingInvitations,
        handleInvitationAccept,
        handleInvitationDecline,
    } = useFriendChatManager();

    const {
        chatName,
        chatCode,
        chatMessages,
        newChatMessage,
        setNewChatMessage,
        sendChatMessage
    } = useChatManager(showChatTab);

    const [popup, setPopup] = useState(PopupManager.defaultPopup);
    const [activeTab, setActiveTab] = useState('friends');

    /**
     * Initializes the PopupManager and sets the popup state.
     * This effect runs once when the component mounts.
     * It sets up the PopupManager to handle popups throughout the application.
     */
    useEffect(() => {
        PopupManager.initPopupManager(setPopup);
    }, []);

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
            <div className={`chatSidebar
                ${isChatOpen ? 'translate-x-0' :
                    '-translate-x-[23.5vw] sm:-translate-x-[25vw] lg:-translate-x-[43.5vw] xl:-translate-x-[35vw] 2xl:-translate-x-[25vw]'}    
            `}>
                {/* Tab Navigation (Friends/Requests) */}
                <ChatTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    showChatTab={showChatTab}
                />

                {/* Friend Chat Interface */}
                {activeTab === 'friends' && (
                    <>
                        {/* Friend Requests Section */}
                        <FriendRequestList
                            pendingRequests={pendingRequests}
                            handleAccept={handleFriendAccept}
                            handleDecline={handleFriendDecline}
                        />

                        {/* List of Friends */}
                        <FriendList
                            friends={friends}
                            onSelect={markMessages}
                            removeFriend={removeFriend}
                            inviteFriend={inviteFriend}
                        />

                        {/* Add Friend Input */}
                        <FriendInput
                            friendCode={friendCode}
                            setFriendCode={setFriendCode}
                            sendFriendRequest={sendFriendRequest}
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
                                value={newFriendMessage}
                                setValue={setNewFriendMessage}
                                onSend={sendFriendMessage}
                            />
                        )}
                    </>
                )}

                {/* Game Chat Interface */}
                {activeTab === 'chat' && (
                    <>
                        {/* Display Current Lobby Name */}
                        <span className="chatTitle">
                            {chatName}: {chatCode}
                        </span>

                        {/* Lobby Message Display */}
                        <ChatMessages
                            messages={chatMessages}
                        />

                        {/* Input for Sending Messages */}
                        <MessageInput
                            value={newChatMessage}
                            setValue={setNewChatMessage}
                            onSend={sendChatMessage}
                        />
                    </>
                )}
            </div>

            {/* Lobby Invitaions */}
            <LobbyInvitation
                pendingInvitations={pendingInvitations}
                handleAccept={handleInvitationAccept}
                handleDecline={handleInvitationDecline}
            />

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onOk={PopupManager.okPopup}
                onCancel={PopupManager.cancelPopup}
                useCancel={popup.useCancel}
            />
        </>
    );
};

export default ChatSidebar;
