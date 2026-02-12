
// Utilities
import BASE_URL from '../utils/config';
import { PopupManager } from "../utils/popupManager";

// React
import { useState } from 'react';

const useFrames = () => {
    const [frames, setFrames] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState({});

    const loadFramesFromAccount = (account) => {
        if (account.frames) {
            setFrames(account.frames);
            setSelectedFrame(account.selectedFrame || {});
        }
    };

    const handleFrameChange = async (event) => {
        const frame = event.target.value;
        setSelectedFrame(frame);

        try {
            const response = await fetch(`${BASE_URL}set-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ frame }),
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
                message: 'An error occurred while changing the frame.',
                icon: '❌',
            });
            console.error(err);
        }
    };

    return {
        frames,
        setFrames,

        selectedFrame,

        loadFramesFromAccount,
        handleFrameChange,
    };
};

export default useFrames;