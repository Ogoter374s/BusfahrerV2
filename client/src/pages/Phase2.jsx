
// Components
import ChatSidebar from '../components/ChatSidebar';
import AvatarInfo from '../components/AvatarInfo';
import LeaveButton from '../components/LeaveButton';
import PlayerCards from '../components/PlayerCards';
import Phase2Layout from '../components/Phase2Layout';
import TurnInfo from '../components/TurnInfo';
import NextPlayerButton from '../components/NextPlayerButton';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useGameGuard } from '../hooks/useGameGuard';
import usePhase2Manager from '../hooks/usePhase2Manager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Phase2() {
    const { gameId } = useParams();

    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    const isGameAuthenticated = useGameGuard();

    const navigate = useNavigate();
    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const {
        playerCards,
        gameCards,
        currentName,
        isCurrentPlayer,
        drinkCount,
        isNextPhase,
        currentRound,
        allCardsPlayed,
        hasToEx,
        busfahrerName,
        isSpectator,
        setPopupManager,
        handleLayCard,
    } = usePhase2Manager();

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
            {/* Overlay image for Phase 2 */}
            <img
                src="/overlay_phase.svg"
                alt="Overlay-Pyramid"
                className="overlay-pyramid-img"
            />

            {/* Player avatars container */}
            <AvatarInfo 
                phase={2}
            />

            {/* Main Phase 2 container */}
            <div className="phase2-menu">
                {/* Busfahrer (Driver) section displaying player name and drinking rules */}
                <div className="busfahrer-cont">
                    <h2 className="busfahrer-title">
                        Busfahrer:{' '}
                        <span className="busfahrer-name">{busfahrerName}</span>
                    </h2>
                    <p className="busfahrer-subtitle">
                        Trinke für deine Übrigen Karten
                    </p>
                    <ul className="busfahrer-rules">
                        <li>Pro 2-10: Trinke 2-10 Schluck</li>
                        <li>Pro J: Alle Burschen trinken einen Schluck</li>
                        <li>Pro Q: Alle Damen trinken einen Schluck</li>
                        <li>Pro K: Alle trinken einen Schluck</li>
                        <li>Pro A: Ex dein Glas</li>
                    </ul>
                </div>

                {/* Displaying game cards */}
                <Phase2Layout 
                    gameCards={gameCards} 
                />

                {/* Display turn information based on the phase and round */}
                <TurnInfo 
                    phase="phase2"
                    isNextPhase={isNextPhase}
                    currentName={currentName}
                    drinkCount={drinkCount}
                    currentRound={currentRound}
                    hasToEx={hasToEx}
                />

                {/* Display player's cards that have not been played yet */}
                <PlayerCards 
                    playerCards={playerCards}
                    handleLayCard={handleLayCard}
                />
            </div>

            {/* Back button to leave the game */}
            <LeaveButton />

            {/* Next Player button (enabled only if conditions are met) */}
            {!isSpectator && (
                <NextPlayerButton
                    isCurrentPlayer={isCurrentPlayer}
                    allCardsPlayed={allCardsPlayed}
                    isNextPhase={isNextPhase}
                    nextPhaseEndpoint="start-phase3"
                    defaultEndpoint="next-player-phase"
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

export default Phase2;
