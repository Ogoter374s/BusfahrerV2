
// Components
import ChatSidebar from '../components/ChatSidebar';
import LeaveButton from '../components/LeaveButton';
import NextPlayerButton from '../components/NextPlayerButton';
import Phase1Layout from '../components/Phase1Layout';
import PlayerCards from '../components/PlayerCards';
import TurnInfo from '../components/TurnInfo';
import AvatarInfo from '../components/AvatarInfo';
import PopupModal from '../components/PopUpModal';
 
// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useGameGuard } from '../hooks/useGameGuard';
import useCardTheme from '../hooks/useCardTheme';
import usePhase1Manager from '../hooks/usePhase1Manager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Phase1() {
    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    const isGameAuthenticated = useGameGuard();

    const navigate = useNavigate();
    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const {
        selectedTheme,
        color1,
        color2,
    } = useCardTheme();

    const {
        playerCards,
        gameCards,
        isRowFlipped,
        currentName,
        isCurrentPlayer,
        drinkCount,
        isNextPhase,
        drinksReceived,
        drinksGiven,
        isSpectator,
        setPopupManager,
        handleRowClick,
        handleLayCard,
    } = usePhase1Manager();

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!isGameAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup, navigate);
        setPopupManager(PopupManager);
    }, [isAuthenticated, isGameAuthenticated]);

    return (
        <div className="overlay-cont">
            {/* Overlay image for the pyramid phase */}
            <img
                src="/overlay_phase.svg"
                alt="Overlay-Pyramid"
                className="overlay-pyramid-img"
            />

            {/* Player avatars container */}
            <AvatarInfo 
                phase={1}
            />

            {/* Main Phase 1 container */}
            <div className="phase1-menu">
                {/* Card pyramid displaying all game cards */}
                <Phase1Layout 
                    gameCards={gameCards}
                    color1={color1}
                    color2={color2}
                    theme={selectedTheme}
                    handleRowClick={handleRowClick}
                />

                {/* Display turn information */}
                <TurnInfo 
                    isNextPhase={isNextPhase}
                    currentName={currentName}
                    drinkCount={drinkCount}
                />

                {/* Display the number of drinks given */}
                <div className="given-info">
                    {drinksReceived > 0 && (
                        <>
                            <span className="current-player">Du</span> musst
                            <span className="drink-count">
                                {' '}
                                {drinksReceived}
                            </span>{' '}
                            Schlucke trinken
                        </>
                    )}
                </div>

                {/* Player's available cards for selection */}
                <PlayerCards 
                    playerCards={playerCards}
                    handleLayCard={handleLayCard}
                />
            </div>

            {/* Leave game button, navigates player back */}
            <LeaveButton />

            {/* Next Player button (enabled only if conditions are met) */}
            {!isSpectator && (
                <NextPlayerButton
                    isCurrentPlayer={isCurrentPlayer}
                    isRowFlipped={isRowFlipped}
                    drinksGiven={drinksGiven}
                    isNextPhase={isNextPhase}
                />
            )}

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

export default Phase1;
