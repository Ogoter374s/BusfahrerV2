
// Components
import ChatSidebar from '../components/ChatSidebar';
import LeaveButton from '../components/LeaveButton';
import MenuButton from '../components/MenuButton';
import PlayerListItem from '../components/PlayerListItem';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useGameGuard } from '../hooks/useGameGuard';
import useGameManager from '../hooks/useGameManager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Game() {
    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    const isGameAuthenticated = useGameGuard();

    const navigate = useNavigate();
    const [popup, setPopup] = useState(PopupManager.defaultPopup);
    
    const {
        setPopupManager,
        isGameMaster,
        startGame,
        kickPlayer,
        players,
        isSpectator,
        spectators,
    } = useGameManager();

    useEffect(() => {
        if(!isAuthenticated) return;
        if(!isGameAuthenticated) return;
        
        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup,navigate);
        setPopupManager(PopupManager);
    }, [isAuthenticated, isGameAuthenticated]);

    return (
        <div className="overlay-cont">
            {/* Background overlay image */}
            <img src="/overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main game menu container */}
            <div className="game-menu">
                {/* Game title with a highlighted effect */}
                <h1 className="game-title">
                    Busfahrer
                    <span className="highlight">Extreme</span>
                </h1>

                <div className="scroll-container">
                    <div className="list-section">
                        <h2 className="list-heading">Players</h2>
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
                    {spectators.length > 0 && (
                        <div className="list-section">
                            <h2 className="list-heading">Spectators</h2>
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
                    wrapperClass="startGame-cont"
                    buttonClass={isGameMaster ? 'btn-startGame' : 'btn-startGame-disabled'}
                    icon={isGameMaster ? '/button.svg' : '/button_disabled.svg'}
                    alt="Start Button"
                    text="Start Game"
                    disabled={!isGameMaster}
                    onClick={startGame}
                />
            </div>

            {/* Leave game button, navigates player back */}
            <LeaveButton 
                isSpectator={isSpectator}
            />

            {/* Sidebar Toggle */}
            <ChatSidebar />

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={PopupManager.closePopup}
            />
        </div>
    );
}

export default Game;
