/**
 * @fileoverview Game Page
 * <br><br>
 * This page represents the main game interface where players can interact with the game. <br>
 * It includes player avatars, game phases, player cards, and various controls. <br>
 * It also manages authentication and game state through custom hooks. <br>
 * Popups are handled via a centralized PopupManager.
 */

// Components
import ChatSidebar from '../components/ChatSidebar';
import LeaveButton from '../components/LeaveButton';
import PopupModal from '../components/PopUpModal';
import PlayerCards from '../components/PlayerCards';
import AvatarInfo from '../components/AvatarInfo';
import PlayerActionButton from '../components/PlayerActionButton';

// Features
import Phase1 from '../features/Phase1';
import Phase2 from '../features/Phase2';
import Phase3 from '../features/Phase3';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useGameGuard } from '../hooks/useGameGuard';
import useCardTheme from '../hooks/useCardTheme';
import useGameManager from '../hooks/useGameManager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * The main game page component. <br>
 * It includes player avatars, game phases, player cards, and various controls. <br>
 * It also manages authentication and game state through custom hooks. <br>
 * Popups are handled via a centralized PopupManager.
 * <br><br>
 * <strong>useGameManager:</strong> <br>
 * This hook manages the game state, including player cards, game cards, avatar info, and game info. <br>
 * It also provides functions to handle card laying and row clicks, as well as a function to leave the game.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This effect initializes the PopupManager when the component mounts, provided the user is authenticated and game-authenticated.
 * <br><br>
 * 
 * @function Game
 * @returns {JSX.Element} The rendered game page component.
 */
function Game() {
    const init = useRef(false);
    const { lobbyId } = useParams();
    const isAuthenticated = useAuthGuard();
    const isGameAuthenticated = useGameGuard();

    const navigate = useNavigate();
    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    // Card theme hook to manage card appearance based on selected theme
    const cardTheme = useCardTheme();

    /**
     * Game manager hook to handle game state and actions.
     * It provides player cards, game cards, avatar info, and game info. 
     * It also includes functions to handle card laying, row clicks, and leaving the game.
     */
    const {
        playerCards,
        handleLayCard,
        gameCards,
        handleRowClick,
        avatarInfo,
        gameInfo,
        isSpectator,
        leaveGame,
    } = useGameManager(lobbyId);

    // Destructure phase from gameInfo for useEffect dependency
    const {
        phase,
    } = gameInfo;

    /**
     * Effect to initialize the PopupManager when the component mounts.
     * It checks if the user is authenticated and game-authenticated before initializing.
     * The PopupManager is initialized with the setPopup function and navigate function.
     */
    useEffect(() => {
        if (!isAuthenticated) return;
        if (!isGameAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup, navigate);
    }, [isAuthenticated, isGameAuthenticated, phase]);

    return (
        <div className="@container/game flex flex-col items-center justify-center h-screen">

            {/* Player avatars container */}
            <AvatarInfo 
                playerInfo={avatarInfo}
            />

            {/* Phase 1 */}
            <Phase1
                gCards={gameCards}
                info={gameInfo}
                theme={cardTheme}
                event={handleRowClick}
            />
             
            {/* Phase 2 */}
            <Phase2
                gCards={gameCards}
                info={gameInfo}
                theme={cardTheme}
            />

            {/* Phase 3 */}
            <Phase3
                gCards={gameCards}
                info={gameInfo}
                theme={cardTheme}
            />

            {/* Player's available cards for selection */}
            <PlayerCards
                playerCards={playerCards}
                handleLayCard={handleLayCard}
                theme={cardTheme.selectedTheme}
                color1={cardTheme.color1}
                color2={cardTheme.color2}
            />

            {/* Leave game button, navigates player back */}
            <LeaveButton 
                handleClick={leaveGame}
            />

            {/* Next Player button (enabled only if conditions are met) */}
            {!isSpectator && (
                <PlayerActionButton
                    manager={gameInfo}
                />
            )}

            {/* Sidebar Toggle */}
            <ChatSidebar showChatTab={true} />

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

export default Game;