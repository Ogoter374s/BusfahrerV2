/**
 * FriendInput.jsx — Provides an interface for sending friend requests via friend code.
 *
 * Allows users to input a code and send a request to another player.
 * Plays a sound effect upon submission and resets the input field on success.
 */

// Components
import PopupModal from "../components/PopUpModal";

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from "../utils/popupManager";

// React
import { useState, useEffect } from 'react';

/**
 * FriendInput component function.
 *
 * Renders an input field and submission button to send a friend request.
 * Uses state to track and update the input value. Submits the code to the backend.
 *
 * @function FriendInput
 * @param {Object} props - Component properties.
 * @param {string} props.friendCode - The current value of the friend code input.
 * @param {Function} props.setFriendCode - Function to update the friend code input.
 * @returns {JSX.Element} The rendered friend code input and add button.
 */
const FriendInput = ({ friendCode, setFriendCode }) => {
    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    useEffect(() => {
        PopupManager.initPopupManager(setPopup);
    }, []);
    
    /**
     * Plays a UI click sound for user feedback.
     *
     * Triggered before sending a friend request.
     */
    const playClickSound = () => SoundManager.playClickSound();

    /**
     * Sends a friend request using the entered code.
     *
     * Posts the friend code to the backend API.
     * Clears the input on success and shows an alert for success or failure.
     */
    const sendFriendRequest = async () => {
        if (!friendCode.trim()) return;
        playClickSound();

        const res = await fetch(`${BASE_URL}send-friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ friendCode }),
        });

        const data = await res.json();
        if (res.ok) {
            PopupManager.showPopup({
                title: "Add Friend", 
                message: "Friend request sent!", 
                icon: '✅'
            });
        } else {
            PopupManager.showPopup({
                title: 'Add Friend',
                message: data.error,
                icon: '❌',
            });
        }
    };

    /**
     * Renders the input and action layout.
     *
     * Includes a styled input field and a button to trigger the friend request.
     */
    return (
        <>
            <div className="add-friend-container">
                <input
                    type="text"
                    className="add-friend-input"
                    placeholder="Enter friend code..."
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value)}
                />
                <button onClick={sendFriendRequest}>Add Friend</button>
            </div>

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={PopupManager.closePopup}
            />
        </>
    );
};

export default FriendInput;
