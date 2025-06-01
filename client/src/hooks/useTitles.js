/**
 * useTitles.js — Custom hook for managing user title and badge selection.
 *
 * Retrieves available titles and the currently selected title from the backend.
 * Allows the user to update and save their selected title with optional styling.
 */

// Utilities
import BASE_URL from '../utils/config';

// React
import { useState } from 'react';

/**
 * useTitles hook function.
 *
 * Initializes state for selected title and available title options.
 * Loads current title data on mount and provides a function to save new selections.
 *
 * @function useTitles
 * @returns {Object} Title management object:
 *   {Object|null} selectedTitle - The title currently assigned to the user.
 *   {Function} setSelectedTitle - Setter to change the selected title locally.
 *   {Array<Object>} availableTitles - List of all unlockable/earned titles.
 *   {Function} saveTitle - Persists the selected title to the backend.
 */
const useTitles = () => {
    const [titles, setTitles] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('None');
    const [selectedColor, setSelectedColor] = useState('#ffffff');

    /**
     * loadTitlesFromAccount — Loads title data from the user's account object.
     *
     * Initializes the available title list and the selected title name and color
     * from a provided user account object.
     *
     * @function loadTitlesFromAccount
     * @param {Object} account - The user's account data object.
     */
    const loadTitlesFromAccount = (account) => {
        if(account.titles) {
            setTitles(account.titles);
        }

        if(account.selectedTitle) {
            setSelectedTitle(account.selectedTitle?.name || 'None');
            setSelectedColor(account.selectedTitle?.color || '#ffffff');
        }
    };

    /**
     * updateSelectedTitle — Updates local title selection without saving.
     *
     * Updates both the selected title name and its associated color
     * based on a provided title object.
     *
     * @function updateSelectedTitle
     * @param {Object} titleObj - The title object containing `name` and `color` properties.
     */
    const updateSelectedTitle = (titleObj) => {
        setSelectedTitle(titleObj?.name || 'None');
        setSelectedColor(titleObj?.color || '#ffffff');
    };
    
    /**
     * handleTitleChange — Handles title selection changes from a dropdown or form input.
     *
     * Updates the local state to reflect the new selection, finds the corresponding title object
     * to retrieve the color, and sends a POST request to save the change.
     *
     * @function handleTitleChange
     * @param {React.ChangeEvent<HTMLSelectElement>} event - Change event from the title selection input.
     */
    const handleTitleChange = async (event) => {
        const title = event.target.value;
        setSelectedTitle(title);

        const titleObj = titles.find((t) => t.name === title);
        setSelectedColor(titleObj?.color || '#ffffff');

        try {
            await fetch(`${BASE_URL}set-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title }),
            });
        } catch (err) {
            console.error('Error saving title:', err);
        }
    };

    /**
     * Returns the title management hook state and handlers.
     *
     * Exposes available and selected titles, color styling, and utility functions
     * to load, update, or persist user title preferences.
     *
     * @returns {Object} Title management API:
     *   {Array<Object>} titles - List of all available/unlocked titles.
     *   {string} selectedTitle - Name of the currently selected title.
     *   {string} selectedColor - Color associated with the selected title.
     *   {Function} setTitles - Setter for the titles list.
     *   {Function} loadTitlesFromAccount - Initializes title data from account info.
     *   {Function} updateSelectedTitle - Updates selected title and color locally.
     *   {Function} handleTitleChange - Saves the selected title to the backend.
     */
    return {
        titles,
        selectedTitle,
        selectedColor,
        setTitles,
        loadTitlesFromAccount,
        updateSelectedTitle,
        handleTitleChange,
    };
};

export default useTitles;