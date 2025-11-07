/**
 * @fileoverview Component for displaying a player in the player list. <br>
 * Includes avatar, name, title, and kick button (if applicable). <br>
 * Used in the Lobby page.
 */

// Utilities
import BASE_URL from '../utils/config';

/**
 * Component to display a player in the player list. <br>
 * Shows avatar, name, title, and kick button (if applicable). <br>
 * Used in the Lobby page.
 * 
 * @function PlayerListItem
 * @param {Object} player - Player data including id, name, avatar, and title.
 * @param {number} index - Index of the player in the list (0 for game master).
 * @param {boolean} isGameMaster - Whether the current user is the game master.
 * @param {Function} onKick - Function to call when kicking a player.
 * @param {boolean} [isSpectator=false] - Whether the player is a spectator.
 * @returns {JSX.Element} The rendered player list item component.
 */
function PlayerListItem({ player, index, isGameMaster, onKick, isSpectator=false }) {
    let isKickDisabled = !isGameMaster;
    
    if(!isSpectator) {
        isKickDisabled = !isGameMaster || index === 0;
    }
    
    return (
        <div className="player-list-wrapper">
            {/* Avatar Image */}
            <img
                src={`${BASE_URL}avatars/${player.avatar}`}
                alt={`${player.name}'s Avatar`}
                className="player-list-avatar"
            />

            {/* Name and Title */}
            <div className="flex flex-col items-center">
                <span
                    className="player-list-name"
                    style={{ color: player.title.color }}
                >
                    {player.name}
                </span>

                {player.title && player.title.name !== 'None' && (
                    <span
                        className="player-list-title"
                        style={{ color: player.title.color }}
                    >
                        {player.title.name}
                    </span>
                )}
            </div>

            {/* Kick Button */}
            <button
                className={`player-list-btn
                    ${isKickDisabled
                        ? "bg-[#626262] cursor-default"
                        : `bg-[#c1272d] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.6)] 
                            hover:-translate-y-[2px] active:shadow-[2px_2px_4px_rgba(0,0,0,0.3)] active:translate-y-[2px]`
                    }
                `}
                disabled={isKickDisabled}
                onClick={() => onKick(player.id)}
            />
        </div>
    );
}

export default PlayerListItem;
