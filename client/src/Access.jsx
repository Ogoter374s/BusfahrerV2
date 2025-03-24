import BASE_URL from './config';

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Access() {
    const [selectedSound, setSelectedSound] = useState('/sounds/ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const navigate = useNavigate();

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
     * Handles form submission for login or registration.
     *
     * Prevents the default form behavior, determines the appropriate endpoint
     * based on the current mode (`login` or `register`), and sends the credentials
     * to the backend. Navigates to the homepage on success or displays an error on failure.
     *
     * @function handleSubmit
     * @async
     * @param {Event} e - The form submission event.
     * @throws {Error} If the fetch operation fails.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? 'login' : 'register';

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            const data = await response.json();
            if (data.success) {
                navigate('/');
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('An unexpected error occurred. Please try again later.');
            console.error(error);
        }
    };

    /**
     * Renders the login/register screen with a form and navigation options.
     *
     * Includes:
     * - Dynamic title and form fields for login or registration
     * - Input fields for username and password
     * - Submit button with click sound effect
     * - Toggle button to switch between login and register modes
     * - Back button to return to the homepage
     * - Overlay and logo styling for a unified game interface
     *
     * @returns {JSX.Element} Login/Register interface with interactive elements and styling.
     */
    return (
        <div className="overlay-cont">
            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main login/register container */}
            <div className="access-menu">
                {/* Game Logo displayed above the form */}
                <img src="logo.svg" alt="Game Logo" className="access-logo" />

                {/* Title dynamically switches between Login and Register */}
                <h1 className="access-title">
                    {isLogin ? 'Login' : 'Register'}
                </h1>

                {/* Form for handling user input (login or registration) */}
                <form onSubmit={handleSubmit}>
                    {/* Username input field */}
                    <input
                        className="rustic-input-access"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    {/* Password input field */}
                    <input
                        className="rustic-input-access"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {/* Submit button container */}
                    <div className="access-cont">
                        <button
                            className="btn-access"
                            type="submit"
                            onClick={() => playClickSound()}
                        >
                            <img
                                src="button.svg"
                                alt="Create Game"
                                className="access-icon"
                            />
                            <p className="btn-text-access">
                                {isLogin ? 'Login' : 'Register'}
                            </p>
                        </button>
                    </div>
                </form>

                {/* Switch button to toggle between Login and Register */}
                <div className="switch-cont">
                    <button
                        className="btn-switch"
                        onClick={() => {
                            playClickSound();
                            setIsLogin(!isLogin);
                        }}
                    >
                        {isLogin
                            ? 'Create an Account'
                            : 'Already have an account? Login'}
                    </button>
                </div>
            </div>

            {/* Back button to navigate to the home page */}
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
        </div>
    );
}

export default Access;
