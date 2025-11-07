/**
 * @fileoverview AvatarUploader Component
 * <br><br>
 * This component provides a modal interface for users to select or upload an avatar image. <br>
 * It includes preset avatar options, file upload functionality, and image cropping capabilities.
 */

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';

// Libraries
import Cropper from 'react-easy-crop';

/**
 * A modal component that allows users to select a preset avatar or upload and crop their own image.
 * <br><br>
 * This component provides a modal interface for users to select or upload an avatar image. <br>
 * It includes preset avatar options, file upload functionality, and image cropping capabilities.
 * <br><br>
 * @function AvatarUploader
 * @param {boolean} isOpen - Whether the avatar uploader modal is currently open.
 * @param {function} onClose - Callback function to close the modal.
 * @param {string} uploadedAvatar - The URL of the currently uploaded avatar.
 * @param {function} onPresetSelect - Callback function when a preset avatar is selected.
 * @param {function} onAvatarUpload - Callback function to handle the avatar upload process.
 * @param {string} avatarPreview - The preview URL of the selected avatar image.
 * @param {boolean} showCropper - Whether to show the image cropper.
 * @param {Object} crop - The current crop state for the image cropper.
 * @param {number} zoom - The current zoom level for the image cropper.
 * @param {function} setCrop - Function to update the crop state.
 * @param {function} setZoom - Function to update the zoom level.
 * @param {function} setCroppedAreaPixels - Function to set the cropped area pixels after cropping is complete.
 * @param {function} handleAvatarChange - Function to handle changes in the file input for avatar upload.
 * @returns {JSX.Element|null} The rendered AvatarUploader component or null if `isOpen` is false.
 */
const AvatarUploader = ({
    isOpen, onClose, uploadedAvatar, onPresetSelect,
    onAvatarUpload, avatarPreview, showCropper, crop,
    zoom, setCrop, setZoom, setCroppedAreaPixels, handleAvatarChange,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-style">
            <div className="cropper-wrapper">
                <h2 className="cropper-h2">
                    Select Your Avatar
                </h2>

                {/* Preset Avatars & Upload Avatar */}
                <div className="cropper-list">
                    {[
                        'default.svg',
                        uploadedAvatar && uploadedAvatar !== ''
                            ? uploadedAvatar.replace(`${BASE_URL}avatars/`, '')
                            : null,
                        'avatar1.svg',
                        'avatar2.svg',
                    ]
                        .filter(Boolean)
                        .map((avatar) => (
                            <img
                                key={avatar}
                                src={`${BASE_URL}/avatars/${avatar}`}
                                alt={avatar}
                                onClick={() => onPresetSelect(avatar)}
                                className="cropper-item"
                            />
                        ))}
                </div>

                <h3 className="cropper-h3">
                    Or Upload Your Own
                </h3>

                <div className="flex flex-col items-center select-none mb-1">
                    <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="avatar-upload"
                        onClick={() => SoundManager.playClickSound()}
                        className="cropper-upload"
                    >
                        Choose Image
                    </label>
                </div>

                {/* Cropper for uploaded avatar */}
                {showCropper && (
                    <div>
                        <div className="upload-wrapper">
                            <Cropper
                                image={avatarPreview}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(croppedArea, croppedPixels) =>
                                    setCroppedAreaPixels(croppedPixels)
                                }
                            />
                        </div>
                        <div className="upload-actions">
                            <button
                                onClick={onAvatarUpload}
                                className="modal-btn"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="modal-btn"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default AvatarUploader;
