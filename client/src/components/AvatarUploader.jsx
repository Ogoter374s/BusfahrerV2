/**
 * AvatarUploader.jsx — Modal component for selecting, uploading, and cropping user avatars.
 *
 * Supports selecting a preset avatar, uploading a custom image, and cropping it using a visual cropper.
 * Plays a click sound on upload interaction and handles modal visibility.
 */

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';

// Libraries
import Cropper from 'react-easy-crop';

/**
 * AvatarUploader component function.
 *
 * Renders a modal dialog that provides:
 * - Preset avatar selection
 * - Custom image file upload
 * - Crop functionality using react-easy-crop
 * - Confirmation and close controls
 *
 * @function AvatarUploader
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {Function} props.onClose - Function to close the modal.
 * @param {string|null} props.uploadedAvatar - Previously uploaded avatar filename.
 * @param {string} props.selectedAvatar - Currently selected avatar.
 * @param {Function} props.onPresetSelect - Handler for selecting a preset avatar.
 * @param {Function} props.onAvatarUpload - Handler for confirming and uploading the cropped avatar.
 * @param {string} props.avatarPreview - URL or base64 preview of the selected avatar image.
 * @param {boolean} props.showCropper - Whether to show the cropping interface.
 * @param {Object} props.crop - Crop position state object.
 * @param {number} props.zoom - Current zoom level for the cropper.
 * @param {Function} props.setCrop - Setter for crop position.
 * @param {Function} props.setZoom - Setter for zoom level.
 * @param {Function} props.setCroppedAreaPixels - Stores pixel data of cropped area.
 * @param {Function} props.handleAvatarChange - Handler for file input changes.
 * @returns {JSX.Element|null} Rendered modal with avatar selection tools or null if closed.
 */
const AvatarUploader = ({
    isOpen,
    onClose,
    uploadedAvatar,
    selectedAvatar,
    onPresetSelect,
    onAvatarUpload,
    avatarPreview,
    showCropper,
    crop,
    zoom,
    setCrop,
    setZoom,
    setCroppedAreaPixels,
    handleAvatarChange,
}) => {
    if (!isOpen) return null;

    /**
     * Renders avatar selection and upload modal layout.
     *
     * Includes:
     * - Preset avatars and uploaded avatar options
     * - File input with sound feedback
     * - Conditional image cropper and upload confirmation
     * - Modal close button
     */
    return (
        <div className="modal-backdrop">
            <div className="avatar-modal">
                <h2>Select Your Avatar</h2>

                <div className="avatar-selection">
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
                                className="avatar-option"
                                onClick={() => onPresetSelect(avatar)}
                            />
                        ))}
                </div>

                <h3>Or Upload Your Own</h3>
                <div className="file-upload-container">
                    <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden-file-input"
                    />
                    <label
                        htmlFor="avatar-upload"
                        className="custom-file-upload"
                        onClick={() => SoundManager.playClickSound()}
                    >
                        Choose Image
                    </label>
                </div>

                {showCropper && (
                    <div className="cropper-wrapper">
                        <div className="crop-container">
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
                        <div className="crop-actions">
                            <button onClick={onAvatarUpload}>Upload</button>
                        </div>
                    </div>
                )}

                <button className="modal-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default AvatarUploader;
