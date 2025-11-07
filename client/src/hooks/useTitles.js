/**
 * @fileoverview Custom hook to manage user titles.
 * <br><br>
 * This hook provides functionalities to load, update, and change user titles. <br>
 * It also integrates with the PopupManager to handle error messages.
 */

// Utilities
import BASE_URL from '../utils/config';
import { PopupManager } from "../utils/popupManager";

// React
import { useState } from 'react';

/**
 * Custom hook that manages user titles including loading, updating, and changing titles.
 * <br><br>
 * This hook provides functionalities to load titles from the user's account, update the selected title,
 * and handle title changes by making API calls to the server. <br>
 * It also integrates with the PopupManager to handle error messages.
 * <br><br>
 * <strong>loadTitlesFromAccount:</strong> <br>
 * Loads the titles and selected title from the user's account data. <br>
 * It updates the state with the titles and the currently selected title.
 * <br><br>
 * <strong>updateSelectedTitle:</strong> <br>
 * Updates the selected title and its color based on the provided title object.
 * <br><br>
 * <strong>handleTitleChange:</strong> <br>
 * Handles the change of the selected title. <br>
 * It updates the state and makes a POST request to the server to save the selected title. <br>
 * If an error occurs during the request, it displays a popup notification with the error message.
 * @function useTitles
 * @returns {Object} An object containing titles, selectedTitle, selectedColor, and functions to manage titles.
 */
const useTitles = () => {
    const [titles, setTitles] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('None');
    const [selectedColor, setSelectedColor] = useState('#ffffff');

    /**
     * Loads titles and selected title from the user's account data.
     * This function updates the state with the titles and the currently selected title.
     */
    const loadTitlesFromAccount = (account) => {
        if (account.titles) {
            setTitles(account.titles);
        }

        if (account.selectedTitle) {
            setSelectedTitle(account.selectedTitle?.name || 'None');
            setSelectedColor(account.selectedTitle?.color || '#ffffff');
        }
    };

    /**
     * Updates the selected title and its color.
     * This function takes a title object and updates the state accordingly.
     */
    const updateSelectedTitle = (titleObj) => {
        setSelectedTitle(titleObj?.name || 'None');
        setSelectedColor(titleObj?.color || '#ffffff');
    };

    /**
     * Handles title selection changes from a dropdown or form input.
     * Updates the local state to reflect the new selection, finds the corresponding title object
     * to retrieve the color, and sends a POST request to save the change.
     */
    const handleTitleChange = async (event) => {
        const title = event.target.value;
        setSelectedTitle(title);

        const titleObj = titles.find((t) => t.name === title);
        setSelectedColor(titleObj?.color || '#ffffff');
        
        try {
            const response = await fetch(`${BASE_URL}set-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title }),
            });

            const data = await response.json();

            if (!data.success) {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (err) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error(err);
        }
    };

    return {
        titles,
        setTitles,

        selectedTitle,
        selectedColor,

        loadTitlesFromAccount,
        updateSelectedTitle,
        handleTitleChange,
    };
};

export default useTitles;