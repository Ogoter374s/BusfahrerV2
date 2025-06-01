
// Utilities
import BASE_URL from '../utils/config';

function PlayerListItem({ player, index, isGameMaster, onKick, isSpectator=false }) {
    let isKickDisabled = !isGameMaster;
    if(!isSpectator) {
        isKickDisabled = !isGameMaster || index === 0;
    }
    
    return (
        <div className="player-item">
            {/* Avatar Image */}
            <img
                src={`${BASE_URL}avatars/${player.avatar}`}
                alt={`${player.name}'s Avatar`}
                className="player-avatar"
            />

            {/* Name and Title */}
            <div className="player-text">
                <span
                    className="player-name"
                    style={{ color: player.title.color }}
                >
                    {player.name}
                </span>
                {player.title && player.title.name !== 'None' && (
                    <span
                        className="player-title"
                        style={{ color: player.title.color }}
                    >
                        {player.title.name}
                    </span>
                )}
            </div>

            {/* Kick Button */}
            <button
                className={
                    isKickDisabled
                        ? 'player-item-button-disabled'
                        : 'player-item-button'
                }
                disabled={isKickDisabled}
                onClick={() => onKick(player.id,isSpectator)}
            />
        </div>
    );
}

export default PlayerListItem;
