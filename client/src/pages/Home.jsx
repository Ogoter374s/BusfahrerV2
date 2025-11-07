/**
 * @fileoverview Renders the Home screen of the game.
 * <br><br>
 * This module displays the main menu interface, including buttons to create or join a game,
 * a settings button, and an optional chat sidebar.<br> It uses authentication to determine
 * what UI elements are enabled or visible.<br> On mount, it loads user-specific sounds
 * if the user is authenticated.
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
 * Home component serves as the main entry point for the game.
 * <br><br>
 * Renders the homepage UI with navigation buttons, a settings button,
 * and a chat sidebar if the user is authenticated.
 * <br>
 * When the component mounts, it loads user-specific sounds using a `useEffect` hook,
 * but only if the user is authenticated.
 * <br><br>
 * <strong>useEffect: </strong> <br>
 * Load user-specific sound settings when the component mounts or when authentication status changes.<br> 
 * This ensures that sound settings are applied only if the user is authenticated
 * and prevents unnecessary sound loading for unauthenticated users. <br>
 * This is important for performance and user experience. <br>
 * The SoundManager utility is responsible for managing sound effects and music in the game.
 * 
 * @function Home
 * @returns {JSX.Element} The rendered Home interface.
 */
function Home() {
    const isAuthenticated = useAuthGuard();

    /**
     * Load user-specific sound settings when the component mounts or when authentication status changes 
     * This ensures that sound settings are applied only if the user is authenticated
     * and prevents unnecessary sound loading for unauthenticated users.
     * This is important for performance and user experience.
     * The SoundManager utility is responsible for managing sound effects and music in the game.
     */
    useEffect(() => {
        if (isAuthenticated) {
            SoundManager.loadUserSound(isAuthenticated);
        }
    }, [isAuthenticated]);

    return (
        <div className="@container/main flex flex-col items-center justify-center h-screen">

            {/* Background overlay image */}
            <div className="home-wrapper">
                
                {/* Game logo displayed prominently on the homepage */}
                <QuoteLogo />

                {/* Main menu buttons */}
                <h1 className="home-menu">
                    Busfahrer
                    <span className="txt-highlight">
                        Extreme
                    </span>
                </h1>

                <div className="flex flex-col gap-2 sm:gap-0.5 lg:gap-1 xl:gap-2 2xl:gap-3">
                    {/* Button to create a new game; disabled if user is not authenticated */}
                    <MenuButton
                        wrapper={true}
                        buttonClass="home-btn"
                        textClass="btn-txt"
                        icon={isAuthenticated ? 'home' : 'button_disabled'}
                        text="Play Game"
                        disabled={!isAuthenticated}
                        to="/create"
                    />
                    
                    {/* Button to join an existing game lobby; disabled if user is not authenticated */}
                    <MenuButton
                        wrapper={true}
                        buttonClass="home-btn"
                        textClass="btn-txt"
                        icon={isAuthenticated ? 'home' : 'button_disabled'}
                        text="Join Game"
                        disabled={!isAuthenticated}
                        to="/lobbies"
                    />
                </div>
            </div>

            {/* Settings button redirects to login/register page or account settings based on authentication status <SettingsButton isAuthenticated={isAuthenticated} />*/}
            <SettingsButton isAuthenticated={isAuthenticated} />

            {/* Sidebar Toggle (Only if Authenticated) */}
            {isAuthenticated && <ChatSidebar />}
        </div>
    );
}

export default Home;