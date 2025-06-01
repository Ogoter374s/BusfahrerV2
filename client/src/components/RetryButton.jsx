
// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

// React
import { useParams } from 'react-router-dom';

function RetryButton({ 
    isOwner, 
    endGame, 
    isGameMaster 
}) {
    const { gameId } = useParams();

    const retryPhase = async () => {
        SoundManager.playClickSound();
        try {
            if (!endGame) {
                const flipRes = await fetch(`${BASE_URL}flip-phase`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ gameId }),
                });

                if (flipRes.ok) {
                    const retryRes = await fetch(`${BASE_URL}retry-phase`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ gameId }),
                    });

                    if (!retryRes.ok) {
                        throw new Error(`Failed to retry phase`);
                    }
                }
            } else {
                const response = await fetch(`${BASE_URL}open-new-game`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ gameId }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to end game`);
                }
            }
        } catch (error) {
            console.error('Error processing retry or new game request:', error);
        }
    };

    const isEnabled = isOwner && (!endGame || isGameMaster);

    return (
        <div className="try-cont">
            <button
                className={isEnabled ? 'btn-try' : 'btn-try-disabled'}
                disabled={!isEnabled}
                onClick={retryPhase}
            >
                <img
                    src={
                        isEnabled
                            ? endGame
                                ? '/new.svg'
                                : '/retry.svg'
                            : '/retry_disabled.svg'
                    }
                    alt="Try Button"
                    className="try-icon"
                />
            </button>
        </div>
    );
}

export default RetryButton;
