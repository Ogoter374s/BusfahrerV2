/**
 * Account.jsx — Account settings interface for Busfahrer Extreme.
 *
 * Allows users to customize personal settings including avatar, title, card theme, and click sound.
 * Displays player statistics, provides access to achievements, and supports logout functionality.
 * Includes real-time updates via WebSocket for account-related data changes.
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
import { useAuthGuard } from '../hooks/useAuthGuard';
import useWebSocketConnector from '../hooks/useWebSocketConnector';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Account component function.
 *
 * Manages user preferences, profile information, and statistic display.
 * Initializes WebSocket connection for live account updates, fetches account data,
 * and renders UI elements for avatar upload, theme selection, title selection,
 * and sound preference. Includes logout logic and modal integrations.
 *
 * @function Account
 * @returns {JSX.Element} The full rendered account management screen.
 */
function Account() {
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showCardThemeModal, setShowCardThemeModal] = useState(false);

    const [selectedSound, setSelectedSound] = useState('none.mp3');
    const [selectedAvatar, setSelectedAvatar] = useState(`${BASE_URL}avatars/default.svg`,);

    const [uploadedAvatar, setUploadedAvatar] = useState('');

    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const navigate = useNavigate();
    const init = useRef(false);
    const isAuthenticated = useAuthGuard();

    const {
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
    } = useAvatarUpload({
        BASE_URL,
        onUploadSuccess: (url) => { 
            setSelectedAvatar(url);
            setShowAvatarModal(false);
        },
    });

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

    const {
        titles,
        selectedTitle,
        selectedColor,
        setTitles,
        loadTitlesFromAccount,
        updateSelectedTitle,
        handleTitleChange,
    } = useTitles();

    const { statistics, setStatistics, statLabels } = useStatistics();

    /**
     * fetchAccount — Loads the user's account information.
     *
     * Retrieves avatar, uploaded avatar, titles, and statistics from the backend.
     * Populates corresponding states and invokes title setup logic.
     *
     * @function fetchAccount
     * @returns {Promise<void>}
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

        setStatistics(account.statistics || {});

        setSelectedAvatar(`${BASE_URL}avatars/${account.avatar}`);
        setUploadedAvatar(`${BASE_URL}avatars/${account.uploadedAvatar}`);

        loadTitlesFromAccount(account);
    };

    /**
     * useEffect — Initializes WebSocket and sound settings on first render.
     *
     * Subscribes to real-time account updates through the WebSocket connection.
     * Handles updates for avatar, uploaded avatar, statistics, and selected title.
     * Also loads saved sound preferences and initial account data.
     * Closes WebSocket connection on unmount or browser unload.
     *
     * @function useEffect (account initialization)
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup);
        setPopupManager(PopupManager);

        SoundManager.loadUserSound(true).then(() => {
            setSelectedSound(SoundManager.getCurrentSound());
        });

        fetchAccount();
    }, [isAuthenticated]);

    useWebSocketConnector("account", {}, (message) => {
        if (message.type === 'accountUpdate') {
            if (message.data.statistics) {
                setStatistics(message.data.statistics);
            }

            setSelectedAvatar(
                `${BASE_URL}avatars/${message.data.avatar}`,
            );
            setUploadedAvatar(
                `${BASE_URL}avatars/${message.data.uploadedAvatar}`,
            );

            if (message.data.selectedTitle) {
                updateSelectedTitle(message.data.selectedTitle);
            }
        }

        if (message.type === 'titlesUpdate') {
            setTitles(message.data);
        }
    });

    /**
     * handleLogout — Handles logout process and redirects to access screen.
     *
     * Sends logout request to the backend, plays click sound, and navigates to /access.
     * Displays an error alert if the logout request fails.
     *
     * @function handleLogout
     * @returns {Promise<void>}
     */
    const handleLogout = async () => {
        SoundManager.playClickSound();
        try {
            await fetch(`${BASE_URL}logout`, {
                method: 'POST',
                credentials: 'include',
            });

            navigate('/access');
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'Logout failed. Please try again.',
                icon: '⌛',
            });
            console.error('Error during logout:', error);
        }
    };

    /**
     * Renders the account settings layout.
     *
     * Includes:
     * - Background overlay and main account layout
     * - Avatar selection (modal)
     * - Sound selection
     * - Card theme selector (modal)
     * - Title dropdown
     * - Statistics display
     * - Logout and achievements navigation
     * - Chat sidebar for social features
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
                            className="options-selection"
                        />

                        {/* Card Theme selection dropdown */}
                        <div className="options-selection">
                            <label htmlFor="optionsSelect">
                                Select Card Theme:
                            </label>
                            <div
                                className="dropdown-style"
                                onClick={() => {
                                    SoundManager.playClickSound();
                                    setShowCardThemeModal(true);
                                }}
                            >
                                {cardThemes.find(
                                    (theme) => theme.path === selectedTheme,
                                )?.name || 'Classic'}
                            </div>
                        </div>

                        {/* Title Selection Dropdown */}
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

                {/* Logout and Achievment Buttons */}
                <div className="account-cont">
                    <MenuButton
                        wrapperClass="none"
                        buttonClass="btn-achievements"
                        icon="button.svg"
                        alt="Achievements"
                        text="Achievements"
                        to="/achievements"
                    />
                    <MenuButton
                        wrapperClass="none"
                        buttonClass="btn-account"
                        icon="button.svg"
                        alt="Logout"
                        text="Logout"
                        onClick={handleLogout}
                    />
                </div>
            </div>

            {/* Back button to navigate to the home page */}
            <BackButton />

            {/* Avatar Selection Modal */}
            <AvatarUploader
                isOpen={showAvatarModal}
                onClose={() => {
                    SoundManager.playClickSound();
                    setShowAvatarModal(false);
                }}
                uploadedAvatar={uploadedAvatar}
                selectedAvatar={selectedAvatar}
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

            {/* Card Theme Selection Modal */}
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
                setSelectedTheme={setSelectedTheme}
                setColor1={setColor1}
                setColor2={setColor2}
            />

            {/* Sidebar Toggle */}
            <ChatSidebar />

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={PopupManager.closePopup}
            />
        </div>
    );
}

export default Account;
