import BASE_URL from './config';
import ChatSidebar from './ChatSidebar';

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Join() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const { gameId } = useParams();

    const [playerName, setPlayerName] = useState('');
    const [gender, setGender] = useState('Male');

    const navigate = useNavigate();
    const init = useRef(false);

    /**
     * Fetches the user's selected click sound preference.
     *
     * Checks if the user is authenticated before making a request.
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio source accordingly.
     * Uses HttpOnly cookies for authentication.
     *
     * @function fetchSoundPreference
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchSoundPreference = async () => {
        if (!isAuthenticated) return;

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
     * Initializes the join screen by fetching the user's sound preference on first render.
     *
     * Ensures the sound preference is fetched only once using a ref-based initialization flag.
     * Retrieves the saved click sound from the backend to personalize audio feedback during interactions.
     *
     * @function useEffect
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchSoundPreference();
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
     * Handles the process of joining a game with a given player name and gender.
     *
     * Validates the player name to ensure it is not empty, then trims and limits it
     * to 26 characters to enforce length constraints. Sends a POST request to the
     * backend `join-game/:gameId` endpoint with the player's name and selected gender.
     * Uses HttpOnly cookies for secure session authentication.
     *
     * On success, navigates the player to the game lobby. If the backend returns an error,
     * displays an appropriate alert message to the user.
     *
     * Plays a click sound before initiating the request to enhance user feedback.
     *
     * @async
     * @function handleJoin
     * @returns {Promise<void>} A promise that resolves after the join operation completes or fails.
     * @throws {Error} If the fetch request encounters a network or server error.
     */
    const handleJoin = async () => {
        playClickSound();
        if (!playerName || playerName.trim() === '') {
            alert('Please provide a valid player name.');
            return;
        }

        const trmPlayerName = playerName.trim().slice(0, 26);

        try {
            const response = await fetch(`${BASE_URL}join-game/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ playerName: trmPlayerName, gender }),
            });

            const data = await response.json();

            if (response.ok) {
                navigate(`/game/${gameId}`);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Unexpected error joining the game:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    /**
     * Renders the Join Game screen UI for entering player details and joining an existing game.
     *
     * Displays a structured form for the user to input their player name and select a gender.
     * Includes a "Join Game" button that triggers the join request, along with a navigation
     * button to return to the lobby list. Branding elements like the game logo and overlay
     * are included to maintain visual consistency.
     *
     * Also includes the ChatSidebar component for ongoing communication.
     *
     * @function JSX Return Block
     * @returns {JSX.Element} A React component that renders the join game interface.
     */
    return (
        <div className="overlay-cont">

            {/* Background decorative overlay */}
            <img src="/overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main menu for joining a game */}
            <div className="join-menu">
                {/* Game logo displayed at the top */}
                <img src="/logo.svg" alt="Game Logo" className="join-logo" />

                {/* Title indicating the "Join Game" section */}
                <h1 className="join-title">
                    Join
                    <span className="highlight">Game</span>
                </h1>

                {/* Form for entering player details */}
                <div className="rustic-form-join">
                    <input
                        type="text"
                        placeholder="Player Name"
                        className="rustic-input"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />

                    {/* Gender selection dropdown */}
                    <label className="rustic-label">Gender:</label>
                    <select
                        className="gender-select"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Divers">Divers</option>
                    </select>
                </div>

                {/* Button to join the game */}
                <div className="join-cont">
                    <button className="btn-join" onClick={handleJoin}>
                        <img
                            src="/button.svg"
                            alt="Create Game"
                            className="join-icon"
                        />
                        <p className="btn-text-join">Join Game</p>
                    </button>
                </div>
            </div>

            {/* Navigation button to go back to the lobby selection screen */}
            <div className="back-cont">
                <button
                    className="btn-back"
                    onClick={() => {
                        playClickSound();
                        navigate('/lobbys');
                    }}
                >
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

export default Join;
