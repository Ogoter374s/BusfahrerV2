import BASE_URL, { WBS_URL } from './config';
import ChatSidebar from './ChatSidebar';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Lobbys() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [games, setGames] = useState([]);
    const [privateCode, setPrivateCode] = useState('');

    const navigate = useNavigate();
    const wsRef = useRef(null);
    const init = useRef(false);

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

            setSelectedSound(data.sound);
            soundRef.current.src = `/sounds/${data.sound}`;
        } catch (error) {
            console.error('Error fetching sound preference:', error);
        }
    };

    /**
     * Fetches the list of waiting games from the backend API.
     *
     * Sends a GET request to the `get-waiting-games` endpoint to retrieve all games
     * that are in a waiting state (i.e., available to join). The request includes
     * HttpOnly cookies for session authentication.
     *
     * On successful response, updates the local game state with the retrieved data
     * and logs the result to the console.
     *
     * @async
     * @function fetchGames
     * @returns {Promise<void>} A promise that resolves once the game data is fetched and applied to state.
     * @throws {TypeError} If the response cannot be parsed as JSON.
     * @throws {Error} If the fetch request fails due to network or server issues.
     */
    const fetchGames = async () => {
        const response = await fetch(`${BASE_URL}get-waiting-games`, {
            credentials: 'include',
        });

        const data = await response.json();
        setGames(data);

    };

    /**
     * Sets up a WebSocket connection to receive real-time lobby updates.
     *
     * Initializes a WebSocket connection to the backend using the `WBS_URL`.
     * Sends a subscription message identifying the client as a lobby listener.
     * Listens for `lobbysUpdate` messages from the server and updates the local
     * game state accordingly.
     *
     * Also triggers initial data fetches for the list of waiting games and
     * the user's sound preferences.
     *
     * Cleans up the WebSocket connection when the component unmounts or when
     * the browser window is closed, to prevent memory leaks and dangling connections.
     *
     * @function useEffect
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            wsRef.current = new WebSocket(WBS_URL);

            wsRef.current.onopen = () => {
                wsRef.current.send(JSON.stringify({ type: 'lobby' }));
            };

            wsRef.current.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'lobbysUpdate') {
                    setGames(message.data);
                }
            };
        }

        fetchGames();

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
    }, []);

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
     * Attempts to join a specified game by verifying the game ID with the backend.
     *
     * Sends a POST request to the `check-game-code` endpoint with the provided `gameId`.
     * If the backend validates the game ID successfully, the user is redirected to the join page.
     * Otherwise, an error message is displayed to the user.
     *
     * Plays a click sound before making the request to enhance UX feedback.
     * Uses HttpOnly cookies for secure authentication.
     *
     * @async
     * @function joinGame
     * @param {string} gameId - The unique identifier of the game the user wants to join.
     * @returns {Promise<void>} A promise that resolves after the join operation completes or fails.
     * @throws {Error} If the fetch request fails or encounters a network/server issue.
     */
    const joinGame = async (gameId) => {
        playClickSound();
        try {
            const response = await fetch(`${BASE_URL}check-game-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (data.success) {
                navigate(`/join/${data.game}`);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Unexpected error joining game:', error);
            alert('Failed to join the game. Please try again.');
        }
    };

    /**
     * Attempts to join a private game using a manually entered game code.
     *
     * Validates that a non-empty game code has been entered, then sends a POST request
     * to the `check-game-code` endpoint with the code as the `gameId`. If the game code
     * is valid and the backend returns a success response, the user is redirected to the join page.
     * Otherwise, an error message is shown.
     *
     * Plays a click sound for UI feedback before initiating the request.
     * Uses HttpOnly cookies for secure session authentication.
     *
     * @async
     * @function joinPrivateGame
     * @returns {Promise<void>} A promise that resolves when the join operation completes or fails.
     * @throws {Error} If the fetch request fails due to a network or server error.
     */
    const joinPrivateGame = async () => {
        playClickSound();
        if (!privateCode || !privateCode.trim()) {
            alert('Please enter a valid game code.');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}check-game-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId: privateCode }),
            });

            const data = await response.json();

            if (data.success) {
                navigate(`/join/${data.game}`);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Unexpected error joining private game:', error);
            alert('Failed to join the private game. Please try again.');
        }
    };

    /**
     * Renders the Join Game screen UI.
     *
     * Displays a list of public games available to join, each showing a preview of player avatars,
     * the game name, and a button to join. If the game has more than three players, it appends an
     * ellipsis to indicate more participants. Also includes a section for joining private games
     * by manually entering a game code.
     *
     * Provides a back button to navigate to the homepage and includes a sidebar chat component.
     *
     * @function JSX Return Block
     * @returns {JSX.Element} A React component representing the join game lobby UI.
     */
    return (
        <div className="overlay-cont">
            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main menu container for joining games */}
            <div className="lobbys-menu">
                {/* Title indicating the Join Game section */}
                <h1 className="lobbys-title">
                    Join
                    <span className="highlight">Game</span>
                </h1>

                {/* List of available public games */}
                <div className="game-list">
                    {games.map((game) => (
                        <div key={game.id} className="game-item">
                            <div className="game-info">

                                {/* Avatars + "..." if more than 3 */}
                                <div className="game-avatars">
                                    {game.avatars.slice(0, 3).map((avatar, index) => (
                                    <img key={index} src={`${BASE_URL}avatars/${avatar}`} alt={`Player ${index + 1}`} className="avatar-preview" />
                                    ))}
                                    {game.playerCount > 3 && <span className="more-players">...</span>}
                                </div>

                                {/* Game name */}
                                <span className="game-name">{game.name}</span>
                            </div>

                            {/* Join button and player count next to it */}
                            <div className="game-join">
                                <span className="game-count">
                                {game.playerCount} / {game.settings.playerLimit}
                                </span>
                                <button onClick={() => joinGame(game.id)}/>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section for joining private games using a unique code */}
                <div className="private-game-cont">
                    <input
                        className="private-game"
                        type="text"
                        placeholder="Enter Private Game Code"
                        value={privateCode}
                        onChange={(e) => setPrivateCode(e.target.value)}
                    />
                    <button className="btn-private" onClick={joinPrivateGame} />
                </div>
            </div>

            {/* Navigation button to return to the homepage */}
            <div className="back-cont">
                <button
                    className="btn-back"
                    onClick={() => {
                        playClickSound();
                        navigate('/');
                    }}
                >
                    <img
                        src="back.svg"
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

export default Lobbys;
