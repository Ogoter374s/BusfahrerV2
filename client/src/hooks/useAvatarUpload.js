/**
 * useAvatarUpload.js — Custom hook for handling avatar image upload and cropping logic.
 *
 * Provides all necessary state and functions to support selecting, previewing,
 * cropping, and uploading user avatars in a React application.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useState } from 'react';

let PopupManager = null;

/**
 * useAvatarUpload hook function.
 *
 * Manages state for avatar cropping, preview generation, and upload handling.
 * Integrates file reading, Cropper.js cropping, and backend upload requests.
 *
 * @function useAvatarUpload
 * @returns {Object} An object containing:
 *   {boolean} isUploading - Whether an upload is currently in progress.
 *   {string} uploadedAvatar - Filename or path of the uploaded avatar.
 *   {string} avatarPreview - Image preview source for cropping.
 *   {boolean} showCropper - Whether the cropping UI is visible.
 *   {Object} crop - Position state for cropping.
 *   {number} zoom - Zoom level for the cropper.
 *   {Function} setCrop - Setter for crop position.
 *   {Function} setZoom - Setter for zoom level.
 *   {Function} setShowCropper - Setter to toggle cropper visibility.
 *   {Function} setCroppedAreaPixels - Stores calculated crop area dimensions.
 *   {Function} handleAvatarChange - Handles image file input and creates preview.
 *   {Function} onAvatarUpload - Uploads the cropped avatar image to the server.
 */
const useAvatarUpload = ({ BASE_URL, onUploadSuccess }) => {
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    /**
     * handleAvatarChange — Handles avatar image file selection.
     *
     * Reads the selected file from the input element, creates a preview URL,
     * stores the file in state, and activates the cropping interface.
     *
     * @function handleAvatarChange
     * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event.
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
     * getCroppedImage — Generates a cropped image blob from the preview and crop data.
     *
     * Draws the cropped portion of the avatar preview onto a canvas,
     * then converts the result to a JPEG Blob for uploading.
     *
     * @function getCroppedImage
     * @returns {Promise<Blob>} A Promise that resolves to a cropped image blob.
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
                }, 'image/jpeg');
            };
        });
    };

    /**
     * uploadAvatar — Uploads the cropped avatar image to the backend.
     *
     * Converts the preview to a cropped image blob and submits it via a FormData POST request.
     * On success, resets the cropper and notifies the parent component with the new avatar URL.
     * Plays a click sound and displays alerts if upload fails or no file is selected.
     *
     * @function uploadAvatar
     * @returns {Promise<void>}
     */
    const uploadAvatar = async () => {
        SoundManager.playClickSound();

        if (!avatarFile) {
            PopupManager.showPopup({
                title: 'Avatar Upload',
                message: 'Please select an image.',
                icon: '🚫',
            });
            return;
        }

        const croppedBlob = await getCroppedImage();
        const formData = new FormData();
        formData.append('avatar', croppedBlob, 'cropped-avatar.jpg');

        try {
            const response = await fetch(`${BASE_URL}upload-avatar`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setAvatarFile(null);
                setShowCropper(false);
                onUploadSuccess(`${BASE_URL}avatars/${data.avatarUrl}`);
            } else {
                PopupManager.showPopup({
                    title: 'Avatar Upload',
                    message: 'Avatar upload failed.',
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
     * selectPresetAvatar — Sets a predefined avatar image for the user.
     *
     * Sends a POST request with the selected avatar name to the backend.
     * If successful, updates the avatar preview through the parent callback.
     * Plays a click sound and logs any errors.
     *
     * @function selectPresetAvatar
     * @param {string} avatar - Filename of the selected preset avatar.
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

            if (response.ok) {
                onUploadSuccess(`${BASE_URL}/avatars/${avatar}`);
            } else {
                PopupManager.showPopup({
                    title: 'Avatar Selection',
                    message: 'Failed to set avatar.',
                    icon: '❌',
                });
            }
        } catch (error) {
            console.error('Error setting avatar:', error);
        }
    };

    /**
     * Returns the avatar upload hook state and handlers.
     *
     * Provides preview data, crop and zoom configuration,
     * cropper control, and avatar selection/upload functions.
     *
     * @returns {Object} The avatar upload controller object:
     *   {string} avatarPreview - Preview image source for cropping.
     *   {boolean} showCropper - Whether the cropper UI is active.
     *   {Object} crop - Current crop position.
     *   {number} zoom - Zoom level for the cropper.
     *   {Function} setCrop - Updates crop position.
     *   {Function} setZoom - Updates zoom level.
     *   {Object} croppedAreaPixels - Cropped area pixel dimensions.
     *   {Function} setCroppedAreaPixels - Setter for cropped area data.
     *   {Function} handleAvatarChange - Handles image file selection and shows preview.
     *   {Function} uploadAvatar - Uploads the cropped avatar image to the server.
     *   {Function} setShowCropper - Toggles the cropping interface.
     *   {Function} selectPresetAvatar - Selects a built-in avatar and submits it to the server.
     */
    return {
        setPopupManager,
        avatarPreview,
        showCropper,
        crop,
        zoom,
        setCrop,
        setZoom,
        croppedAreaPixels,
        setCroppedAreaPixels,
        handleAvatarChange,
        uploadAvatar,
        setShowCropper,
        selectPresetAvatar,
    };
};

export default useAvatarUpload;
