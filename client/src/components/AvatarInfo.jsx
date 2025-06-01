
// Hooks
import useAvatarInfo from '../hooks/useAvatarInfo';

// Utilities
import BASE_URL from '../config';
import { SoundManager } from '../utils/soundManager';

function AvatarInfo({ phase }) {
    const {
        players,
        selectedPlayer,
        setSelectedPlayer,
        isCurrentPlayer,
        useGive,
        drinks,
        giveSchluck,
    } = useAvatarInfo(phase);

    return (
        <div className="player-avatars">
            {players.map((player) => (
                <div
                    key={player.id}
                    className={`avatar-container ${player.current ? 'active-player' : ''}`}
                    style={{ position: 'relative' }}
                >
                    <img
                        src={`${BASE_URL}avatars/${player.avatar}`}
                        alt={player.name}
                        className="avatar-image"
                        onClick={() => {
                            setSelectedPlayer(
                                player.id === selectedPlayer ? null : player.id,
                            );
                            SoundManager.playClickSound();
                        }}
                        draggable={false}
                    />

                    {selectedPlayer === player.id && (
                        <div className="avatar-popup">
                            <div
                                className="popup-content"
                                style={{ color: player.title.color }}
                            >
                                <p className="popup-name">{player.name}</p>
                                <p className="popup-title">
                                    {player.title.name !== 'None'
                                        ? player.title.name
                                        : ''}
                                </p>
                            </div>

                            {/* Only show buttons for the current player */}
                            {isCurrentPlayer &&
								!player.current &&
								useGive && (
                                <div className="popup-actions">
                                    <button
                                        onClick={giveSchluck(true)}
                                        disabled={drinks}
                                        style={{
                                            pointerEvents:
                                            drinks
                                                ? 'none'
                                                : 'auto',
                                        }}
                                    >
                                        <span className="arrow-up">↑</span>
                                    </button>
                                    <button
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {player.drinks}
                                    </button>
                                    <button
                                        onClick={giveSchluck(false)}
                                        disabled={player.drinks === 0}
                                        style={{
                                            pointerEvents:
                                                player.drinks === 0
                                                    ? 'none'
                                                    : 'auto',
                                        }}
                                    >
                                        <span className="arrow-down">
											↓
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default AvatarInfo;
