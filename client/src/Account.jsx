import BASE_URL, { WBS_URL } from './config';
import Cropper from 'react-easy-crop';

import { useState, useEffect, useRef, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetCardTheme } from './CardThemes';

function Account() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [selectedTheme, setSelectedTheme] = useState('default');
    const [color1, setColor1] = useState('#ffffff');
    const [color2, setColor2] = useState('#ff4538');
    const [showCardThemeModal, setShowCardThemeModal] = useState(false);

    const [selectedTitle, setSelectedTitle] = useState('None');
    const [selectedColor, setSelectedColor] = useState('#ffffff');
    const [titles, setTitles] = useState([]);

    const [statistics, setStatistics] = useState('');
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(
        '/avatars/default.svg',
    );
    const [uploadedAvatar, setUploadedAvatar] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const navigate = useNavigate();
    const wsRef = useRef(null);
    const init = useRef(false);

    const clickSounds = [
        { name: 'None', path: 'none.mp3' },
        { name: 'Classic Click', path: 'ui-click.mp3' },
        { name: 'Pen Click', path: 'pen-click.mp3' },
        { name: 'F1 Click', path: 'old-click.mp3' },
        { name: 'Level-Up Click', path: 'level-click.mp3' },
    ];

    const cardThemes = [
        { name: 'Classic', path: 'default' },
        { name: 'Bricks', path: 'bricks' },
        { name: 'Hexagon', path: 'hexagon' },
        { name: 'Shingles', path: 'shingles' },
        { name: 'Square', path: 'square' },
        { name: 'Leafs', path: 'leafs' },
    ];

    /**
     * Fetches user account data including statistics, avatar, and title preferences.
     *
     * Sends a GET request to the backend API using HttpOnly cookie authentication.
     * Retrieves and updates the user's statistics, avatar image, uploaded avatar, and titles.
     *
     * @function fetchAccount
     * @throws {Error} If the fetch request fails or returns invalid data.
     */
    const fetchAccount = async () => {
        const response = await fetch(`${BASE_URL}get-account`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const account = await response.json();

        setStatistics(account.statistics);

        setSelectedAvatar(`${BASE_URL}avatars/${account.avatar}`);
        setUploadedAvatar(`${BASE_URL}avatars/${account.uploadedAvatar}`);

        setTitles(account.titles || []);

        setSelectedTitle(account.selectedTitle.name);
        setSelectedColor(account.selectedTitle.color);
    };

    /**
     * Fetches the user's selected click sound preference.
     *
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio element source accordingly.
     * Uses HttpOnly cookies for authentication.
     *
     * @function fetchSoundPreference
     * @throws {Error} If the request fails or the sound data cannot be retrieved.
     */
    const fetchSoundPreference = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-click-sound`, {
                credentials: 'include',
            });

            const data = await response.json();

            setSelectedSound(data.sound);
            soundRef.current.src = `/sounds/${data.sound}`;
        } catch (error) {
            console.error('Error fetching sound preference:', error);
        }
    };

    /**
     * Fetches the user's selected card back theme and associated colors.
     *
     * Sends a GET request to the backend API using HttpOnly cookie authentication.
     * Updates the selected card theme and its color settings in the component state.
     *
     * @function fetchCardTheme
     * @throws {Error} If the request fails or the theme data cannot be retrieved.
     */
    const fetchCardTheme = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-card-theme`, {
                credentials: 'include',
            });

            const data = await response.json();

            setSelectedTheme(data.theme);

            setColor1(data.color1);
            setColor2(data.color2);
        } catch (error) {
            console.error('Error fetching card theme preference:', error);
        }
    };

    /**
     * Sets up a WebSocket connection to receive real-time account updates.
     *
     * Initializes the WebSocket connection and subscribes to account updates by sending
     * an identification message. Listens for incoming messages and updates local states
     * such as sound preference, avatar, uploaded avatar, card theme, statistics, and titles.
     * Also fetches initial data on component mount via API calls.
     * Cleans up by closing the WebSocket connection when the component unmounts or reloads.
     *
     * @function useEffect
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            wsRef.current = new WebSocket(WBS_URL);

            wsRef.current.onopen = () => {
                wsRef.current.send(JSON.stringify({ type: 'account' }));
            };

            wsRef.current.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'accountUpdate') {
                    soundRef.current.src = `/sounds/${message.data.clickSound}`;

                    setStatistics(message.data.statistics);

                    setSelectedAvatar(
                        `${BASE_URL}avatars/${message.data.avatar}`,
                    );
                    setUploadedAvatar(
                        `${BASE_URL}avatars/${message.data.uploadedAvatar}`,
                    );

                    setSelectedSound(message.data.clickSound);
                    setSelectedTheme(message.data.cardTheme);

                    if (message.data.selectedTitle) {
                        setSelectedTitle(message.data.selectedTitle.name);
                        setSelectedColor(message.data.selectedTitle.color);
                    }
                }

                if (message.type === 'titlesUpdate') {
                    setTitles(message.data);
                }
            };
        }

        fetchAccount();

        fetchSoundPreference();
        fetchCardTheme();

        window.addEventListener('beforeunload', () => {
            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        });

        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, []);

    /**
     * Plays a cloned instance of the selected click sound effect.
     *
     * Clones the current audio element to allow overlapping playback,
     * resets the clone's playback position, and plays the sound.
     * Useful for rapid or repeated click feedback without delay.
     *
     * @function playClickSound
     */
    const playClickSound = () => {
        const clickClone = soundRef.current.cloneNode();
        clickClone.currentTime = 0;
        clickClone.play();
    };

    /**
     * Logs out the current user by invalidating the session.
     *
     * Sends a POST request to the backend API to clear the HttpOnly session cookie.
     * Plays a click sound and navigates the user to the access/login page upon success.
     * Displays an alert if logout fails.
     *
     * @function handleLogout
     * @throws {Error} If the logout request fails or the server returns an error.
     */
    const handleLogout = async () => {
        playClickSound();
        try {
            await fetch(`${BASE_URL}logout`, {
                method: 'POST',
                credentials: 'include',
            });

            navigate('/access');
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Logout failed. Please try again.');
        }
    };

    /**
     * Navigates the user to the Achievements screen.
     *
     * Plays a click sound for UI feedback and redirects the user
     * to the "/achievements" route using React Router's navigation.
     *
     * @function handleAchievements
     * @async
     */
    const handleAchievements = async () => {
        playClickSound();
        navigate('/achievements');
    };

    /**
     * Handles the change of the user's click sound preference.
     *
     * Updates the selected sound state and immediately plays the new sound for feedback.
     * Updates the reference audio element and sends the new preference to the backend.
     *
     * @function handleSoundChange
     * @param {Event} event - The change event from the sound selection dropdown.
     * @throws {Error} If the request to save the new sound preference fails.
     */
    const handleSoundChange = async (event) => {
        const newSound = event.target.value;
        setSelectedSound(newSound);

        const newAudio = new Audio(`sounds/${newSound}`);
        newAudio.currentTime = 0;
        newAudio.play();

        soundRef.current.src = `sounds/${newSound}`;

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
    };

    /**
     * Handles the selection of a new card theme by the user.
     *
     * Updates the selected card theme in the local state and hides the theme modal.
     * Sends a POST request to the backend to save the selected theme and associated colors.
     * Uses HttpOnly cookie authentication for secure updates.
     *
     * @function handleThemeSelect
     * @param {Object} theme - The theme object containing the path to the theme asset.
     * @throws {Error} If the request to save the theme preference fails.
     */
    const handleThemeSelect = async (theme) => {
        const newTheme = theme.path;
        setSelectedTheme(newTheme);
        setShowCardThemeModal(false);

        try {
            await fetch(`${BASE_URL}set-card-theme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: newTheme, color1, color2 }),
                credentials: 'include',
            });
        } catch (error) {
            console.error('Error saving card theme preference:', error);
        }
    };

    /**
     * Generates a cropped version of the selected avatar image using canvas.
     *
     * Loads the avatar preview image, applies the crop based on user-selected pixel coordinates,
     * and creates a JPEG Blob of the cropped area. Returns a Promise that resolves with the Blob.
     *
     * @function getCroppedImage
     * @returns {Promise<Blob>} A promise that resolves to the cropped image as a JPEG Blob.
     */
    const getCroppedImage = async () => {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = avatarPreview;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const { width, height } = image;
                const cropX = croppedAreaPixels.x;
                const cropY = croppedAreaPixels.y;
                const cropWidth = croppedAreaPixels.width;
                const cropHeight = croppedAreaPixels.height;

                canvas.width = cropWidth;
                canvas.height = cropHeight;
                ctx.drawImage(
                    image,
                    cropX,
                    cropY,
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
     * Handles avatar image file selection from the user's device.
     *
     * Sets the selected file in state, generates a preview URL for cropping,
     * and displays the cropper UI to the user.
     *
     * @function handleAvatarChange
     * @param {Event} e - The file input change event containing the selected image file.
     */
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file)); // Show preview before cropping
            setShowCropper(true);
        }
    };

    /**
     * Uploads the cropped avatar image to the server.
     *
     * Plays a click sound, validates the presence of an avatar file,
     * processes the image through the cropper, and sends it to the backend via FormData.
     * On success, updates the selected avatar and resets related UI states.
     *
     * @function uploadAvatar
     * @throws {Error} If the upload request fails or the server responds with an error.
     */
    const uploadAvatar = async () => {
        playClickSound();
        if (!avatarFile) {
            alert('Please select an image.');
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
                setSelectedAvatar(`${BASE_URL}avatars/${data.avatarUrl}`);
                setAvatarFile(null);
                setShowCropper(false);
                setShowAvatarModal(false);
            } else {
                alert('Avatar upload failed.');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
        }
    };

    /**
     * Handles the selection of a preset avatar by the user.
     *
     * Sends a POST request to the backend to update the user's avatar with the selected preset.
     * On success, updates the selected avatar and closes the avatar selection modal.
     *
     * @function handlePresetAvatarSelect
     * @param {string} avatar - The filename of the selected preset avatar.
     * @throws {Error} If the request to update the avatar fails.
     */
    const handlePresetAvatarSelect = async (avatar) => {
        playClickSound();

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
                setSelectedAvatar(`${BASE_URL}/avatars/${avatar}`);
                setShowAvatarModal(false);
            } else {
                alert('Failed to set avatar.');
            }
        } catch (error) {
            console.error('Error setting avatar:', error);
        }
    };

    /**
     * Updates the user's selected title and its associated color.
     *
     * Updates local state with the chosen title and its corresponding color from the title list.
     * Sends a POST request to the backend endpoint `/set-title` to persist the selected title.
     * Uses HttpOnly cookies for secure authentication.
     *
     * @function handleTitleChange
     * @async
     * @param {Event} event - The change event triggered when a title is selected.
     * @throws {Error} If the fetch operation fails.
     */
    const handleTitleChange = async (event) => {
        const title = event.target.value;
        setSelectedTitle(title);

        const titleObj = titles.find((t) => t.name === title);
        setSelectedColor(titleObj?.color || '#ffffff');

        try {
            await fetch(`${BASE_URL}set-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
                credentials: 'include',
            });
        } catch (error) {
            console.error('Error saving title:', error);
        }
    };

    /**
     * Handles closing the card theme modal and saving the selected theme.
     *
     * Plays a click sound, hides the card theme selection modal, and sends
     * a POST request to the backend to persist the selected card theme and colors.
     *
     * @function handleThemeClose
     * @throws {Error} If the request to save the card theme fails.
     */
    const handleThemeClose = async () => {
        playClickSound();
        setShowCardThemeModal(false);

        try {
            await fetch(`${BASE_URL}set-card-theme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: selectedTheme, color1, color2 }),
                credentials: 'include',
            });
        } catch (error) {
            console.error('Error saving card theme preference:', error);
        }
    };

    /**
     * Renders the Account screen UI where users can customize their profile.
     *
     * Includes:
     * - Sound effect, avatar, card theme, and title customization
     * - Upload and crop functionality for custom avatars
     * - Dropdowns for selecting sound effects and titles (with live preview)
     * - Modal dialogs for avatar and card theme selection with color customization
     * - Display of user statistics (games played, drinks given/received, etc.)
     * - Achievements and logout buttons
     * - Back button to return to the home page
     *
     * @returns {JSX.Element} Account management interface with profile customization and stats.
     */
    return (
        <div className={`overlay-cont ${showAvatarModal ? 'no-click' : ''}`}>
            {/* Decorative background overlay */}
            <img
                src="overlay_account.svg"
                alt="Overlay"
                className="overlay-img"
            />

            {/* Main account menu container */}
            <div className="account-menu">
                {/* Title for the account section */}
                <h1 className="account-title">Account</h1>

                {/* Container for displaying user */}
                <div className="account-container">
                    {/* Container for displaying user options */}
                    <div className="options-box">
                        <h2>Options</h2>

                        {/* Avatar Icon Options */}
                        <img
                            src={selectedAvatar}
                            alt="User Avatar"
                            className="avatar"
                            onClick={() => {
                                playClickSound();
                                setShowAvatarModal(true);
                            }}
                            draggable="false"
                        />

                        {/* Sound selection dropdown */}
                        <div className="options-selection">
                            <label htmlFor="optionsSelect">
                                Select Click Sound:
                            </label>
                            <select
                                id="optionsSelect"
                                value={selectedSound}
                                onChange={handleSoundChange}
                            >
                                {clickSounds.map((sound) => (
                                    <option key={sound.path} value={sound.path}>
                                        {sound.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Card Theme selection dropdown */}
                        <div className="options-selection">
                            <label htmlFor="optionsSelect">
                                Select Card Theme:
                            </label>
                            <div
                                className="dropdown-style"
                                onClick={() => {
                                    playClickSound();
                                    setShowCardThemeModal(true);
                                }}
                            >
                                {cardThemes.find(
                                    (theme) => theme.path === selectedTheme,
                                )?.name || 'Classic'}
                            </div>
                        </div>

                        {/* Title Selection Dropdown */}
                        <div className="options-selection">
                            <label htmlFor="optionsSelect">Select Title:</label>
                            <select
                                id="optionsSelect"
                                value={selectedTitle}
                                onChange={handleTitleChange}
                                style={{ color: selectedColor }}
                            >
                                {titles.map((title, index) => (
                                    <option
                                        key={index}
                                        value={title.name}
                                        style={{ color: title.color }}
                                    >
                                        {title.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Container for displaying user statistics */}
                    <div className="stats-box">
                        <h2>Statistics</h2>

                        {/* Individual user statistic entries */}
                        <p>
                            <span>Games Played:</span>
                            {statistics.gamesPlayed}
                        </p>
                        <p>
                            <span>Games Busfahrer:</span>
                            {statistics.gamesBusfahrer}
                        </p>
                        <p>
                            <span>Schlucke Given:</span>
                            {statistics.drinksGiven}
                        </p>
                        <p>
                            <span>Max. Schlucke Given:</span>
                            {statistics.maxDrinksGiven}
                        </p>
                        <p>
                            <span>Schlucke Self:</span>
                            {statistics.drinksSelf}
                        </p>
                        <p>
                            <span>Max. Schlucke Self:</span>
                            {statistics.maxDrinksSelf}
                        </p>
                        <p>
                            <span>Number Exen:</span>
                            {statistics.numberEx}
                        </p>
                        <p>
                            <span>Max. Cards Number:</span>
                            {statistics.maxCardsSelf}
                        </p>
                    </div>
                </div>

                {/* Logout button */}
                <div className="account-cont">
                    <button
                        className="btn-achievements"
                        onClick={handleAchievements}
                    >
                        <img
                            src="button.svg"
                            alt="Achievements"
                            className="achievements-icon"
                        />
                        <p className="btn-text-achievements">Achievements</p>
                    </button>
                    <button className="btn-account" onClick={handleLogout}>
                        <img
                            src="button.svg"
                            alt="Logout"
                            className="account-icon"
                        />
                        <p className="btn-text-account">Logout</p>
                    </button>
                </div>
            </div>

            {/* Back button to navigate to the home page */}
            <div className="back-cont">
                <button
                    className="btn-back"
                    onClick={() => {
                        playClickSound();
                        navigate('/');
                    }}
                >
                    <img
                        src="back.svg"
                        alt="Back Button"
                        className="back-icon"
                    />
                </button>
            </div>

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <div className="modal-backdrop">
                    <div className="avatar-modal">
                        <h2>Select Your Avatar</h2>

                        {/* Preset Avatar Selection */}
                        <div className="avatar-selection">
                            {[
                                'default.svg',
                                uploadedAvatar && uploadedAvatar !== ''
                                    ? uploadedAvatar.replace(
                                          `${BASE_URL}avatars/`,
                                          '',
                                      )
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
                                        onClick={() => {
                                            handlePresetAvatarSelect(avatar);
                                        }}
                                        draggable="false"
                                    />
                                ))}
                        </div>

                        <h3>Or Upload Your Own</h3>
                        <div>
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
                            >
                                Choose Image
                            </label>
                        </div>

                        {showCropper && (
                            <div>
                                <div className="crop-container">
                                    <Cropper
                                        image={avatarPreview}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onCropComplete={(
                                            croppedArea,
                                            croppedPixels,
                                        ) =>
                                            setCroppedAreaPixels(croppedPixels)
                                        }
                                    />
                                </div>
                                {/* Ensure button is BELOW the cropper */}
                                <div className="crop-actions">
                                    <button onClick={uploadAvatar}>
                                        Upload
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            className="close-modal"
                            onClick={() => {
                                playClickSound();
                                setShowAvatarModal(false);
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Card Theme Selection Modal */}
            {showCardThemeModal && (
                <div className="modal-backdrop">
                    <div className="theme-modal">
                        <h2>Select Card Theme</h2>
                        <div className="theme-selection">
                            {cardThemes.map((theme, index) => (
                                <div
                                    key={theme.path || index}
                                    className="card-theme-option"
                                    onClick={() => {
                                        playClickSound();
                                        handleThemeSelect(theme);
                                    }}
                                >
                                    {/* Card inside the border */}
                                    <div className="card-container">
                                        {/* Use GetCardTheme for dynamic color preview */}
                                        <GetCardTheme
                                            key={`${color1}-${color2}`}
                                            id={theme.path}
                                            color1={color1}
                                            color2={color2}
                                            draggable="false"
                                        />
                                    </div>

                                    {/* Theme Name Below the Border */}
                                    <p>{theme.name}</p>
                                </div>
                            ))}
                        </div>

                        {/* Color Pickers for Customization */}
                        <div className="color-picker-container">
                            <label>Primary Color:</label>
                            <input
                                type="color"
                                value={color1}
                                onChange={(e) => setColor1(e.target.value)}
                            />

                            <label>Pattern Color:</label>
                            <input
                                type="color"
                                value={color2}
                                onChange={(e) => setColor2(e.target.value)}
                            />
                        </div>

                        {/* Close Modal Button */}
                        <button
                            className="close-modal"
                            onClick={handleThemeClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Account;
