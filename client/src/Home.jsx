import BASE_URL from './config';
import ChatSidebar from './ChatSidebar';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [selectedSound, setSelectedSound] = useState('/sounds/ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const navigate = useNavigate();
    const init = useRef(false);

    /**
     * Checks if the user is currently authenticated.
     *
     * Sends a GET request to the backend endpoint `/check-auth` using HttpOnly cookies.
     * On success, updates the `isAuthenticated` state based on the server response.
     * On failure, logs the error and sets `isAuthenticated` to false.
     *
     * @function checkAuth
     * @async
     * @throws {Error} If the fetch operation fails.
     */
    const checkAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}check-auth`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();
            setIsAuthenticated(data.isAuthenticated);
        } catch (error) {
            console.error('Error checking authentication:', error);
            setIsAuthenticated(false);
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

    /**
     * Initializes friend-related data and WebSocket connection on component mount or auth change.
     *
     * On mount or when `isAuthenticated` changes, this hook performs the following:
     * - Fetches the user's selected sound preference.
     * - If authenticated:
     *   - Initializes the WebSocket connection (only once) for receiving real-time updates.
     * - Calls `checkAuth` to validate the authentication state.
     * Cleans up by closing the WebSocket connection when the component unmounts or reloads.
     *
     * @function useEffect
     */
    useEffect(() => {
        fetchSoundPreference();

        if (isAuthenticated) {
            if (init.current) return;
            init.current = true;
        }

        checkAuth();

    }, [isAuthenticated]);

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
     * Handles navigation to the settings or login page based on authentication state.
     *
     * Plays a click sound, then navigates to the account page if the user is authenticated,
     * or to the login/access page if not.
     *
     * @function settings
     */
    const settings = () => {
        playClickSound();
        navigate(!isAuthenticated ? '/access' : '/account');
    };

    /**
     * Renders the main homepage UI with navigation, friend system, and chat sidebar.
     *
     * Includes the following interactive elements:
     * - Play and Join Game buttons (only enabled when authenticated)
     * - Settings button that routes to login or account settings
     * - Sidebar toggle for chat and friend requests (only visible when authenticated)
     * - Friend system with add, accept, decline, remove functionality
     * - Real-time chat interface with message history and unread indicators
     * - User's friend code display with clipboard copy option
     *
     * @returns {JSX.Element} Main homepage layout with friend and chat functionalities.
     */
    return (
        <div className="overlay-cont">
            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main menu container */}
            <div className="main-menu">
                {/* Game logo displayed prominently on the homepage */}
                <img src="logo.svg" alt="Game Logo" className="home-logo" />

                {/* Main game title with highlighted sub-title */}
                <h1 className="home-title">
                    Busfahrer
                    <span className="highlight">Extreme</span>
                </h1>

                {/* Button to create a new game; disabled if user is not authenticated */}
                <div className="play-cont">
                    <button
                        className={
                            !isAuthenticated ? 'btn-play-disabled' : 'btn-play'
                        }
                        onClick={() => {
                            playClickSound();
                            navigate('/create');
                        }}
                        disabled={!isAuthenticated}
                    >
                        <img
                            src={
                                isAuthenticated
                                    ? 'home.svg'
                                    : 'button_disabled.svg'
                            }
                            alt="Create Game"
                            className="play-icon"
                        />
                        <p className="btn-text-play">Play Game</p>
                    </button>
                </div>

                {/* Button to join an existing game lobby; disabled if user is not authenticated */}
                <div className="lobby-cont">
                    <button
                        className={
                            !isAuthenticated
                                ? 'btn-lobby-disabled'
                                : 'btn-lobby'
                        }
                        onClick={() => {
                            playClickSound();
                            navigate('/lobbys');
                        }}
                        disabled={!isAuthenticated}
                    >
                        <img
                            src={
                                isAuthenticated
                                    ? 'home.svg'
                                    : 'button_disabled.svg'
                            }
                            alt="Create Game"
                            className="lobby-icon"
                        />
                        <p className="btn-text-lobby">Join Game</p>
                    </button>
                </div>
            </div>

            {/* Settings button redirects to login/register page or account settings based on authentication status */}
            <div className="settings-button">
                <button className="btn" onClick={settings}>
                    <img
                        src={!isAuthenticated ? 'login.svg' : 'settings.svg'}
                        alt="Settings"
                        className="settings-icon"
                    />
                </button>
            </div>

            {/* Sidebar Toggle (Only if Authenticated) */}
            {isAuthenticated && (
                <ChatSidebar />
            )}
        </div>
    );
}

export default Home;
