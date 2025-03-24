import BASE_URL, { WBS_URL } from './config';

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Game() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const { gameId } = useParams();

    const [players, setPlayers] = useState([]);
    const [isGameMaster, setIsGameMaster] = useState(false);

    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const wsRef = useRef(null);
    const init = useRef(false);

    /**
     * Fetches the player's unique identifier from the backend.
     *
     * Sends a GET request using HttpOnly cookie authentication.
     * Stores the fetched player ID in a React ref for comparison during events.
     */
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

            const data = await response.json();

            setPlayers(data.players);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    /**
     * Checks if the current player is the game master.
     *
     * Sends a GET request using HttpOnly authentication and updates game master state.
     */
    const checkGameMaster = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-game-master?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const isMaster = await response.json();
            setIsGameMaster(isMaster);
        } catch (error) {
            console.error('Error checking game master status:', error);
        }
    };

    /**
     * Fetches the user's selected click sound preference.
     *
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio source accordingly.
     * Uses HttpOnly cookies for authentication.
     */
    const fetchSoundPreference = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-click-sound`, {
                credentials: 'include',
            });

            const data = await response.json();

            soundRef.current.src = '';

            setSelectedSound(data.sound);
            soundRef.current.src = `/sounds/${data.sound}`;
        } catch (error) {
            console.error('Error fetching sound preference:', error);
        }
    };

    /**
     * Sets up a WebSocket connection to receive real-time game updates.
     *
     * Subscribes to a game WebSocket channel, listens for different game-related events,
     * and updates the local state accordingly. Handles player removal, game closure,
     * and phase transitions. Also fetches and updates the list of players in the game.
     * Cleans up by closing the WebSocket connection when the component unmounts.
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
                await fetchPlayerId();

                const message = JSON.parse(event.data);

                // Handle game state updates
                if (message.type === 'gameUpdate') {
                    setPlayers(message.data.players);
                }

                // Handle player being kicked from the game
                if (message.type === 'kicked') {
                    if (message.id === playerIdRef.current) {
                        alert('You have been removed from the game');
                        navigate('/lobbys');
                    }
                }

                // Handle game being closed
                if (message.type === 'close') {
                    if (message.userId !== playerIdRef.current) {
                        alert('Game has been closed');
                        navigate('/lobbys');
                    }
                }

                // Handle game start transition
                if (message.type === 'start') {
                    navigate(`/phase1/${gameId}`);
                }
            };
        }

        fetchPlayers();
        fetchPlayerId();
        checkGameMaster();

        fetchSoundPreference();

        window.addEventListener('beforeunload', () => {
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
     * Plays a click sound effect.
     *
     * Resets the current playback time to the beginning and plays the sound.
     * Ensures the sound plays from the start each time the function is called.
     */
    const playClickSound = () => {
        soundRef.current.currentTime = 0;
        soundRef.current.play();
    };

    /**
     * Kicks a player from the game.
     *
     * Sends a POST request to remove a player from the game. The game master must be authenticated.
     * Updates the local player list upon successful removal.
     * @param {string} id - The ID of the player to be removed.
     */
    const kickPlayer = async (id) => {
        playClickSound();
        try {
            const response = await fetch(`${BASE_URL}kick-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, id }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error kicking player:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    /**
     * Starts the game if the user is the game master.
     *
     * Sends a POST request to change the game status to "active".
     * The game must be in a joinable state before it can start.
     */
    const startGame = async () => {
        playClickSound();
        if (!isGameMaster) return;

        try {
            const response = await fetch(`${BASE_URL}start-game`, {
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
            console.error('Error starting game:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    /**
     * Allows a player to leave the game.
     *
     * Sends a POST request to remove the player from the game.
     * Navigates to the correct screen based on whether the player was the last one in the game.
     */
    const leaveGame = async () => {
        playClickSound();
        try {
            const response = await fetch(`${BASE_URL}leave-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.message === 'one') {
                    navigate('/lobbys');
                } else {
                    navigate('/');
                }
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error leaving game:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="overlay-cont">
            {/* Background overlay image */}
            <img src="/overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main game menu container */}
            <div className="game-menu">
                {/* Game title with a highlighted effect */}
                <h1 className="game-title">
                    Busfahrer
                    <span className="highlight">Extreme</span>
                </h1>

                {/* Player list displaying all players in the game */}
                <div className="player-list">
                    {players.map((player) => (
                        <div key={player.id} className="player-item">
                            {/* Avatar Image */}
                            <img
                                src={`${BASE_URL}avatars/${player.avatar}`}
                                alt={`${player.name}'s Avatar`}
                                className="player-avatar"
                            />

                            {/* Display player name */}
                            <span>{player.name}</span>

                            {/* Kick button (only enabled for game master) */}
                            <button
                                className={
                                    !isGameMaster
                                        ? 'player-item-button-disabled'
                                        : 'player-item-button'
                                }
                                disabled={!isGameMaster}
                                onClick={() => kickPlayer(player.id)}
                            />
                        </div>
                    ))}
                </div>

                {/* Start Game button (only enabled for game master) */}
                <div className="startGame-cont">
                    <button
                        className={
                            !isGameMaster
                                ? 'btn-startGame-disabled'
                                : 'btn-startGame'
                        }
                        disabled={!isGameMaster}
                        onClick={startGame}
                    >
                        <img
                            src={
                                !isGameMaster
                                    ? '/button_disabled.svg'
                                    : '/button.svg'
                            }
                            alt="Logout"
                            className="startGame-icon"
                        />
                        <p className="btn-text-startGame">Start Game</p>
                    </button>
                </div>

                {/* Leave game button, navigates player back */}
                <div className="back-cont">
                    <button className="btn-back" onClick={leaveGame}>
                        <img
                            src="/back.svg"
                            alt="Back Button"
                            className="back-icon"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Game;
