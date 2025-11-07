/**
 * @fileoverview Account page for managing user settings, avatar, sound, and themes.
 * <br><br>
 * This component allows users to customize their account settings, including avatar upload, sound selection, card themes, and titles. <br>
 * It also displays user statistics and provides options to navigate to achievements or logout.
 * <br><br>
 * The component uses various hooks to manage state and effects, including avatar upload,
 * card theme selection, title management, and statistics retrieval. <br> 
 * It also integrates with a WebSocket connector to receive real-time updates on account changes.
 */

// Components
import MenuButton from '../components/MenuButton';
import BackButton from '../components/BackButton';
import ChatSidebar from '../components/ChatSidebar';
import AvatarUploader from '../components/AvatarUploader';
import AvatarIcon from '../components/AvatarIcon';
import MenuSelect from '../components/MenuSelect';
import ThemeSelector from '../components/ThemeSelector';
import StatisticBox from '../components/StatisticBox';
import PopupModal from '../components/PopUpModal';

// Hooks
import useAvatarUpload from '../hooks/useAvatarUpload';
import useCardTheme from '../hooks/useCardTheme';
import useTitles from '../hooks/useTitles';
import useStatistics from '../hooks/useStatistics';
import useWebSocketConnector from '../hooks/useWebSocketConnector';
import { useAuthGuard } from '../hooks/useAuthGuard';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Account component serves as the user account management interface.
 * <br><br>
 * It allows users to customize their account settings, including avatar upload, sound selection,
 * card themes, and titles. <br>
 * The component also displays user statistics and provides options to navigate to achievements or logout.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * Initializes the PopupManager to handle popup messages when the component mounts. <br>
 * This ensures that the popup system is ready to display messages for user actions.
 * <br><br>
 * <strong>fetchAccount:</strong> <br>
 * Fetches the user's account details from the server, including avatar, uploaded avatar, and statistics.
 * It updates the state with the fetched data and loads titles from the account.
 * <br><br>
 * <strong>handleLogout:</strong> <br>
 * Handles the logout process by sending a POST request to the server and navigating to the access page
 * upon successful logout. If an error occurs, it displays an error message in a popup modal.
 * <br><br>
 * <strong>useWebSocketConnector:</strong> <br>
 * A custom hook that connects to the WebSocket server to receive real-time updates on account changes
 * and updates the component state accordingly.
 * <br><br>
 * <strong>useAvatarUpload</strong>
 * A custom hook that manages the avatar upload functionality, including handling image cropping,
 * zooming, and uploading the avatar to the server. It also provides a preview of the avatar before upload.
 * <br><br>
 * <strong>useCardTheme</strong>
 * A custom hook that manages the card theme selection functionality, allowing users to select and save card themes.
 * It provides the selected theme, colors, and a method to save the theme to the server.
 * <br><br>
 * <strong>useTitles</strong>
 * A custom hook that manages the titles functionality, allowing users to select and change their titles.
 * It provides the selected title, color, and methods to load titles from the account and handle title changes.
 * <br><br>
 * <strong>useStatistics</strong>
 * A custom hook that manages the user statistics, providing methods to fetch and update statistics.
 * It also provides the labels for the statistics to be displayed in the UI.
 * <br><br>
 * <strong>useAuthGuard</strong>
 * A custom hook that checks if the user is authenticated and returns the authentication status.
 * This is used to conditionally render the account page and ensure that only authenticated users can access it.
 * 
 * @function Account
 * @returns {JSX.Element} The rendered Account interface. 
 */
function Account() {
    const [username, setUsername] = useState('Player');

    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showCardThemeModal, setShowCardThemeModal] = useState(false);

    const [selectedSound, setSelectedSound] = useState('none.mp3');
    const [selectedAvatar, setSelectedAvatar] = useState(`${BASE_URL}avatars/default.svg`,);
    const [uploadedAvatar, setUploadedAvatar] = useState('');

    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const navigate = useNavigate();
    const init = useRef(false);
    const isAuthenticated = useAuthGuard();

    /**
     * A custom hook that manages the avatar upload functionality, including handling image cropping,
     * zooming, and uploading the avatar to the server. It also provides a preview of the avatar before upload.
     * It includes methods for handling avatar changes, uploading the avatar, and selecting preset avatars.
     * The hook returns the necessary state and methods to manage the avatar upload process.
     */
    const {
        avatarPreview,
        setAvatarPreview,
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
    } = useAvatarUpload({
        BASE_URL,
        onUploadSuccess: (url) => { 
            setSelectedAvatar(url);
            setShowAvatarModal(false);
        },
    });

    /**
     * A custom hook that manages the card theme selection functionality, allowing users to select and save card themes.
     * It provides the selected theme, colors, and a method to save the theme to the server.
     * The hook returns the necessary state and methods to manage card themes, including the selected theme,
     * colors, and a method to save the theme.
     */
    const {
        selectedTheme,
        setSelectedTheme,
        color1,
        setColor1,
        color2,
        setColor2,
        saveTheme,
        cardThemes,
    } = useCardTheme();

    /**
     * A custom hook that manages the titles functionality, allowing users to select and change their titles.
     * It provides the selected title, color, and methods to load titles from the account and handle title changes.
     * The hook returns the necessary state and methods to manage titles, including the selected title,
     * color, and methods to load titles from the account and handle title changes.
     */
    const {
        titles,
        selectedTitle,
        selectedColor,
        setTitles,
        loadTitlesFromAccount,
        updateSelectedTitle,
        handleTitleChange,
    } = useTitles();

    /**
     * A custom hook that manages the user statistics, providing methods to fetch and update statistics.
     * It also provides the labels for the statistics to be displayed in the UI.
     * The hook returns the necessary state and methods to manage user statistics, including the statistics data
     * and the labels for the statistics.
     */
    const { statistics, setStatistics, statLabels } = useStatistics();

    /**
     * Fetches the user's account details from the server, including avatar, uploaded avatar, and statistics.
     * It updates the state with the fetched data and loads titles from the account.
     * This function is called when the component mounts or when the authentication status changes.
     * It ensures that the account details are up-to-date and reflects any changes made by the user.
     */
    const fetchAccount = async () => {
        const response = await fetch(`${BASE_URL}get-account`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch account');

        const result = await response.json();

        setUsername(result.username || 'Player');

        setStatistics(result.statistics || {});

        setSelectedAvatar(`${BASE_URL}avatars/${result.avatar}`);
        setUploadedAvatar(`${BASE_URL}avatars/${result.uploadedAvatar}`);

        loadTitlesFromAccount(result);
    };

    /**
     * Initializes the component by setting up the PopupManager and loading user-specific sounds.
     * This effect runs once when the component mounts or when the authentication status changes.
     * It ensures that the PopupManager is ready to handle popups and that user-specific sounds
     * are loaded only if the user is authenticated.
     * It also fetches the account details and sets the initial state for the component.
     * This is important for performance and user experience, as it prevents unnecessary sound loading
     * for unauthenticated users and ensures that the account details are available when the component is rendered.
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup);

        SoundManager.loadUserSound(true).then(() => {
            setSelectedSound(SoundManager.getCurrentSound());
        });

        fetchAccount();
    }, [isAuthenticated]);

    /**
     * A custom hook that connects to the WebSocket server to receive real-time updates on account changes
     * and updates the component state accordingly. It listens for messages related to account updates
     * and updates the statistics, avatar, and titles based on the received data.
     * This ensures that the component reflects the latest account information without requiring a full page reload.
     * It also handles the case where the user changes their avatar or titles, ensuring that the UI is always in sync with the server state.
     */
    useWebSocketConnector("account", {}, init.current, (message) => {
        if (message.type === 'accountUpdate') {
            if (message.data.statistics) {
                setStatistics(message.data.statistics);
            }

            if(message.data.titles) {
                setTitles(message.data.titles);
            }

            if(message.data.avatar) {
                setUploadedAvatar(`${BASE_URL}avatars/${message.data.avatar}`);
            }
        }
    });

    /**
     * Handles the logout process by sending a POST request to the server and navigating to the access page
     * upon successful logout. If an error occurs, it displays an error message in a popup modal.
     * This function is called when the user clicks the logout button in the account menu.
     * It ensures that the user is logged out properly and that any necessary cleanup is performed.
     * It also provides feedback to the user in case of an error during the logout process.
     * This is important for maintaining a good user experience and ensuring that the user is aware of
     * the logout status.
     */
    const handleLogout = async () => {
        try {
            const response = await fetch(`${BASE_URL}logout`, {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();
            if (data.success) {
                navigate('/access');
            } else {
                PopupManager.showPopup({
                    title: data.title, 
                    message: data.error, 
                    icon: '🚫'
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'Logout failed. Please try again.',
                icon: '⌛',
            });
            console.error('Error during logout:', error);
        }
    };

    return (
        <div className="@container/account flex flex-col items-center justify-center h-screen">

            {/* Background overlay image */}
            <div className="account-wrapper">

                {/* Title for the account section */}
                <h1 className="account-home">
                    {username}
                </h1>

                {/* Container for displaying user options */}
                <div className="account-menu">

                    {/* Container for displaying user customization */}
                    <div className="options-wrapper">

                        <h2 className="options-title">
                            Options
                        </h2>

                        {/* Avatar selection and upload */}
                        <AvatarIcon 
                            src={selectedAvatar}
                            isLocal
                            onClick={() => setShowAvatarModal(true)}
                        />

                        {/* Sound selection dropdown */}
                        <MenuSelect
                            label="Select Click Sound:"
                            id="optionsSelect"
                            value={selectedSound}
                            onChange={(e) => {
                                const selectedOption = e.target.selectedOptions[0];
                                const soundPath = selectedOption.getAttribute('data-path');
                                const soundName = selectedOption.getAttribute('data-name');

                                setSelectedSound(soundPath);
                                SoundManager.userSoundChange(soundPath, soundName);
                            }}
                            options={SoundManager.getClickSounds()}
                        />

                        {/* Card Theme selection dropdown */}
                        <div className="select-wrapper">
                            <label 
                                htmlFor="optionsSelect"
                                className="select-label">
                                Select Card Theme:
                            </label>
                            <div
                                className="options-theme"
                                onClick={() => {
                                    SoundManager.playClickSound();
                                    setShowCardThemeModal(true);
                                }}
                            >
                                {cardThemes.find((theme) => theme.path === selectedTheme)?.name || 'Classic'}
                            </div>
                        </div>

                        {/* Title selection dropdown */}
                        <MenuSelect
                            label="Select Title:"
                            id="optionsSelect"
                            value={selectedTitle}
                            onChange={handleTitleChange}
                            selectStyle={{ color: selectedColor }}
                            options={titles.map((title) => ({
                                name: title.name,
                                value: title.name,
                                color: title.color,
                            }))}
                        />
                    </div>

                    {/* Container for displaying user statistics */}
                    <StatisticBox statistics={statistics} statLabels={statLabels} />
                </div>

                {/* Buttons for navigating to achievements and logging out */}
                <div className="flex mt-4 sm:mt-1 lg:mt-2 xl:mt-2 2xl:mt-0">

                    { /* Button to view achievements */ }
                    <MenuButton
                        wrapper={true}
                        buttonClass="account-btn"
                        textClass="btn-txt"
                        icon="button"
                        text="Achievements"
                        to="/achievements"
                    />

                    {/* Button to logout */}
                    <MenuButton
                        wrapper={true}
                        buttonClass="account-btn"
                        textClass="btn-txt"
                        icon="button"
                        text="Logout"
                        onClick={handleLogout}
                    />
                </div>
            </div>

            <BackButton />

            <AvatarUploader
                isOpen={showAvatarModal}
                onClose={() => {
                    SoundManager.playClickSound();
                    setAvatarPreview(null);
                    setShowAvatarModal(false);
                    setShowCropper(false);
                }}
                uploadedAvatar={uploadedAvatar}
                onPresetSelect={selectPresetAvatar}
                onAvatarUpload={uploadAvatar}
                avatarPreview={avatarPreview}
                showCropper={showCropper}
                crop={crop}
                zoom={zoom}
                setCrop={setCrop}
                setZoom={setZoom}
                setCroppedAreaPixels={setCroppedAreaPixels}
                handleAvatarChange={handleAvatarChange}
            />

            <ThemeSelector
                isOpen={showCardThemeModal}
                onClose={() => setShowCardThemeModal(false)}
                onSave={async (theme, c1, c2) => {
                    setSelectedTheme(theme);
                    setColor1(c1);
                    setColor2(c2);
                    return await saveTheme(theme, c1, c2);
                }}
                themes={cardThemes}
                selectedTheme={selectedTheme}
                color1={color1}
                color2={color2}
            />

            <ChatSidebar />

            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onOk={PopupManager.okPopup}
                onCancel={PopupManager.cancelPopup}
                useCancel={popup.useCancel}
            />
        </div>
    );
}

export default Account;
