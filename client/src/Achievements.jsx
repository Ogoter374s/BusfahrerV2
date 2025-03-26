import BASE_URL, { WBS_URL } from './config';
import ChatSidebar from './ChatSidebar';

import { useState, useEffect, useRef, use } from 'react';
import { useNavigate } from 'react-router-dom';

function Achievements() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [achievements, setAchievements] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const navigate = useNavigate();
    const init = useRef(false);

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
     * Fetches the user's unlocked achievements from the backend.
     *
     * Sends a GET request to the `/get-achievements` endpoint using HttpOnly cookie authentication.
     * Updates the local state with the list of achievements retrieved from the server.
     *
     * @function fetchAchievements
     * @async
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
     * Initializes the Achievements screen on component mount.
     *
     * Ensures that data is fetched only once using a ref guard.
     * - Fetches the user's unlocked achievements.
     * - Fetches the user's selected click sound preference.
     *
     * @function useEffect
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchAchievements();

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
     * Fetches the user's selected click sound preference.
     *
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio element source accordingly.
     * Uses HttpOnly cookies for authentication.
     *
     * @function fetchSoundPreference
     * @throws {Error} If the request fails or the sound data cannot be retrieved.
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
     * Toggles the expanded state of an achievement description.
     *
     * Plays a click sound and expands the selected achievement if it is collapsed,
     * or collapses it if it is already expanded.
     *
     * @function toggleExpand
     * @param {number} index - The index of the achievement to toggle.
     */
    const toggleExpand = (index) => {
        playClickSound();
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    /**
     * Navigates the user back to the Account page.
     *
     * Plays a click sound for UI feedback and redirects to the "/account" route.
     *
     * @function handleBack
     */
    const handleBack = () => {
        playClickSound();
        navigate('/account');
    };

    /**
     * Renders the Achievements screen UI.
     *
     * Displays a scrollable list of all user achievements with the following features:
     * - Achievement icon, name, unlock status, and optional title
     * - Expandable detail section showing description and progress conditions
     * - Clickable headers to toggle expanded view per achievement
     * - Back button to navigate to the Account screen
     *
     * @returns {JSX.Element} Achievements overview and progress tracker.
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

            {/* Back button to navigate to the home page */}
            <div className="back-cont">
                <button className="btn-back" onClick={handleBack}>
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

export default Achievements;
