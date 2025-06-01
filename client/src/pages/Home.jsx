/**
 * Home.jsx — Main entry screen for authenticated users in the Busfahrer Extreme game.
 *
 * Provides access to game creation, game joining, user settings, and chat features.
 * UI and interaction availability are dynamically rendered based on the user's authentication status.
 */

// Components
import MenuButton from '../components/MenuButton';
import SettingsButton from '../components/SettingsButton';
import ChatSidebar from '../components/ChatSidebar';
import QuoteLogo from '../components/QuoteLogo';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useEffect } from 'react';

/**
 * Home component function.
 *
 * Determines if the user is authenticated using a custom auth guard hook.
 * Loads the user's sound preference when authentication state changes.
 * Renders the main UI including background, game title, play/join buttons, settings,
 * and the chat sidebar if the user is authenticated.
 *
 * @function Home
 * @returns {JSX.Element} The rendered homepage layout.
 */
function Home() {
    const isAuthenticated = useAuthGuard();

    /**
     * Loads the authenticated user's sound preferences when authentication state changes.
     *
     * Invokes the SoundManager to retrieve and apply the user's selected sound if authenticated.
     * Runs every time the `isAuthenticated` dependency value changes.
     */
    useEffect(() => {
        if (isAuthenticated) {
            SoundManager.loadUserSound(isAuthenticated);
        }
    }, [isAuthenticated]);

    /**
     * Renders the main homepage layout of the game.
     *
     * Displays the background overlay, game logo, and title.
     * Shows "Play Game" and "Join Game" buttons which are only enabled for authenticated users.
     * Includes a settings button that navigates to either login/register or account settings.
     * If the user is authenticated, also displays the chat sidebar component.
     */
    return (
        <div className="overlay-cont">
            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main menu container */}
            <div className="main-menu">
                {/* Game logo displayed prominently on the homepage */}
                <QuoteLogo />

                {/* Main game title with highlighted sub-title */}
                <h1 className="home-title">
                    Busfahrer
                    <span className="highlight">Extreme</span>
                </h1>

                {/* Button to create a new game; disabled if user is not authenticated */}
                <MenuButton
                    wrapperClass="play-cont"
                    buttonClass={isAuthenticated ? 'btn-play' : 'btn-play-disabled'}
                    icon={isAuthenticated ? 'home.svg' : 'button_disabled.svg'}
                    alt="Create Game"
                    text="Create Game"
                    disabled={!isAuthenticated}
                    to="/create"
                />

                {/* Button to join an existing game lobby; disabled if user is not authenticated */}
                <MenuButton
                    wrapperClass="lobby-cont"
                    buttonClass={isAuthenticated ? 'btn-lobby' : 'btn-lobby-disabled'}
                    icon={isAuthenticated ? 'home.svg' : 'button_disabled.svg'}
                    alt="Join Game"
                    text="Join Game"
                    disabled={!isAuthenticated}
                    to="/lobbys"
                />
            </div>

            {/* Settings button redirects to login/register page or account settings based on authentication status */}
            <SettingsButton isAuthenticated={isAuthenticated} />

            {/* Sidebar Toggle (Only if Authenticated) */}
            {isAuthenticated && <ChatSidebar />}
        </div>
    );
}

export default Home;
