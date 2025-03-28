import BASE_URL, { WBS_URL } from "./config";

import { useEffect, useRef, useState } from "react";
import { useLocation } from 'react-router-dom';

function AvatarInfo({ gameId }) {
    const [players, setPlayers] = useState([]);
    const [currentPlayerId, setCurrentPlayerId] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [useGive, setUseGive] = useState(true);

    const isCurrentPlayer = useRef(false);
    const drinksGivenRef = useRef(false);
    const playerIdRef = useRef(null);
    const wsRef = useRef(null);
    const init = useRef(false);

    const location = useLocation();
    const isPhase1 = /\/phase[1]\//.test(location.pathname);

    const soundRef = useRef(new Audio(`/sounds/ui-click.mp3`));

    /**
     * Fetches the user's selected click sound preference.
     *
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio source accordingly.
     * Uses HttpOnly cookies for authentication.
     *
     * @function fetchSoundPreference
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchSoundPreference = async () => {
        try {
            const res = await fetch(`${BASE_URL}get-click-sound`, {
                credentials: 'include',
            });
            const data = await res.json();
            soundRef.current.src = `/sounds/${data.sound}`;
        } catch (error) {
            console.error('Error fetching sound preference:', error);
        }
    };

    /**
     * Fetches the list of players currently in the game.
     *
     * Sends a GET request to retrieve player data and updates the state.
     */
    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-players/${gameId}`, {
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch players');

            const data = await response.json();
            setPlayers(data.players);
            setCurrentPlayerId(data.currentPlayer);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const getCurrentPlayer = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-current-player?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const player = await response.json();
            const isPlayer = player.playerId === playerIdRef.current;

            isCurrentPlayer.current = isPlayer;
        } catch (error) {
            console.error('Error fetching current player:', error);
        }
    };

    const fetchPlayerId = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-player-id`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const id = await response.json();

            playerIdRef.current = id;
        } catch (error) {
            console.error('Error fetching player ID:', error);
        }
    };

    const fetchDrinksGiven = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}drinks-given?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const given = await response.json();
            drinksGivenRef.current = given;
        } catch (error) {
            console.error('Error fetching drinks given status:', error);
        }
    };

    const fetchUseGive = async () => {
        try {
            const response = await fetch(`${BASE_URL}use-give?gameId=${gameId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const given = await response.json();
            setUseGive(given && isPhase1);
        } catch (error) {
            console.error('Error fetching useGive status:', error);
        }
    };

    /**
     * Sets up a WebSocket connection to receive real-time player updates.
     *
     * On receiving a 'gameUpdate' message, updates player list and current player data.
     * Cleans up the WebSocket connection on component unmount.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            wsRef.current = new WebSocket(WBS_URL);

            wsRef.current.onopen = () => {
                wsRef.current.send(
                    JSON.stringify({ type: 'subscribe', gameId }),
                );
            };

            wsRef.current.onmessage = async (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'playersUpdate') {
                    if (isCurrentPlayer.current) {
                        fetchDrinksGiven();
                    }
                }

                if (message.type === 'gameUpdate') {
                    setPlayers(message.data.players);
                    setCurrentPlayerId(message.data.currentPlayer);

                    getCurrentPlayer();
                }
            };
        }

        fetchPlayers();
        getCurrentPlayer();
        fetchPlayerId();
        fetchDrinksGiven();
        fetchUseGive();
        
        fetchSoundPreference();

        window.addEventListener("beforeunload", () => {
            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        });

        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, [gameId]);

    /**
     * Plays a cloned instance of the selected click sound effect.
     *
     * Clones the current audio element to allow overlapping playback,
     * resets the clone's playback position, and plays the sound.
     * Useful for rapid or repeated click feedback without delay.
     *
     * @function playClickSound
     */
    const playClickSound = () => {
        const clone = soundRef.current.cloneNode();
        clone.currentTime = 0;
        clone.play();
    };

    const giveSchluck = (inc) => async () => {
        if (!isCurrentPlayer.current) return;

        try {
            const response = await fetch(`${BASE_URL}give-schluck`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, inc, playerId: selectedPlayer }),
            });

            if (response.ok) {
                playClickSound();
            } else {
                throw new Error('Failed to give Schluck');
            }
        } catch (error) {
            console.error('Error giving Schluck:', error);
        }
    };

    return (
        <div className="player-avatars">
            {players.map((player) => (
                <div
                    key={player.id}
                    className={`avatar-container ${player.id === currentPlayerId ? "active-player" : ""}`}
                    style={{ position: "relative" }}
                >
                    <img
                        src={`${BASE_URL}avatars/${player.avatar}`}
                        alt={player.name}
                        className="avatar-image"
                        onClick={() => {setSelectedPlayer(player.id === selectedPlayer ? null : player.id); playClickSound();}}
                        draggable={false}
                    />

                    
                    {selectedPlayer === player.id && (
                        <div className="avatar-popup">
                            <div className="popup-content" style={{color: player.title.color}}>
                                <p className="popup-name">{player.name}</p>
                                <p className="popup-title">{player.title.name !== "None" ? player.title.name : ""}</p>
                            </div>
                            {/* Only show buttons for the current player */}
                            {isCurrentPlayer.current && playerIdRef.current !== player.id && useGive &&(
                                <div className="popup-actions">
                                        <button 
                                            onClick={giveSchluck(true)}
                                            disabled={drinksGivenRef.current}
                                            style={{pointerEvents: drinksGivenRef.current ? "none" : "auto"}}
                                        >
                                            <span className="arrow-up">
                                                ↑
                                            </span>
                                        </button>
                                        <button 
                                            style={{pointerEvents: "none"}}
                                        >
                                            {player.drinks}
                                        </button>
                                        <button 
                                            onClick={giveSchluck(false)} 
                                            disabled={player.drinks === 0}
                                            style={{pointerEvents: player.drinks === 0 ? "none" : "auto"}}
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