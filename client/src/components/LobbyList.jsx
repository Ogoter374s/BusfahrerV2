/**
 * @fileoverview Lobby List Component
 * <br><br>
 * This component displays a list of available public lobbies. <br>
 * Each lobby item shows player avatars, lobby name, player count, and allows expansion for more details.
 */

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

// React
import { useState } from 'react';

/**
 * A component that displays a list of available public lobbies. <br>
 * Each lobby item shows player avatars, lobby name, player count, and allows expansion for more details.
 * <br><br>
 * <strong>toggleExpand:</strong> <br>
 * This function toggles the expanded state of a lobby item when clicked. <br>
 * It plays a click sound and updates the expanded index state.
 * <br><br>
 * 
 * @function LobbyList
 * @param {Array} lobbies - An array of lobby objects to display.
 * @param {function} onJoin - A function to call when the join button is clicked, with the lobby code as parameter.
 * @returns {JSX.Element} The rendered lobby list component.
 */
function LobbyList({ lobbies, onJoin }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    /**
     * Toggles the expanded state of a lobby item when clicked.
     * It plays a click sound and updates the expanded index state.
     */
    const toggleExpand = (index) => {
        SoundManager.playClickSound();
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className="lobby-list-wrapper">

            {/* List of available public lobbies */}
            {lobbies.map((lobby, index) => (
                <div
                    key={index}
                    className="lobby-list-item"
                    onClick={() => toggleExpand(index)}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 sm:gap-1 lg:gap-1 xl:gap-2 2xl:gap-2">

                            {/* Player Avatars */}
                            <div className="flex pointer-events-none gap-1 sm:gap-0.5 lg:gap-1 xl:gap-1.5 2xl:gap-1.5">
                                {lobby.avatars.slice(0, 3).map((player, idx) => (
                                    <img
                                        key={idx}
                                        src={`${BASE_URL}avatars/${player.avatar}`}
                                        alt={`Player ${idx + 1}`}
                                        className="lobby-list-avatar"
                                    />
                                ))}

                                {lobby.playerCount > 3 && (
                                    <span className="lobby-list-more">
                                        ...
                                    </span>
                                )}
                            </div>

                            <span className="lobby-list-title">
                                {lobby.name}
                            </span>
                        </div>

                        {/* Lobby Info */}
                        <div className="lobby-list-info">

                            {/* Spectator Icon if there are spectators */}
                            {lobby.spectators.length !== 0 && (
                                <div className="flex items-center">
                                    <img
                                        src={"/icons/spectator.svg"}
                                        alt={"Spectator"}
                                        className="lobby-list-spectator"
                                    />
                                </div>
                            )}

                            {/* Player Count and player limit */}
                            <span>
                                {lobby.playerCount} / {lobby.settings.playerLimit}
                            </span>

                            {/* Join Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onJoin({ lobbyCode: lobby.code });
                                }}
                                className="lobby-list-join"
                            />
                        </div>
                    </div>

                    {/* Expanded section with player list and creation date */}
                    {expandedIndex === index && (
                        <div className="lobby-list-extended">

                            {/* Left side: Player list */}
                            <ul>

                                {/* List of players with avatars and names */}
                                {lobby.avatars.map((player, idx) => (
                                    <li key={idx}>
                                        <div className="lobby-list-player-wrapper">
                                            <img
                                                key={idx}
                                                src={`${BASE_URL}avatars/${player.avatar}`}
                                                alt={`Player ${idx + 1}`}
                                                className="lobby-list-player-icon"
                                            />

                                            {player.name}
                                        </div>
                                    </li>
                                ))}

                                {/* List of spectators with icon and names */}
                                {lobby.spectators.map((player, idx) => (
                                    <li key={idx}>
                                        <div className="lobby-list-spectator-wrapper">
                                            <img
                                                src={"/icons/spectator.svg"}
                                                alt={"Spectator"}
                                                className="lobby-list-spectator-icon"
                                            />

                                            {player.name}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Right side: Creation date */}
                            <div className="lobby-list-date">
                                {new Date(lobby.createdAt).toLocaleDateString("de-DE", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default LobbyList;
