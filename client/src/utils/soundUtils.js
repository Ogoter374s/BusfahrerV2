/**
 * @fileoverview Sound utilities for playing audio effects in the application.
 * <br><br>
 * This module provides a utility function to play a sound effect by cloning the audio element,
 * resetting its current time, and playing it. <br>
 * It ensures that the sound can be played multiple times without interference from previous plays.
 */

/**
 * Plays a sound effect by cloning the audio element, resetting its current time, and playing it.
 * <br><br>
 * This function is useful for playing sound effects in response to user interactions or events. <br>
 * It ensures that the sound can be played multiple times without interference from previous plays.
 * 
 * @function playSound
 * @param {HTMLAudioElement} audio - The audio element to be played.
 * @returns {void}
 */
export const playSound = (audio) => {
    if (!audio) return;

    const clone = audio.cloneNode();
    clone.currentTime = 0;
    clone.play();
};
