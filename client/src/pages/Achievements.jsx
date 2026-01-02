/**
 * @fileoverview Achievements page for displaying user achievements.
 * <br><br>
 * This page fetches and displays a list of user achievements with details such as name, description, icon, and conditions. <br>
 * Users can expand each achievement to view more information.
 */

// Components
import ChatSidebar from '../components/ChatSidebar';
import BackButton from '../components/BackButton';
import DustLayer from '../components/DustLayer';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';
import { achievLabels } from '../utils/constants';

// React
import { useState, useEffect, useRef } from 'react';

/**
 * Achievements Page Component
 * <br><br>
 * This page fetches and displays a list of user achievements with details such as name, description, icon, and conditions. <br>
 * Users can expand each achievement to view more information.
 * <br><br>
 * It uses the `useAuthGuard` hook to ensure that only authenticated users can access this page. <br>
 * The achievements data is fetched from the server when the component mounts. <br>
 * Each achievement can be expanded or collapsed to show or hide its details.
 * <br><br>
 * <strong>fetchAchievements:</strong> <br>
 * This asynchronous function fetches the user's achievements from the server. <br>
 * It sends a GET request to the `get-achievements` endpoint and updates the `achievements` state with the received data.
 * <br><br>
 * <strong>toggleExpand:</strong> <br>
 * This function toggles the expanded state of an achievement. <br>
 * It takes the index of the achievement as an argument and updates the `expandedIndex` state accordingly.
 * <strong>useEffect:</strong> <br>
 * This hook runs when the component mounts and when the `isAuthenticated` state changes. <br>
 * It ensures that the achievements are fetched only once when the user is authenticated.
 * 
 * @function Achievements
 * @returns {JSX.Element} The rendered Achievements page component.
 */
function Achievements() {
    const [achievements, setAchievements] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const init = useRef(false);
    const isAuthenticated = useAuthGuard();

    /**
     * Fetches the user's achievements from the server and updates the state.
     * This function sends a GET request to the `get-achievements` endpoint and updates the `achievements` state with the received data.
     */
    const fetchAchievements = async () => {
        const response = await fetch(`${BASE_URL}get-achievements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        setAchievements(data);
    };

    /**
     * Effect hook to fetch achievements when the component mounts and when the user is authenticated.
     * This hook ensures that the achievements are fetched only once when the user is authenticated.
     * It uses a ref to track whether the initialization has already occurred to prevent multiple fetches.
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        SoundManager.loadUserSound(true);

        fetchAchievements();
    }, [isAuthenticated]);

    /**
     * Toggles the expanded state of an achievement.
     * This function takes the index of the achievement as an argument and updates the `expandedIndex` state accordingly.
     * If the clicked achievement is already expanded, it collapses it; otherwise, it expands the clicked achievement.
     */
    const toggleExpand = (index) => {
        SoundManager.playClickSound();
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className="@container/achievements flex flex-col items-center justify-center h-screen">

            {/* Background overlay image */}
            <div className="achievements-wrapper">

                {/* Account title */}
                <h1 className="achievements-title">
                    Achievements
                </h1>

                <div className="achievement-list">

                    {/* Achievements List */}
                    {achievements.map((ach, index) => (
                        <div
                            key={index}
                            className="achievement-wrapper"
                        >

                            {/* Achievement Header */}
                            <div
                                className="flex items-center justify-between"
                                onClick={() => toggleExpand(index)}
                            >

                                {/* Achievement Icon and Name */}
                                <div className="flex items-center flex-1 min-w-0">
                                    <img
                                        src={`/achievements/${ach.icon}`}
                                        alt="Icon"
                                        className="achievement-icon"
                                    />

                                    <span className="achievement-name">
                                        {ach.name}
                                    </span>
                                </div>

                                {/* Achievement Title and Status */}
                                <div className="flex items-center shrink-0">
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
                            </div>

                            {/* Achievement Details Dropdown */}
                            {expandedIndex === index && (
                                <div
                                    className="achievement-dropdown"
                                    onClick={() => toggleExpand(index)}
                                >
                                    <p className="dropdown-text">
                                        {ach.description}
                                    </p>

                                    {/* Achievement Conditions List */}
                                    <ul className="dropdown-list">
                                        {ach.conditions.map((cond, i) => {
                                            const completed =
                                                cond.current >=
                                                cond.required;
                                            return (
                                                <li key={i}>
                                                    {achievLabels[cond.key] ||
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
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Back button to navigate to the Account page */}
            <BackButton to="/account" />

            {/* Sidebar Toggle */}
            <ChatSidebar />

            <DustLayer
                density={200}
                maxSize={2.5}
                minSize={0.7}
                speed={0.2}
                sway={0.2}
                tint="255,255,255"
                opacity={0.3}
            />
        </div>
    );
}

export default Achievements;
