/**
 * Plays a cloned instance of a given audio element.
 *
 * Clones the provided HTMLAudioElement to allow overlapping or repeated playback.
 * Resets the playback time to the beginning and starts playing the sound.
 * Safely exits if the audio parameter is null or undefined.
 *
 * @function playSound
 * @param {HTMLAudioElement} audio - The audio element to be played.
 */
export const playSound = (audio) => {
    if (!audio) return;

    const clone = audio.cloneNode();
    clone.currentTime = 0;
    clone.play();
};
