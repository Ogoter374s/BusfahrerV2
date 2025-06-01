
// Hooks
import useWebSocketConnector from '../hooks/useWebSocketConnector';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

// React
import { useEffect, useRef, useState } from 'react';

function LobbyList({ onJoin }) {
    const [games, setGames] = useState([]);
    const init = useRef(false);

    const fetchGames = async () => {
        try {
            const res = await fetch(`${BASE_URL}get-waiting-games`, {
                credentials: 'include',
            });
            const data = await res.json();
            setGames(data);
        } catch (err) {
            console.error('Failed to fetch games:', err);
        }
    };

    const handleClick = (id) => {
        SoundManager.playClickSound();
        onJoin({gameId: id});
    }

    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchGames();
    }, []);

    useWebSocketConnector("lobby", {}, (message) => {
        if (message.type === 'lobbysUpdate') {
            setGames(message.data);
        }
    });

    return (
        <div className="game-list">
            {games.map((game) => (
                <div key={game.id} className="game-item">
                    <div className="game-info">
                        <div className="game-avatars">
                            {game.avatars.slice(0, 3).map((avatar, index) => (
                                <img
                                    key={index}
                                    src={`${BASE_URL}avatars/${avatar}`}
                                    alt={`Player ${index + 1}`}
                                    className="avatar-preview"
                                />
                            ))}
                            {game.playerCount > 3 && (
                                <span className="more-players">...</span>
                            )}
                        </div>
                        <span className="game-name">{game.name}</span>
                    </div>

                    <div className="game-join">
                        {game.spectator === 0 && (
                            <div className="game-spectator">
                                <span>
                                    {game.spectator} 2
                                </span>
                                <img
                                    src={"/spectator.svg"}
                                    alt={"Spectator"}
                                    className="spectator-icon"
                                />
                            </div>
                        )}
                        <span className="game-count">
                            {game.playerCount} / {game.settings.playerLimit}
                        </span>
                        <button onClick={() => handleClick(game.id)} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default LobbyList;
