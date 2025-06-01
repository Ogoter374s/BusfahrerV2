import BASE_URL from './config';
import { playSound } from './soundUtils';

import { useRef, useEffect } from 'react';

const DEFAULT_CLICK_SOUND = 'ui-click.mp3';

const sounds = {
    click: new Audio(`/sounds/${DEFAULT_CLICK_SOUND}`),
};

const clickOptions = [
    { name: 'None', path: 'none.mp3', value: 'none.mp3' },
    { name: 'Classic Click', path: 'ui-click.mp3', value: 'ui-click.mp3' },
    { name: 'Pen Click', path: 'pen-click.mp3', value: 'pen-click.mp3' },
    { name: 'F1 Click', path: 'old-click.mp3', value: 'old-click.mp3' },
    { name: 'Level-Up Click', path: 'level-click.mp3', value: 'level-click.mp3' },
];


let soundInitialized = false;

export const SoundManager = {

    setClickSound(newSound) {
        sounds.click = new Audio(`/sounds/${newSound}`);
        localStorage.setItem('clickSound', newSound);
    },

    playClickSound() {
        playSound(sounds.click)
    },

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

    getSoundRefs: () => sounds,
    getClickSounds: () => clickOptions,

    getCurrentSound: () => sounds.click.src.split('/').pop(),

    useSoundManager: (isAuthenticated) => {
        const hasRun = useRef(false);
        useEffect(() => {
            if (hasRun.current) return;
            hasRun.current = true;

            SoundManager.loadUserSound(isAuthenticated);
        }, [isAuthenticated]);
    },
};