/**
 * useCardTheme.js — Custom hook for managing a player's card theme and color preferences.
 *
 * Loads the player's saved card design from the backend and applies it across the UI.
 * Also provides setters to update theme and color values in local state.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useState } from 'react';

/**
 * useCardTheme hook function.
 *
 * Fetches the current user's saved card theme and associated colors on mount.
 * Stores the theme and color values in local state for use across components.
 *
 * @function useCardTheme
 * @returns {Object} An object containing:
 *   {string} selectedTheme - The ID of the current card theme.
 *   {string} color1 - The primary color for the theme.
 *   {string} color2 - The secondary/pattern color for the theme.
 *   {Function} setSelectedTheme - Setter for theme ID.
 *   {Function} setColor1 - Setter for primary color.
 *   {Function} setColor2 - Setter for pattern color.
 */
const useCardTheme = () => {
    const [selectedTheme, setSelectedTheme] = useState('default');
    const [color1, setColor1] = useState('#ffffff');
    const [color2, setColor2] = useState('#ff4538');

    const cardThemes = [
        { name: 'Classic', path: 'default' },
        { name: 'Bricks', path: 'bricks' },
        { name: 'Hexagon', path: 'hexagon' },
        { name: 'Shingles', path: 'shingles' },
        { name: 'Square', path: 'square' },
        { name: 'Leafs', path: 'leafs' },
    ];

    /**
     * loadTheme — Fetches the saved card theme and color preferences from the backend.
     *
     * Sends a GET request to retrieve the user's current theme, primary color, and pattern color.
     * Updates local state with the retrieved values. Logs errors if the request fails.
     *
     * @function loadTheme
     * @returns {Promise<void>}
     */
    const loadTheme = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-card-theme`, {
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch theme');

            const data = await response.json();
            setSelectedTheme(data.theme);
            setColor1(data.color1);
            setColor2(data.color2);
        } catch (error) {
            console.error('Error loading card theme:', error);
        }
    };

    /**
     * saveTheme — Persists the card theme and colors to the backend.
     *
     * Accepts optional overrides; falls back to current state if not provided.
     * Sends a POST request with the selected theme and colors.
     * Returns `true` if successful, or `false` if the save fails.
     *
     * @function saveTheme
     * @param {string} [themeOverride] - Optional override for the theme ID.
     * @param {string} [color1Override] - Optional override for the primary color.
     * @param {string} [color2Override] - Optional override for the secondary/pattern color.
     * @returns {Promise<boolean>} Whether the save operation was successful.
     */
    const saveTheme = async (themeOverride, color1Override, color2Override) => {
        const themeToSave = themeOverride || selectedTheme;
        const c1 = color1Override || color1;
        const c2 = color2Override || color2;

        try {
            const response = await fetch(`${BASE_URL}set-card-theme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ theme: themeToSave, color1: c1, color2: c2 }),
            });

            if (!response.ok) throw new Error('Save failed');
            return true;
        } catch (err) {
            console.error('Error saving card theme:', err);
            return false;
        }
    };

    /**
     * useEffect — Fetches saved card theme preferences on hook initialization.
     *
     * Makes a backend request (e.g. /get-card-theme) to retrieve the player's
     * previously selected theme and colors, then stores them in local state.
     *
     * @function useEffect (initial fetch)
     */
    useEffect(() => {
        loadTheme();
    }, []);

    /**
     * Returns the card theme hook state and utilities.
     *
     * Exposes the current theme and color values along with their setters,
     * and provides functions for loading and saving preferences.
     *
     * @returns {Object} Card theme management object:
     *   {string} selectedTheme - Currently selected theme ID.
     *   {Function} setSelectedTheme - Updates the selected theme.
     *   {string} color1 - Primary theme color.
     *   {Function} setColor1 - Updates the primary color.
     *   {string} color2 - Secondary pattern color.
     *   {Function} setColor2 - Updates the secondary color.
     *   {Function} saveTheme - Persists the selected theme and colors to the backend.
     *   {Function} loadTheme - Loads saved theme and color settings from the backend.
     *   {Array<Object>} cardThemes - Available theme definitions for selection and display.
     */
    return {
        selectedTheme,
        setSelectedTheme,
        color1,
        setColor1,
        color2,
        setColor2,
        saveTheme,
        loadTheme,
        cardThemes,
    };
};

export default useCardTheme;