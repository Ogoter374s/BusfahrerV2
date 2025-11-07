/**
 * @fileoverview Lobby page where users wait before starting the game.
 * <br><br>
 * This page displays the lobby information, including the list of players and spectators. <br>
 * It allows the game master to start the game and kick players if necessary. <br>
 * It also includes a chat sidebar and a leave button for exiting the lobby.
 */

// Components
import ChatSidebar from '../components/ChatSidebar';
import LeaveButton from '../components/LeaveButton';
import MenuButton from '../components/MenuButton';
import PlayerListItem from '../components/PlayerListItem';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useLobbyGuard } from '../hooks/useLobbyGuard';
import useLobbyManager from '../hooks/useLobbyManager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Lobby Page Component
 * <br><br>
 * This component renders the Lobby page where users wait before starting the game. <br>
 * It displays the lobby information, including the list of players and spectators, and allows the game master to start the game and kick players if necessary. <br>
 * It also includes a chat sidebar and a leave button for exiting the lobby.
 * <br><br>
 * <strong>useLobbyManager()</strong>: <br>
 * Custom hook that manages the state and actions related to the lobby, including fetching lobby info, 
 * managing players and spectators, starting the game, and leaving the lobby.
 * <br><br>
 * <strong>useEffect</strong>: <br>
 * Hook that runs side effects in the component. <br>
 * In this case, it initializes the PopupManager when the component is mounted and the user is authenticated and authorized to access the lobby.
 * <br><br>
 * 
 * @function Lobby
 * @returns {JSX.Element} The Lobby page component.
 */
function Lobby() {
    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    const isLobbyAuthenticated = useLobbyGuard();

    const navigate = useNavigate();
    const [popup, setPopup] = useState(PopupManager.defaultPopup);
    
    /**
     * Lobby manager hook that provides state and actions for managing the lobby.
     * It includes information about the lobby, players, spectators, and functions to start the game, kick players, and leave the lobby.
     */
    const {
        isGameMaster,
        startGame,
        kickPlayer,
        players,
        spectators,
        lobbyInfo,
        leaveLobby,
    } = useLobbyManager();

    /**
     * Initializes the PopupManager when the component is mounted and the user is authenticated and authorized to access the lobby.
     * This effect runs only once due to the `init` ref.
     */
    useEffect(() => {
        if(!isAuthenticated) return;
        if(!isLobbyAuthenticated) return;
        
        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup,navigate);
    }, [isAuthenticated, isLobbyAuthenticated]);

    return (
        <div className="@container/lobby flex flex-col items-center justify-center h-screen">
            
            {/* Background overlay image */}
            <div className="lobby-wrapper">

                {/* Main game menu container */}
                <div className="lobby-home">

                    {/* Game title with a highlighted effect */}
                    <h1 className="lobby-title">
                        {lobbyInfo?.name}:
                        <span className="highlight select-all">{lobbyInfo?.code}</span>
                    </h1>

                    {/* User list */}
                    <div className="lobby-user-list-wrapper">

                        {/* Player list */}
                        <div className="lobby-user-list-part">
                            <h2 className="lobby-user-list-title">
                                Players
                            </h2>

                            {players.map((player, index) => (
                                <PlayerListItem 
                                    key={player.id}
                                    player={player}
                                    index = {index}
                                    isGameMaster={isGameMaster}
                                    onKick={kickPlayer}
                                />
                            ))}
                        </div>

                        {/* Spectator list */}
                        {spectators.length > 0 && (
                            <div className="lobby-user-list-part">
                                <h2 className="lobby-user-list-title">
                                    Spectators
                                </h2>

                                {spectators.map((spectator, index) => (
                                    <PlayerListItem 
                                        key={spectator.id}
                                        player={spectator}
                                        index = {index}
                                        isGameMaster={isGameMaster}
                                        onKick={kickPlayer}
                                        isSpectator={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Start Game button (only enabled for game master) */}
                    <MenuButton 
                        wrapper={true}
                        wrapperClass="mt-6 sm:mt-3 lg:mt-6 xl:mt-6 2xl:mt-6"
                        buttonClass={"lobby-btn"}
                        textClass="btn-txt"
                        icon={isGameMaster ? 'button' : 'button_disabled'}
                        alt="Start Button"
                        text="Start Game"
                        disabled={!isGameMaster}
                        onClick={startGame}
                    />
                </div>
            </div>

            {/* Leave game button, navigates player back */}
            <LeaveButton 
                handleClick={leaveLobby}
            />

            {/* Sidebar Toggle */}
            <ChatSidebar showChatTab={true}/>

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

export default Lobby;
