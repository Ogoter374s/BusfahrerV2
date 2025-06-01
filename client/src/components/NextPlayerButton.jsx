
// Utilities
import BASE_URL from '../utils/config'; 
import { SoundManager } from '../utils/soundManager';

// React
import { useParams } from 'react-router-dom';

function NextPlayerButton({ 
    isCurrentPlayer, 
    isRowFlipped = false,
    allCardsPlayed = false,
    drinksGiven = true,
    isNextPhase,
    nextPhaseEndpoint = "start-phase2",
    defaultEndpoint = "next-player",
}) {
    const { gameId } = useParams();

    const handelClick = async () => {
        SoundManager.playClickSound();
        try {
            const endpoint = isNextPhase ? nextPhaseEndpoint : defaultEndpoint;

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error advancing to next player:', error);
        }
    };

    const isEnabled = isRowFlipped || allCardsPlayed;

    return (
        <div className="next-cont">
            <button
                className={
                    isCurrentPlayer && isEnabled && drinksGiven
                        ? "btn-next"
                        : "btn-next-disabled"
                }
                disabled={!isCurrentPlayer || !drinksGiven || !isEnabled}
                onClick={handelClick}
            >
                <img
                    src={
                        isNextPhase && isCurrentPlayer
                            ? "/next_phase.svg"
                            : isCurrentPlayer && isEnabled && drinksGiven
                            ? "/next.svg"
                            : "/next_disabled.svg"
                    }
                    alt="Next Button"
                    className="next-icon"
                />
            </button>
        </div>
    );
};

export default NextPlayerButton;