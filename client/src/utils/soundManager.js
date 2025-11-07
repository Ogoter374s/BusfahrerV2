/**
 * @fileoverview SoundManager module for managing sound effects in the application.
 * <br><br>
 * This module handles loading, playing, and changing sound effects, specifically click sounds. <br>
 * It provides methods to set a new click sound, play the click sound, and load user-specific sound preferences. <br>
 * It also includes a custom hook for initializing the sound manager based on user authentication
 */

// Utilities
import BASE_URL from './config';
import { playSound } from './soundUtils';

// React
import { useRef, useEffect } from 'react';

// Default click sound file
const DEFAULT_CLICK_SOUND = 'ui-click.mp3';

// Default sounds object to hold sound references
const sounds = {
    click: new Audio(`/sounds/${DEFAULT_CLICK_SOUND}`),
};

// Click sound options available for users to choose from
const clickOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Classic Click', path: 'ui-click.mp3', value: 'ui-click.mp3' },
    { name: 'Pen Click', path: 'pen-click.mp3', value: 'pen-click.mp3' },
    { name: 'F1 Click', path: 'old-click.mp3', value: 'old-click.mp3' },
    { name: 'Level-Up Click', path: 'level-click.mp3', value: 'level-click.mp3' },
];

let soundInitialized = false;

/**
 * SoundManager module that provides methods to manage sound effects in the application.
 * <br><br>
 * It allows setting a new click sound, playing the click sound, loading user-specific sound preferences,
 * and changing the user's sound preference. <br>
 * It also provides methods to get sound references, available click sounds, and the current sound being used.
 * <br><br>
 * <strong>useSoundManager:</strong> <br> 
 * A custom hook that initializes the SoundManager when the component mounts. <br>
 * It checks if the sound preferences have already been loaded to avoid redundant requests. <br>
 * If the user is authenticated, it fetches the user's sound preference from the server. <br>
 * If the user is not authenticated, it falls back to the default click sound. <br>
 * This ensures that sound settings are applied only if the user is authenticated and prevents unnecessary sound loading for unauthenticated users. <br>
 * This is important for performance and user experience.
 * <br><br>
 * <strong>setClickSound:</strong> <br>
 * Sets a new click sound and saves the preference in local storage. <br>
 * This method allows users to change the click sound used in the application. <br>
 * It updates the `sounds.click` reference and persists the new sound in local storage for future use.
 * <br><br>
 * <strong>playClickSound:</strong> <br>
 * Plays the currently set click sound. <br>
 * This method is used to play the click sound effect when a user interacts with the application,
 * such as clicking a button or performing an action that requires feedback.
 * <br><br>
 * <strong>loadUserSound:</strong> <br>
 * Loads the user's sound preference from the server or local storage. <br>
 * If the user is authenticated, it fetches the sound preference from the server. <br>
 * If the user is not authenticated, it falls back to the default click sound. <br>
 * This method ensures that the application uses the user's preferred sound settings, enhancing the user experience.
 * <br><br>
 * <strong>userSoundChange:</strong> <br>
 * Changes the user's click sound preference and updates it on the server. <br>
 * This method allows users to change their click sound preference and ensures that the new preference is saved on the server. <br>
 * It updates the `sounds.click` reference, plays the new click sound, and sends the new preference to the server for persistence.
 * <br><br>
 * <strong>getSoundRefs:</strong> <br>
 * Returns the current sound references used in the application. <br>
 * This method provides access to the sound references, allowing other parts of the application to use the
 * sounds managed by the SoundManager.
 * <br><br>
 * <strong>getClickSounds:</strong> <br>
 * Returns the available click sound options for users to choose from. <br>
 * This method provides a list of click sound options that users can select from, enhancing customization and
 * personalization of the user experience.
 * <br><br>
 * <strong>getCurrentSound:</strong> <br>
 * Returns the currently set click sound file name. <br>
 * This method retrieves the file name of the currently set click sound, allowing other parts of the
 * application to know which sound is currently being used.
 * 
 * @function SoundManager
 * @returns {Object} The SoundManager object with methods and properties for managing sounds.
 */
export const SoundManager = {

    /**
     * Sets a new click sound and saves the preference in local storage.
     * This method allows users to change the click sound used in the application.
     * It updates the `sounds.click` reference and persists the new sound in local storage for future use.
     */
    setClickSound(newSound) {
        sounds.click = new Audio(`/sounds/${newSound}`);
        localStorage.setItem('clickSound', newSound);
    },

    /**
     * Plays the currently set click sound.
     * This method is used to play the click sound effect when a user interacts with the application,
     * such as clicking a button or performing an action that requires feedback.
     */
    playClickSound() {
        playSound(sounds.click)
    },

    /**
     * Loads the user's sound preference from the server or local storage.
     * If the user is authenticated, it fetches the sound preference from the server.
     * If the user is not authenticated, it falls back to the default click sound.
     * This method ensures that the application uses the user's preferred sound settings, enhancing the user experience.
     */
    async loadUserSound(isAuthenticated) {
        if (soundInitialized) return;

        const cached = localStorage.getItem('clickSound');
        if (cached) {
            sounds.click = new Audio(`/sounds/${cached}`);
            soundInitialized = true;
            return;
        }

        const fallback = () => {
            sounds.click = new Audio(`/sounds/${DEFAULT_CLICK_SOUND}`);
            localStorage.setItem('clickSound', DEFAULT_CLICK_SOUND);
        };

        if (!isAuthenticated) {
            fallback();
            soundInitialized = true;
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}get-click-sound`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch sound preference');
            }

            const data = await response.json();
            const clickSound = data.sound || DEFAULT_CLICK_SOUND;

            sounds.click = new Audio(`/sounds/${clickSound}`);
            localStorage.setItem('clickSound', clickSound);
        } catch (error) {
            console.error('Error fetching sound preference:', error);
            fallback();
        }

        soundInitialized = true;
    },

    /**
     * Changes the user's click sound preference and updates it on the server.
     * This method allows users to change their click sound preference and ensures that the new preference is saved on the server.
     * It updates the `sounds.click` reference, plays the new click sound, and sends the new preference to the server for persistence.
     */
    async userSoundChange(newSound) {
        SoundManager.setClickSound(newSound);
        SoundManager.playClickSound();

        try {
            await fetch(`${BASE_URL}set-click-sound`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sound: newSound }),
                credentials: 'include',
            });
        } catch (error) {
            console.error('Error saving sound preference:', error);
        }
    },

    /// Returns the current sound references used in the application.
    getSoundRefs: () => sounds,

    /// Returns the available click sound options for users to choose from.
    getClickSounds: () => clickOptions,

    /// Returns the currently set click sound file name.
    getCurrentSound: () => sounds.click.src.split('/').pop(),

    /**
     * A custom hook that initializes the SoundManager when the component mounts.
     * It checks if the sound preferences have already been loaded to avoid redundant requests.
     * If the user is authenticated, it fetches the user's sound preference from the server.
     * If the user is not authenticated, it falls back to the default click sound.
     * This ensures that sound settings are applied only if the user is authenticated and prevents unnecessary sound loading for unauthenticated users.
     * This is important for performance and user experience.
     */
    useSoundManager: (isAuthenticated) => {
        const hasRun = useRef(false);
        useEffect(() => {
            if (hasRun.current) return;
            hasRun.current = true;

            SoundManager.loadUserSound(isAuthenticated);
        }, [isAuthenticated]);
    },
};