
// Components
import ChatSidebar from '../components/ChatSidebar';
import AvatarInfo from '../components/AvatarInfo';
import LeaveButton from '../components/LeaveButton';
import RetryButton from '../components/RetryButton';
import Phase3Layout from '../components/Phase3Layout';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useGameGuard } from '../hooks/useGameGuard';
import useCardTheme from '../hooks/useCardTheme';
import usePhase3Manager from '../hooks/usePhase3Manager';

// Utilities
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Phase3() {
    const { gameId } = useParams();

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
        gameCards,
        busfahrerName,
        currentRound,
        isLast,
        drinkCount,
        isGameMaster,
        isOwner,
        endGame,
        isSpectator,
        checkCard,
        setPopupManager,
    } = usePhase3Manager();

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
            {/* Overlay background image for Phase 3 */}
            <img
                src="/overlay_phase.svg"
                alt="Overlay-Diamond"
                className="overlay-diamond-img"
            />

            {/* Player avatars container */}
            <AvatarInfo 
                phase={3}
            />

            {/* Main Phase 3 container */}
            <div className="phase3-menu">
                {/* Display Busfahrer name */}
                <div className="busfahrer-cont">
                    <h2 className="busfahrer-title">
                        Busfahrer:{' '}
                        <span className="busfahrer-name">{busfahrerName}</span>
                    </h2>
                </div>

                {/* Render the diamond-shaped card layout */}
                <Phase3Layout 
                    gameCards={gameCards}
                    color1={color1}
                    color2={color2}
                    theme={selectedTheme}
                    round={currentRound}
                    isLast={isLast}
                    isBusfahrer={isOwner}
                    checkCard={checkCard}
                />

                {/* Display game result or drinking requirement */}
                {(currentRound === -1 || currentRound === 0) && (
                    <p className="turn-info-phase3">
                        {endGame ? (
                            <>
                                <span className="current-player">
                                    {busfahrerName}{' '}
                                </span>{' '}
                                {busfahrerName.includes('&') ? 'haben' : 'hat'}{' '}
                                das Spiel
                                <span className="drink-count"> überlebt </span>
                            </>
                        ) : (
                            <>
                                <span className="current-player">
                                    {busfahrerName}{' '}
                                </span>{' '}
                                {busfahrerName.includes('&')
                                    ? 'müssen'
                                    : 'muss'}
                                <span className="drink-count">
                                    {' '}
                                    {drinkCount}{' '}
                                </span>{' '}
                                Schlucke trinken
                            </>
                        )}
                    </p>
                )}
            </div>

            {/* Back button to leave the game */}
            <LeaveButton />

            {/* Retry or Start New Game button */}
            {!isSpectator && (
                <RetryButton
                    isOwner={isOwner}
                    endGame={endGame}
                    isGameMaster={isGameMaster}
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

export default Phase3;
