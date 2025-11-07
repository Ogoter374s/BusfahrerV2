/**
 * @fileoverview Lobbies page where users can join public or private game lobbies.
 * <br><br>
 * This page displays a list of available public lobbies and provides an input field for joining private lobbies using a unique code. <br>
 * It includes authentication checks, WebSocket connections for real-time updates, and popup modals for user feedback.
 */

// Components
import ChatSidebar from '../components/ChatSidebar';
import MenuInput from '../components/MenuInput';
import BackButton from '../components/BackButton';
import LobbyList from '../components/LobbyList';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { PopupManager } from '../utils/popupManager';
import useLobbiesManager from '../hooks/useLobbiesManager';
import useWebSocketConnector from '../hooks/useWebSocketConnector';

// React
import { useState, useEffect, useRef } from 'react';

/**
 * Lobbies Page Component
 * <br><br>
 * This component renders the Lobbies page where users can join public or private game lobbies. <br>
 * It includes authentication checks, WebSocket connections for real-time updates, and popup modals for user feedback.
 * <br><br>
 * <strong>useLobbiesManager()</strong>: <br>
 * Custom hook that manages the state and actions related to game lobbies, including fetching the list of lobbies,
 * handling private lobby codes, and joining lobbies.
 * <br><br>
 * <strong>useEffect</strong>: <br>
 * Hook that runs side effects in the component. <br>
 * In this case, it initializes the PopupManager when the component is mounted and the user is authenticated.
 * <br><br>
 * 
 * @function Lobbies
 * @returns {JSX.Element} The Lobbies page component.
 */
function Lobbies() {
    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    
    const [popup, setPopup] = useState(PopupManager.defaultPopup);
    
    /**
     * Lobbies manager hook that provides state and actions for managing game lobbies.
     * It includes the list of lobbies, the private lobby code, and functions to join lobbies and update the lobby list.
     */
    const { 
        lobbies,
        privateCode,
        setPrivateCode,
        joinLobby, 
        updateLobbies 
    } = useLobbiesManager();

    /**
     * Initializes the PopupManager when the component is mounted and the user is authenticated.
     * This effect runs only once due to the `init` ref.
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup);
    }, [isAuthenticated]);

    /**
     * WebSocket connection to the "lobbies" channel.
     * It listens for messages related to lobby updates and calls the `updateLobbies` function accordingly.
     * The connection is established only after the component is initialized.
     */
    useWebSocketConnector("lobbies", {}, init.current, (message) => {
        if (message.type === 'lobbiesUpdate') {
            updateLobbies(message.data.lobby || message.data.lobbyId, message.data.action); 
        }
    });
    
    return (
        <div className="@container/lobbies flex flex-col items-center justify-center h-screen">

            {/* Background overlay image */}
            <div className="lobbies-wrapper">

                {/* Main menu container for joining games */}
                <div className="lobbies-home">

                    {/* Title indicating the Join Game section */}
                    <h1 className="lobbies-title">
                        Join
                        <span className="highlight">Game</span>
                    </h1>

                    {/* List of available public lobbies */}
                    <LobbyList lobbies={lobbies} onJoin={joinLobby}/>

                    {/* Section for joining private lobbies using a unique code */}
                    <div className="private-wrapper">
                        <MenuInput
                            type="text"
                            placeholder="Enter Lobby Code"
                            value={privateCode}
                            onChange={(e) => setPrivateCode(e.target.value)}
                            img="wood_green"
                            required
                        />
                        <button 
                            className="private-btn" 
                            onClick={() => joinLobby({isPrivate: true})}
                        />
                    </div>
                </div>
            </div>

            {/* Navigation button to return to the homepage */}
            <BackButton />
            
            {/* Sidebar Toggle */}
            <ChatSidebar />

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
        </div>
    );
}

export default Lobbies;
