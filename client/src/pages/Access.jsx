/**
 * @fileoverview Access component for user authentication.
 * <br><br>
 * This component allows users to log in or register an account with a username and password. <br>
 * It manages the authentication state and displays error messages through a popup modal when login or registration fails.
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
 * Access component serves as the user authentication interface.
 * <br><br>
 * It allows users to log in or register an account with a username and password. <br>
 * The component manages the authentication state and displays error messages
 * through a popup modal when login or registration fails.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * Initializes the PopupManager to handle popup messages when the component mounts. <br>
 * This ensures that the popup system is ready to display messages for user actions.
 * <br><br>
 * <strong>handleSubmit:</strong> <br>
 * Handles the form submission for either logging in or registering a user. <br>
 * It sends a POST request to the server with the username and password,
 * and processes the response to either navigate to the home page on success
 * or display an error message in a popup modal on failure.
 * 
 * @function Access
 * @returns {JSX.Element} The rendered Access interface.
 */
function Access() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const navigate = useNavigate();

    /**
     * Initializes the PopupManager to handle popup messages when the component mounts.
     * This ensures that the popup system is ready to display messages for user actions.
     */
    useEffect(() => {
        PopupManager.initPopupManager(setPopup);
    }, []);
    
    /**
     * Handles the form submission for either logging in or registering a user.
     * It sends a POST request to the server with the username and password,
     * and processes the response to either navigate to the home page on success
     * or display an error message in a popup modal on failure.
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
                    message: data.error, 
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

    return (
        <div className="@container/access flex flex-col items-center justify-center h-screen">
            
            {/* Background overlay image */}
            <div className="access-wrapper"
            >
                {/* Game Logo displayed above the form */}
                <div className="access-logo">
                    <img 
                        src="/logos/logo.svg" 
                        alt="Game Logo"
                        className="
                            pointer-events-none select-none 
                            mx-auto block w-full h-auto"
                    />
                </div>

                {/* Title dynamically switches between Login and Register */}
                <h1 className="access-home">
                    {isLogin ? 'Login' : 'Register'}
                </h1>

                {/* Form for handling user input (login or registration) */}
                <form className="
                        flex flex-col
                        items-center justify-center
                        w-full max-w-md
                        gap-3"
                    onSubmit={handleSubmit}
                >
                    {/* Username input field */}
                    <MenuInput
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        img="wood_green"
                        required
                    />

                    {/* Password input field */}
                    <MenuInput
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        img="wood_green"
                        required
                    />

                    {/* Submit button container */}
                    <MenuButton
                        wrapper={true}
                        buttonClass="access-btn"
                        textClass="btn-txt"
                        icon="button"
                        text={isLogin ? 'Login' : 'Register'}
                    />
                </form>

                {/* Switch button to toggle between Login and Register */}
                <MenuButton
                    wrapper={true}
                    buttonClass="access-btn"
                    textClass="access-txt"
                    textOnly={true}
                    text={
                        isLogin
                            ? 'Create an Account'
                            : 'Already have an account? Login'
                    }
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
                onOk={PopupManager.okPopup}
                onCancel={PopupManager.cancelPopup}
                useCancel={popup.useCancel}
            />
        </div>
    );
}

export default Access;