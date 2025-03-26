import BASE_URL, { WBS_URL } from './config';
import ChatSidebar from './ChatSidebar';

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
     * Fetches the current player's unique identifier from the backend.
     *
     * Sends a GET request to the `get-player-id` endpoint using HttpOnly cookies
     * for secure session authentication. On success, stores the player ID in a
     * React ref (`playerIdRef`) for persistent access throughout the component's lifecycle.
     *
     * Logs an error to the console if the request fails due to network or server issues.
     *
     * @async
     * @function fetchPlayerId
     * @returns {Promise<void>} A promise that resolves once the player ID is fetched and stored.
     * @throws {Error} If the fetch request fails or returns invalid JSON.
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
     * Fetches the list of players currently in the specified game.
     *
     * Sends a GET request to the `get-players/:gameId` endpoint using HttpOnly cookies
     * for session authentication. On success, updates the local `players` state with
     * the array of player objects returned from the server.
     *
     * Logs any errors that occur during the fetch operation to the console.
     *
     * @async
     * @function fetchPlayers
     * @returns {Promise<void>} A promise that resolves once the players list is successfully fetched and updated.
     * @throws {Error} If the request fails due to network or server issues.
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
     * Checks whether the current player is the game master for the specified game.
     *
     * Sends a GET request to the `is-game-master` endpoint with the `gameId` as a query parameter,
     * using HttpOnly cookies for secure session authentication. On success, updates the
     * local `isGameMaster` state with the boolean result returned by the server.
     *
     * Logs any errors encountered during the request to the console.
     *
     * @async
     * @function checkGameMaster
     * @returns {Promise<void>} A promise that resolves after the game master status is determined and stored.
     * @throws {Error} If the fetch request fails due to network or server issues.
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
     *
     * @function fetchSoundPreference
     * @async
     * @throws {Error} If the fetch operation fails.
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
     * Sets up a WebSocket connection to manage real-time game lobby updates.
     *
     * Establishes a WebSocket connection using the provided `WBS_URL` and subscribes
     * to updates for the specified `gameId`. Listens for multiple event types:
     * - `gameUpdate`: Updates the list of players in the lobby.
     * - `kicked`: Redirects the user if they were removed from the game.
     * - `close`: Redirects users if the game has been closed by the host.
     * - `start`: Navigates users to Phase 1 when the game begins.
     *
     * Also fetches initial game-related data, including:
     * - Player list via `fetchPlayers`
     * - Player ID via `fetchPlayerId`
     * - Game master status via `checkGameMaster`
     * - Sound preference via `fetchSoundPreference`
     *
     * Adds a cleanup listener for the `beforeunload` event to close the WebSocket connection
     * and performs additional cleanup on component unmount to prevent memory leaks.
     *
     * @function useEffect
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
     * Plays a cloned instance of the selected click sound effect.
     *
     * Clones the current audio element to allow overlapping playback,
     * resets the clone's playback position, and plays the sound.
     * Useful for rapid or repeated click feedback without delay.
     *
     * @function playClickSound
     */
    const playClickSound = () => {
        const clickClone = soundRef.current.cloneNode();
        clickClone.currentTime = 0;
        clickClone.play();
    };

    /**
     * Kicks a player from the current game session.
     *
     * Sends a POST request to the `kick-player` endpoint with the `gameId` and the ID of the
     * player to be removed. Uses HttpOnly cookies for authentication to ensure only the game
     * master can perform this action.
     *
     * Plays a UI click sound before initiating the request. If the server responds with an error,
     * an alert is shown to the user. Any unexpected errors are logged to the console.
     *
     * @async
     * @function kickPlayer
     * @param {string} id - The unique identifier of the player to kick from the game.
     * @returns {Promise<void>} A promise that resolves once the kick operation is complete.
     * @throws {Error} If the request fails due to a network or server issue.
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
     * Starts the game session if the current user is the game master.
     *
     * Validates that the user is authorized (i.e., the game master) before proceeding.
     * Sends a POST request to the `start-game` endpoint with the `gameId` in the request body.
     * Uses HttpOnly cookies for authentication.
     *
     * Plays a UI click sound before sending the request. On failure, displays an error
     * alert with a relevant message. Unexpected errors are logged to the console.
     *
     * @async
     * @function startGame
     * @returns {Promise<void>} A promise that resolves once the game start process completes or fails.
     * @throws {Error} If the request fails due to a network or server issue.
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
     * Allows the current player to leave the game session.
     *
     * Sends a POST request to the `leave-game` endpoint with the `gameId` in the request body.
     * Uses HttpOnly cookies for session authentication. Based on the server's response:
     * - If the player was the last one in the game (`data.message === 'one'`), navigates to the lobby screen.
     * - Otherwise, navigates to the homepage.
     *
     * Plays a click sound before initiating the request to provide UI feedback.
     * Displays an alert if the response indicates an error or if an unexpected failure occurs.
     *
     * @async
     * @function leaveGame
     * @returns {Promise<void>} A promise that resolves once the player has successfully left the game or an error is handled.
     * @throws {Error} If the fetch request fails due to a network or server issue.
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

    /**
     * Renders the game lobby UI where players can prepare before the game starts.
     *
     * Displays the game title and a list of all joined players, including their avatar,
     * display name, and title badge (if set). Each player entry includes a kick button
     * that is only enabled for the game master.
     *
     * Provides a "Start Game" button that allows the game master to begin the session,
     * and a "Leave Game" button for players to exit the lobby. Also includes a chat
     * sidebar component for pre-game communication.
     *
     * @function JSX Return Block
     * @returns {JSX.Element} A React component representing the game lobby screen.
     */
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

                            {/* Name and Title Container */}
                            <div className="player-text">
                                <span className="player-name" style={{ color: player.title.color }}>{player.name}</span>
                                {player.title && (
                                    <span
                                        className="player-title"
                                        style={{ color: player.title.color }}
                                    >
                                        {player.title.name !== "None" ? player.title.name : ""}
                                    </span>
                                )}
                            </div>

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
                        />
                        <p className="btn-text-startGame">Start Game</p>
                    </button>
                </div>
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

            {/* Sidebar Toggle */}
            <ChatSidebar />
        </div>
    );
}

export default Game;
