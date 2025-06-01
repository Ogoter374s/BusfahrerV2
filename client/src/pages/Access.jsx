/**
 * Access.jsx — Handles user authentication for the Busfahrer Extreme game.
 *
 * Provides login and registration functionality within a unified interface.
 * Renders the appropriate form elements and handles authentication state transitions.
 * Navigates to the main screen upon successful login or registration.
 */

// Components
import MenuInput from '../components/MenuInput';
import MenuButton from '../components/MenuButton';
import BackButton from '../components/BackButton';
import PopupModal from '../components/PopUpModal';

// Utilities
import BASE_URL from '../utils/config';
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Access component function.
 *
 * Manages state for user credentials and login/register mode.
 * Submits user input to the appropriate backend endpoint for authentication.
 * Navigates to the homepage if authentication succeeds, or displays errors otherwise.
 *
 * @function Access
 * @returns {JSX.Element} The rendered login/register interface.
 */
function Access() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const navigate = useNavigate();

    useEffect(() => {
        PopupManager.initPopupManager(setPopup);
    }, []);
      

    /**
     * Handles form submission for login or registration.
     *
     * Prevents default form behavior, determines the appropriate endpoint,
     * and sends a POST request with user credentials.
     * On success, redirects the user to the homepage; otherwise shows an alert.
     *
     * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
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
                PopupManager.showPopup({
                    title: data.title, 
                    message: data.message, 
                    icon: '🚫'
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error(error);
        }
    };

    /**
     * Renders the access form layout.
     *
     * Displays the background, logo, form inputs, dynamic titles,
     * submit button, toggle mode button, and the back button.
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
                    <MenuInput
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        cssName="rustic-input-access"
                        required
                    />

                    {/* Password input field */}
                    <MenuInput
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        cssName="rustic-input-access"
                        required
                    />

                    {/* Submit button container */}
                    <MenuButton
                        wrapperClass="access-cont"
                        buttonClass="btn-access"
                        icon="button.svg"
                        alt="Create Game"
                        text={isLogin ? 'Login' : 'Register'}
                        type="submit"
                    />
                </form>

                {/* Switch button to toggle between Login and Register */}
                <MenuButton
                    wrapperClass="switch-cont"
                    buttonClass="btn-switch"
                    text={
                        isLogin
                            ? 'Create an Account'
                            : 'Already have an account? Login'
                    }
                    textOnly={true}
                    onClick={() => setIsLogin(!isLogin)}
                />
            </div>

            {/* Back button to navigate to the home page */}
            <BackButton />

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={PopupManager.closePopup}
            />
        </div>
    );
}

export default Access;
