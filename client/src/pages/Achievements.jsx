/**
 * Achievements.jsx — Displays the player's unlocked achievements and progress toward new ones.
 *
 * Retrieves achievement data from the backend and renders an interactive UI with expandable details.
 * Each achievement includes a title, icon, description, conditions, and unlock status.
 * Integrates sound effects and real-time UI toggling.
 */

// Components
import ChatSidebar from '../components/ChatSidebar';
import BackButton from '../components/BackButton';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

// React
import { useState, useEffect, useRef } from 'react';

/**
 * Achievements component function.
 *
 * Initializes sound preferences and loads achievement data once on mount.
 * Manages the state for expanded achievement details and toggling visibility.
 *
 * @function Achievements
 * @returns {JSX.Element} The rendered achievements screen layout.
 */
function Achievements() {
    const [achievements, setAchievements] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const init = useRef(false);
    const isAuthenticated = useAuthGuard();

    const labelMap = {
        gamesJoined: 'Joined Games',
        gamesPlayed: 'Games Played',
        drinksGiven: 'Drinks Given',
        drinksSelf: 'Drinks Self',
        numberEx: 'Number of Ex',
        maxDrinksGiven: 'Max Drinks Given',
        maxDrinksSelf: 'Max Drinks Self',
        maxCardsSelf: 'Max Cards Held',
        layedCards: 'Cards Laid',
        dailyLoginStreak: 'Daily Login Streak',
        gamesHosted: 'Games Hosted',
        topDrinker: 'Top Drinker',
        rowsFlipped: 'Rows Flipped',
        cardsPlayedPhase1: 'Cards Played Phase 1',
        cardsLeft: 'Cards Left',
        phase3Failed: 'Failed Phase 3',
        gamesWon: 'Games Won',
        maxRounds: 'Phase 3 Rounds',
        changedTheme: 'Changed the Theme',
        changedSound: 'Changed the Sound',
        uploadedAvatar: 'Uploaded an Avatar',
    };

    /**
     * fetchAchievements — Loads the player's unlocked achievements from the backend.
     *
     * Sends a request to `/get-achievements` and stores the returned achievement array.
     *
     * @function fetchAchievements
     * @returns {Promise<void>}
     * @throws {Error} If the fetch operation fails.
     */
    const fetchAchievements = async () => {
        const response = await fetch(`${BASE_URL}get-achievements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const account = await response.json();

        setAchievements(account.achievements);
    };
    
    /**
     * useEffect — Initializes achievements and sound on component mount.
     *
     * Prevents duplicate loading using a ref-based guard.
     * Fetches user achievements and loads their click sound preference.
     *
     * @function useEffect (achievements init)
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        SoundManager.loadUserSound(true);

        fetchAchievements();
    }, [isAuthenticated]);

    /**
     * toggleExpand — Toggles the visibility of an achievement's details.
     *
     * Plays a click sound and expands or collapses the clicked achievement.
     *
     * @function toggleExpand
     * @param {number} index - Index of the achievement to toggle.
     */
    const toggleExpand = (index) => {
        SoundManager.playClickSound();
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    /**
     * Renders the full achievements UI.
     *
     * Includes:
     * - Background overlay and title
     * - Scrollable list of achievements with status, icon, name, and optional title
     * - Expandable details with descriptions and condition progress
     * - Navigation back button and chat sidebar
     */
    return (
        <div className="overlay-cont">
            {/* Decorative background overlay */}
            <img
                src="overlay_account.svg"
                alt="Overlay"
                className="overlay-img"
            />

            {/* Achievements container */}
            <div className="achievements-container">
                {/* Account title */}
                <h1 className="achievements-title">Achievements</h1>

                <div className="achievements-list">
                    {/* Achievements List */}
                    {achievements.map((ach, index) => (
                        <div key={index} className="achievement-box">
                            <div
                                className="achievement-header"
                                onClick={() => toggleExpand(index)}
                            >
                                <img
                                    src={`/achievements/${ach.icon}`}
                                    alt="Icon"
                                    className="achievement-icon"
                                />
                                <span className="achievement-name">
                                    {ach.name}
                                </span>
                                {ach.title && (
                                    <div className="achievement-title">
                                        <span
                                            style={{ color: ach.title.color }}
                                        >
                                            {ach.title.name}
                                        </span>
                                    </div>
                                )}
                                <span className="achievement-status">
                                    {ach.unlocked ? '🏆' : '❌'}
                                </span>
                            </div>

                            {expandedIndex === index && (
                                <div className="achievement-details">
                                    <p className="achievement-description">
                                        {ach.description}
                                    </p>
                                    <div className="achievement-conditions">
                                        <ul>
                                            {ach.conditions.map((cond, i) => {
                                                const completed =
                                                    cond.current >=
                                                    cond.required;
                                                return (
                                                    <li key={i}>
                                                        {labelMap[cond.key] ||
                                                            cond.key}
                                                        : {cond.current} /{' '}
                                                        {cond.required}{' '}
                                                        {completed
                                                            ? '✅'
                                                            : '❌'}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Back button to navigate to the Account page */}
            <BackButton to="/account" />

            {/* Sidebar Toggle */}
            <ChatSidebar />
        </div>
    );
}

export default Achievements;
