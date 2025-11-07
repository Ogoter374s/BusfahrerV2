/**
 * @fileoverview Custom hook for handling avatar uploads and preset avatar selection.
 * <br><br>
 * This hook manages the state and logic for uploading a custom avatar image, including cropping functionality, as well as selecting from preset avatars. <br>
 * It handles file input changes, image cropping, and server communication. <br>
 * It also provides feedback to the user through popup messages in case of errors or success.
 */

// Utilities
import { PopupManager } from "../utils/popupManager";
import { SoundManager } from '../utils/soundManager';

// React
import { useState } from 'react';

/**
 * A custom React hook for handling avatar uploads and preset avatar selection.
 * <br><br>
 * This hook manages the state and logic for uploading a custom avatar image, including cropping functionality, as well as selecting from preset avatars. <br>
 * It handles file input changes, image cropping, and server communication. <br>
 * It also provides feedback to the user through popup messages in case of errors or success.
 * <br><br>
 * <strong>handleAvatarChange:</strong> <br>
 * This function is called when the user selects a new avatar image file. <br>
 * It updates the state with the selected file and generates a preview URL for cropping.
 * <br><br>
 * <strong>getCroppedImage:</strong> <br>
 * This function creates a cropped version of the selected avatar image based on the cropping area defined by the user. <br>
 * It returns a Promise that resolves to a Blob of the cropped image.
 * <br><br>
 * <strong>uploadAvatar:</strong> <br>
 * This asynchronous function uploads the cropped avatar image to the server. <br>
 * It handles server responses and displays appropriate popup messages for success or failure.
 * <br><br>
 * <strong>selectPresetAvatar:</strong> <br>
 * This asynchronous function allows the user to select a preset avatar. <br>
 * It sends the selected avatar identifier to the server and handles responses with popup messages.
 * <br><br>
 * @function useAvatarUpload
 * @param {string} BASE_URL - The base URL for the server API.
 * @param {function} onUploadSuccess - Callback function to call when the avatar upload is successful.
 * @returns {Object} An object containing state variables and functions for managing avatar uploads and selections.
 */
const useAvatarUpload = ({ BASE_URL, onUploadSuccess }) => {
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    /**
     * Handles the change event when a new avatar image file is selected.
     * This function updates the state with the selected file and generates a preview URL for cropping
     */
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setShowCropper(true);
        }
    };

    /**
     * Generates a cropped version of the selected avatar image.
     * This function creates a canvas element to draw the cropped area and returns a Blob of the cropped image.
     */
    const getCroppedImage = () => {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = avatarPreview;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const { width, height } = image;
                const {
                    x,
                    y,
                    width: cropWidth,
                    height: cropHeight,
                } = croppedAreaPixels;

                canvas.width = cropWidth;
                canvas.height = cropHeight;
                ctx.drawImage(
                    image,
                    x,
                    y,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    cropWidth,
                    cropHeight,
                );

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, avatarFile.type);
            };
        });
    };

    /**
     * Uploads the cropped avatar image to the server.
     * This asynchronous function handles server responses and displays appropriate popup messages for success or failure.
     * If no file is selected, it prompts the user to select an image.
     */
    const uploadAvatar = async () => {
        SoundManager.playClickSound();

        if (!avatarFile) {
            PopupManager.showPopup({
                title: 'Avatar Upload',
                message: 'Please select an image.',
                icon: '🚫',
            });
        }

        // Prepare form data for upload
        const formData = new FormData();
        if (avatarFile.type === 'image/gif') {
            formData.append('avatar', avatarFile, avatarFile.name);
            if (croppedAreaPixels) {
                formData.append('cropData', JSON.stringify(croppedAreaPixels));
            }
        } else {
            const croppedBlob = await getCroppedImage();
            const ext = avatarFile.name.split('.').pop().toLowerCase();
            const fileName = `cropped-avatar.${ext}`;
            formData.append('avatar', croppedBlob, fileName);
        }

        try {
            const response = await fetch(`${BASE_URL}upload-avatar`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                setAvatarFile(null);
                setShowCropper(false);
                onUploadSuccess(`${BASE_URL}avatars/${data.avatarUrl}`);
            } else {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error('Error uploading avatar:', error);
        }
    };

    /**
     * Selects a preset avatar by sending the selected avatar identifier to the server.
     * This asynchronous function handles server responses and displays appropriate popup messages for success or failure.
     */
    const selectPresetAvatar = async (avatar) => {
        SoundManager.playClickSound();

        try {
            const response = await fetch(`${BASE_URL}set-avatar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ avatar }),
            });

            const data = await response.json();

            if (data.success) {
                onUploadSuccess(`${BASE_URL}/avatars/${avatar}`);
            } else {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.error,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error('Error setting avatar:', error);
        }
    };

    return {
        avatarPreview,
        setAvatarPreview,

        showCropper,
        setShowCropper,

        crop,
        setCrop,
        zoom,
        setZoom,

        croppedAreaPixels,
        setCroppedAreaPixels,

        uploadAvatar,
        selectPresetAvatar,
        handleAvatarChange,
    };
};

export default useAvatarUpload;
