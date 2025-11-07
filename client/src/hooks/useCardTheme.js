/**
 * @fileoverview Custom hook for managing card themes.
 * <br><br>
 * This hook provides functionality to load and save card themes, including colors and theme names. <br>
 * It interacts with the backend to persist user preferences.
 */

// Utilities
import BASE_URL from "../utils/config";
import { PopupManager } from "../utils/popupManager";
import { cardThemes } from "../utils/constants";

// React
import { useEffect, useState } from 'react';

/**
 * A custom React hook for managing card themes. <br>
 * This hook provides functionality to load and save card themes, including colors and theme names. <br>
 * It interacts with the backend to persist user preferences.
 * <br><br>
 * <strong>loadTheme:</strong> <br>
 * This function fetches the current card theme from the backend and updates the state variables accordingly.
 * <br><br>
 * <strong>saveTheme:</strong> <br>
 * This function saves the current card theme to the backend. <br>
 * It accepts optional parameters to override the current state values.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This effect runs once when the component mounts to load the current theme.
 * <br><br>
 * @function useCardTheme
 * @returns {Object} An object containing the current theme, colors, and functions to load and save themes.
 */
const useCardTheme = () => {
    const [selectedTheme, setSelectedTheme] = useState('default');
    const [color1, setColor1] = useState('#ffffff');
    const [color2, setColor2] = useState('#ff4538');

    /**
     * Loads the current card theme from the backend and updates state variables.
     * This function fetches the theme data and sets the `selectedTheme`, `color1`, and `color2` state variables.
     * If the fetch fails, it logs an error to the console.
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
     * Saves the current card theme to the backend.
     * This function accepts optional parameters to override the current state values before saving.
     * It sends a POST request to the backend with the theme data. 
     * If the save fails, it logs an error to the console.
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

            const data = await response.json();

            if (!data.success) {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.error,
                    icon: '❌',
                });
            }

            return true;
        } catch (err) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error('Error saving card theme:', err);
            return false;
        }
    };

    /**
     * Effect hook to load the theme when the component mounts.
     * This effect runs once on component mount to fetch and set the current card theme.
     */
    useEffect(() => {
        loadTheme();
    }, []);

    return {
        cardThemes,

        selectedTheme,
        setSelectedTheme,

        color1,
        setColor1,
        color2,
        setColor2,

        saveTheme,
        loadTheme,
    };
};

export default useCardTheme;