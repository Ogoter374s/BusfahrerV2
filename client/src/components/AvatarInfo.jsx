/**
 * @fileoverview Avatar Info Component
 * <br><br>
 * This component displays detailed information about players' avatars,
 * including their names, titles, and drink-giving controls. <br>
 * It supports interaction for selecting players and giving drinks. <br>
 * It is designed to be used within a player info context.
 */

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

/**
 * A component that displays detailed information about players' avatars,
 * including their names, titles, and drink-giving controls. <br>
 * It supports interaction for selecting players and giving drinks. <br>
 * It is designed to be used within a player info context.
 * <br><br>
 * 
 * @function AvatarInfo
 * @param {object} playerInfo - An object containing player information and interaction handlers.
 * @param {Array} playerInfo.players - An array of player objects to display.
 * @param {boolean} playerInfo.isCurrentPlayer - Whether the current user is the player being displayed.
 * @param {boolean} playerInfo.useGiving - Whether drink-giving functionality is enabled.
 * @param {string|null} playerInfo.selectedPlayer - The ID of the currently selected player, or null if none.
 * @param {function} playerInfo.setSelectedPlayer - Function to set the selected player.
 * @param {boolean} playerInfo.drinksGiven - Whether drinks have already been given this turn.
 * @param {function} playerInfo.giveDrinkToPlayer - Function to give a drink to a specified player.
 * @param {boolean} playerInfo.canUp - Whether the current player can increase drinks for others.
 * @param {boolean} playerInfo.canDown - Whether the current player can decrease drinks for others.
 * @returns {JSX.Element} The rendered avatar info component.
 */
function AvatarInfo({ playerInfo }) {
    const {
        players,
        isCurrentPlayer,
        useGiving,
        selectedPlayer,
        setSelectedPlayer,
        drinksGiven,
        giveDrinkToPlayer,
        canUp,
        canDown,
    } = playerInfo;

    return (
        <div className="avatar-wrapper">
            {players.map((player) => (
                <div
                    key={player.id}
                    className="flex flex-row items-center z-10"
                >
                    <img
                        src={`${BASE_URL}avatars/${player.avatar}`}
                        alt={player.name}
                        className={`avatar-info-icon
                            ${player.active ? "border-red-500" : "border-transparent"}
                        `}
                        onClick={() => {
                            setSelectedPlayer(
                                player.id === selectedPlayer ? null : player.id,
                            );
                            SoundManager.playClickSound();
                        }}
                        draggable={false}
                    />

                    {/* Show player information */}
                    {selectedPlayer === player.id && (
                        <div className="avatar-info-wrapper">
                            <div
                                className="flex flex-col justify-center font-['Luckiest_Guy']"
                                style={{ color: player.title.color }}
                            >
                                <p className="avatar-info-name">
                                    {player.name}
                                </p>
                                <p className="avatar-info-title">
                                    {player.title.name === "None" ? "" : player.title.name}
                                </p>
                            </div>

                            {/* Only show buttons for the current player */}
                            {isCurrentPlayer &&
                                !player.active &&
                                useGiving && (
                                    <div className="avatar-info-btn-wrapper">
                                        <button
                                            onClick={giveDrinkToPlayer(1)}
                                            disabled={drinksGiven || !canUp}
                                            className={`avatar-info-btn
                                            ${drinksGiven || !canUp ? "pointer-events-none opacity-50" : "hover:scale-110 active:scale-100"}
                                        `}
                                        >
                                            <span className="avatar-info-text">
                                                ↑
                                            </span>
                                        </button>
                                        <button
                                            disabled
                                            className="avatar-info-btn
                                    ">
                                            <span className="avatar-info-text">
                                                {player.drinksPerPlayer}
                                            </span>
                                        </button>
                                        <button
                                            onClick={giveDrinkToPlayer(-1)}
                                            disabled={player.drinks === 0 || !canDown}
                                            className={`avatar-info-btn
                                            ${drinksGiven || !canDown ? "pointer-events-none opacity-50" : "hover:scale-110 active:scale-100"}
                                        `}
                                        >
                                            <span className="avatar-info-text">
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
