import BASE_URL, { WBS_URL } from './config';

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Join() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendCode, setFriendCode] = useState('');
    const [userFriendCode, setUserFriendCode] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [selectedChat, setSelectedChat] = useState('');
    const selectedFriend = useRef('');

    const { gameId } = useParams();

    const [playerName, setPlayerName] = useState('');
    const [gender, setGender] = useState('Male');

    const navigate = useNavigate();
    const wsRef = useRef(null);
    const init = useRef(false);

    /**
     * Fetches pending friend requests for the authenticated user.
     *
     * Sends a GET request to the backend endpoint `/get-friend-requests`
     * using HttpOnly cookies for authentication. Updates the local state
     * with the list of pending friend requests.
     *
     * @function fetchFriendRequests
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchFriendRequests = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-friend-requests`, {
                credentials: 'include',
            });
            const data = await response.json();
            setPendingRequests(data.pending || []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    /**
     * Fetches the list of friends for the authenticated user.
     *
     * Sends a GET request to the backend endpoint `/get-friends`
     * using HttpOnly cookies for authentication. Updates the local state
     * with the list of friends retrieved from the server.
     *
     * @function fetchFriends
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchFriends = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-friends`, {
                credentials: 'include',
            });
            const data = await response.json();
            setFriends(data.friends || []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    /**
     * Fetches the user's unique friend code.
     *
     * Sends a GET request to the backend endpoint `/get-friend-code`
     * using HttpOnly cookies for authentication. Updates the local state
     * with the retrieved friend code.
     *
     * @function fetchUserFriendCode
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const fetchUserFriendCode = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-friend-code`, {
                credentials: 'include',
            });
            const data = await response.json();
            setUserFriendCode(data.friendCode);
        } catch (error) {
            console.error('Error fetching friend code:', error);
        }
    };

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

    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchSoundPreference();
    }, []);

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
     * Handles joining a game by sending the player's details to the backend.
     *
     * Validates that the player name is provided. Sends a POST request to the backend
     * with the player's name and gender. Authentication is handled via an HttpOnly cookie.
     * Navigates to the game page if successful or displays an error message otherwise.
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
            </div>
        </div>
    );
}

export default Join;
