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
import { SOUND_TYPES } from "./constants";

// React
import { useRef, useEffect } from 'react';

// Default sound files
const DEFAULT_SOUNDS = {
    click: "ui-click.mp3",
    layCard: "ui-click.mp3",
    flipRow: "ui-click.mp3",
    ex: "ui-click.mp3",
    win: "ui-click.mp3",
    lose: "ui-click.mp3",
};

// Default sounds object to hold sound references
const sounds = {
    click: new Audio(`${BASE_URL}sounds/${DEFAULT_SOUNDS.click}`),
    layCard: new Audio(`${BASE_URL}sounds/${DEFAULT_SOUNDS.layCard}`),
    flipRow: new Audio(`${BASE_URL}sounds/${DEFAULT_SOUNDS.flipRow}`),
    ex: new Audio(`${BASE_URL}sounds/${DEFAULT_SOUNDS.ex}`),
    win: new Audio(`${BASE_URL}sounds/${DEFAULT_SOUNDS.win}`),
    lose: new Audio(`${BASE_URL}sounds/${DEFAULT_SOUNDS.lose}`),
};

// Click sound options available for users to choose from
const clickOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Classic Click', path: 'ui-click.mp3', value: 'ui-click.mp3' },
    { name: 'Pen Click', path: 'pen-click.mp3', value: 'pen-click.mp3' },
    { name: 'F1 Click', path: 'f1-click.mp3', value: 'f1-click.mp3' },
];

// Lay Card sound options available for users to choose from
const layCardOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Classic Click', path: 'ui-click.mp3', value: 'ui-click.mp3' },
    { name: 'F1 Click', path: 'f1-click.mp3', value: 'f1-click.mp3' },
    { name: 'Sauf Click', path: 'sauf-click.mp3', value: 'sauf-click.mp3' },
];

// Row Flip sound options available for users to choose from
const rowFlipOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Classic Click', path: 'ui-click.mp3', value: 'ui-click.mp3' },
    { name: 'Level-Up Click', path: 'level-click.mp3', value: 'level-click.mp3' },
    { name: 'Sus Click', path: 'sus-click.mp3', value: 'sus-click.mp3' },
];

// Ex sound options available for users to choose from
const exOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Classic Click', path: 'ui-click.mp3', value: 'ui-click.mp3' },
    { name: 'Boom Click', path: 'boom-click.mp3', value: 'boom-click.mp3' },
    { name: 'UwU Click', path: 'uwu-click.mp3', value: 'uwu-click.mp3' },
];

// Lose sound options available for users to choose from
const loseOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Lose Sound', path: 'die-click.mp3', value: 'die-click.mp3' },
    { name: 'Bell Sound', path: 'bell-click.mp3', value: 'bell-click.mp3' },
];

// Win sound options available for users to choose from
const winOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Win Sound', path: 'win-click.mp3', value: 'win-click.mp3' },
    { name: 'Box Box Sound', path: 'box-click.mp3', value: 'box-click.mp3' },
];

let soundInitialized = false;

let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
let eventSoundEnabled = localStorage.getItem('eventSoundEnabled') !== 'false';

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
 * <strong>setSound:</strong> <br>
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
 * <strong>getCurrentClickSound:</strong> <br>
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
    setSound(type, newSound) {
        if (!sounds) return;

        sounds[type] = new Audio(`${BASE_URL}sounds/${newSound}`);

        const cached = JSON.parse(localStorage.getItem('allSounds'));

        const updated = cached.map(s =>
            s.type === type ? { ...s, name: newSound } : s
        );

        localStorage.setItem('allSounds', JSON.stringify(updated));

        this.playSound(type);
    },

    playSound(type) {
        switch(type) {
            case SOUND_TYPES.CLICK:
                this.playClickSound();
                break;
            case SOUND_TYPES.LAY_CARD:
                this.playLayCardSound();
                break;
            case SOUND_TYPES.ROW_FLIP:
                this.playRowFlipSound();
                break;
            case SOUND_TYPES.EX:
                this.playExSound();
                break;
            case SOUND_TYPES.LOSE:
                this.playLoseSound();
                break;
            case SOUND_TYPES.WIN:
                this.playWinSound();
                break;
            default:
                break;
        }
    },

    // #region Sound Play Methods

    /**
     * Plays the currently set click sound.
     * This method is used to play the click sound effect when a user interacts with the application,
     * such as clicking a button or performing an action that requires feedback.
     */
    playClickSound() {
        if (!soundEnabled) return;

        playSound(sounds.click);
    },

    /**
     * Plays the currently set lay card sound.
     * This method is used to play the lay card sound effect when a user lays a card in the game,
     * providing auditory feedback for the action.
     */
    playLayCardSound() {
        if (!eventSoundEnabled) return;

        playSound(sounds.layCard);
    },

    /**
     * Plays the currently set row flip sound.
     * This method is used to play the row flip sound effect when a user flips a row in the game,
     * providing auditory feedback for the action.
     */
    playRowFlipSound() {
        if (!eventSoundEnabled) return;

        playSound(sounds.flipRow);
    },

    /**
     * Plays the currently set ex sound.
     * This method is used to play the ex sound effect when a user triggers an ex event in the game,
     * providing auditory feedback for the action.
     */
    playExSound() {
        if (!eventSoundEnabled) return;

        playSound(sounds.ex);
    },

    /**
     * Plays the currently set lose sound.
     * This method is used to play the lose sound effect when a user loses in the game,
     * providing auditory feedback for the event.
     */
    playLoseSound() {
        if (!eventSoundEnabled) return;

        playSound(sounds.lose);
    },

    /**
     * Plays the currently set win sound.
     * This method is used to play the win sound effect when a user wins in the game,
     * providing auditory feedback for the event.
     */
    playWinSound() {
        if (!eventSoundEnabled) return;

        playSound(sounds.win);
    },

    // #endregion

    toggleSound(state) {
        soundEnabled = state;
        localStorage.setItem('soundEnabled', state);
    },

    toggleEventSound(state) {
        eventSoundEnabled = state;
        localStorage.setItem('eventSoundEnabled', state);
    },

    isEnabled() {
        return soundEnabled;
    },

    isEventEnabled() {
        return eventSoundEnabled;
    },

    /**
     * Loads the user's sound preference from the server or local storage.
     * If the user is authenticated, it fetches the sound preference from the server.
     * If the user is not authenticated, it falls back to the default click sound.
     * This method ensures that the application uses the user's preferred sound settings, enhancing the user experience.
     */
    async loadUserSound(isAuthenticated) {
        if (soundInitialized) return;

        if (!sounds) sounds = {};

        const cached = localStorage.getItem('allSounds');
        if (cached) {
            const parsed = JSON.parse(cached);

            console.log(parsed);

            for (const { type, name } of parsed) {
                sounds[type] = new Audio(`${BASE_URL}sounds/${name}`);
            }

            soundInitialized = true;
            return;
        }

        const fallback = () => {
            for (const [type, defaultName] of Object.entries(DEFAULT_SOUNDS)) {
                sounds[type] = new Audio(`${BASE_URL}sounds/${defaultName}`);
            }

            localStorage.setItem("allSounds", JSON.stringify(
                Object.entries(DEFAULT_SOUNDS).map(([type, name]) => ({ type, name }))
            ));
        };

        if (!isAuthenticated) {
            fallback();
            soundInitialized = true;
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}get-sounds`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch sound preference');
            }

            const data = await response.json();
            for (const { type, name } of data.sounds) {
                sounds[type] = new Audio(`${BASE_URL}sounds/${name}`);
            }

            localStorage.setItem("allSounds", JSON.stringify(data.sounds));
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
    async userSoundChange(type, newSound) {
        SoundManager.setSound(type, newSound);

        try {
            await fetch(`${BASE_URL}set-sound`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sound: newSound, soundType: type }),
                credentials: 'include',
            });
        } catch (error) {
            console.error('Error saving sound preference:', error);
        }
    },

    /**
     * Clears the user's sound preferences from local storage.
     * This method resets the sound settings to their default values by removing any user-specific
     * sound preferences stored in local storage. It reinitializes the sound references to the default sounds.
     * This is useful when a user wants to revert to the default sound settings.
     * It also sets the `soundInitialized` flag to false to allow reinitialization.
     */
    userClearSounds() {
        localStorage.removeItem('allSounds');
        soundInitialized = false;

        for (const [type, defaultName] of Object.entries(DEFAULT_SOUNDS)) {
            sounds[type] = new Audio(`${BASE_URL}sounds/${defaultName}`);
        }
    },

    /// Returns the current sound references used in the application.
    getSoundRefs: () => sounds,

    /// Returns the available click sound options for users to choose from.
    getClickSounds: () => clickOptions,

    /// Returns the available lay card sound options for users to choose from.
    getLayCardSounds: () => layCardOptions,

    /// Returns the available row flip sound options for users to choose from.
    getRowFlipSounds: () => rowFlipOptions,

    /// Returns the available ex sound options for users to choose from.
    getExSounds: () => exOptions,

    /// Returns the available lose sound options for users to choose from.
    getLoseSounds: () => loseOptions,

    /// Returns the available win sound options for users to choose from.
    getWinSounds: () => winOptions,

    /// Returns the currently set click sound file name.
    getCurrentSound: (type) => sounds[type].src.split('/').pop(),

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