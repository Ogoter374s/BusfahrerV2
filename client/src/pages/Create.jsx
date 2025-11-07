/**
 * @fileoverview Page for creating a new game session with customizable settings. 
 * <br> <br>
 * Users can input game and player details, select game modes, and create the game. <br>
 * Utilizes various components and hooks for functionality and UI.
 */

// Components
import ChatSidebar from '../components/ChatSidebar';
import MenuInput from '../components/MenuInput';
import MenuButton from '../components/MenuButton';
import BackButton from '../components/BackButton';
import MenuSelect from '../components/MenuSelect';
import MenuCheckBox from '../components/MenuCheckBox';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { PopupManager } from '../utils/popupManager';

// Utils
import BASE_URL from '../utils/config';
import { shuffleStyles, cardMatchStyles, turnModes, busfahrerSelectionMode, schluckGiveMode, PLAYER_GENDER } from "../utils/constants";

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component for the Create Game page.
 * Allows users to set up a new game session with various options.
 * <br><br>
 * Includes inputs for game and player details. <br>
 * Provides dropdowns and checkboxes for game settings. <br>
 * Displays a popup modal for messages and confirmations.
 * <br><br>
 * <strong>createLobby:</strong> <br>
 * Handles the creation of a new game lobby. <br>
 * Validates input fields and sends a request to the server. <br>
 * Displays popups for success or error messages.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * Initializes the popup manager and sets authentication guard. <br>
 * 
 * @function Create
 * @returns {JSX.Element} The Create Game page component.
 */
function Create() {
    const [gameName, setGameName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [gender, setGender] = useState(PLAYER_GENDER.MALE);

    const [selectedShuffle, setSelectedShuffle] = useState('Fisher-Yates');
    const [selectedCardMatch, setSelectedCardMatch] = useState('Number-only');
    const [cardChaos, setCardChaos] = useState(false);
    const [selectedTurnMode, setSelectedTurnMode] = useState('Default');
    const [selectedBusfahrerMode, setSelectedBusfahrerMode] = useState('Default');
    const [playerLimit, setPlayerLimit] = useState(10);
    const [selectedSchluckGiveMode, setSelectedSchluckGiveMode] = useState('Default');
    const [everyoneCanPhase3, setEveryoneCanPhase3] = useState(true);
    const [hotJoin, setHotJoin] = useState(false);
    const [cardChange, setCardChange] = useState(false);
    const [gameInherit, setGameInherit] = useState(false);

    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const init = useRef(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthGuard();

    /**
     * Creates a new lobby with the provided parameters.
     * Validates input and sends a request to the server.
     * Displays popups for errors or success.
     */
    const createLobby = async ({ gameName, playerName, isPrivate, gender, settings }) => {
        const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;

        if (!gameName?.trim()) {
            PopupManager.showPopup({
                title: "Invalid Game Name",
                message: "Please provide a valid game name.",
                icon: '🚫',
            });
            return;
        }

        if (!nameRegex.test(gameName.trim())) {
            PopupManager.showPopup({
                title: "Invalid Game Name",
                message: "Game name must contain only letters (A–Z or a–z).",
                icon: '🚫',
            });
            return;
        }

        if (!playerName?.trim()) {
            PopupManager.showPopup({
                title: "Invalid Player Name",
                message: "Please provide a valid player name.",
                icon: '🚫',
            });
            return;
        }

        if (!nameRegex.test(playerName.trim())) {
            PopupManager.showPopup({
                title: "Invalid Player Name",
                message: "Player name must contain only letters (A–Z or a–z).",
                icon: '🚫',
            });
            return;
        }

        const payload = {
            lobbyName: gameName.trim().slice(0, 16),
            playerName: playerName.trim().slice(0, 26),
            isPrivate,
            gender,
            settings,
        };

        try {
            const response = await fetch(`${BASE_URL}create-lobby`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                navigate(`/lobby/${data.lobbyId}`);
            } else {
                PopupManager.showPopup({
                    title: "Game Creation",
                    message: "Failed to create the game.",
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: 'Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: '❌',
            });
            console.error("Error creating game:", error);
        }
    };
    
    /**
     * Effect hook to initialize the popup manager and set authentication guard.
     * Runs once on component mount if the user is authenticated.
     * Initializes the PopupManager with the setPopup function.
     * Sets the PopupManager instance in the custom hook.
     */
    useEffect(() => {
        if(!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup);
    }, [isAuthenticated]);

    return (
        <div className="@container/create flex flex-col items-center justify-center h-screen">
            
            {/* Background overlay image */}
            <div className="create-wrapper">
                {/* Game name input */}
                <div className="create-game">
                    {/* Game session title and branding logo */}
                    <img
                        src="/logos/logo.svg" 
                        alt="Game Logo"
                        className="create-logo"
                    />

                    <h1 className="create-title">
                        Play
                        <span className="highlight">Game</span>
                    </h1>

                    {/* Form inputs for game and player details */}
                    <div className="flex flex-col
                        gap-3 sm:gap-1 lg:gap-2 xl:gap-2 2xl:gap-3
                    ">
                        {/* Input for the game name */}
                        <MenuInput 
                            type="text"
                            placeholder="Game Name"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            img="wood_blue"
                            required
                        />

                        {/* Input for player's display name */}
                        <MenuInput 
                            type="text"
                            placeholder="Player Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            img="wood_blue"
                            required
                        />

                        {/* Gender selection dropdown */}        
                        <MenuSelect
                            label="Gender:"
                            id="optionsSelect"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            options={[
                                { name: "Male", value: PLAYER_GENDER.MALE},
                                { name: "Female", value: PLAYER_GENDER.FEMALE},
                                { name: "Other", value: PLAYER_GENDER.OTHER},
                            ]}
                        />

                        {/* Checkbox for marking game as private or public */}
                        <MenuCheckBox 
                            label="Private Game"
                            value={isPrivate}
                            onChange={() => setIsPrivate(!isPrivate)}
                            className="options-selection"
                            selectType="checkbox"
                        />
                    </div>

                    {/* Button to create the game */}
                    <MenuButton
                        wrapper={true}
                        wrapperClass="mt-4 sm:mt-1 lg:mt-2 xl:mt-2 2xl:mt-3"
                        buttonClass="create-btn"
                        textClass="btn-txt"
                        icon="button"
                        alt="Create Game"
                        text="Create Game"
                        onClick={() =>
                            createLobby({
                                gameName,
                                playerName,
                                isPrivate,
                                gender,
                                settings: {
                                    shuffling: selectedShuffle,
                                    matching: selectedCardMatch,
                                    isChaos: cardChaos,
                                    turning: selectedTurnMode,
                                    busMode: selectedBusfahrerMode,
                                    playerLimit,
                                    giving: selectedSchluckGiveMode,
                                    isEveryone: everyoneCanPhase3,
                                    hotJoin,
                                    isCardChange: cardChange,
                                    canInherit: gameInherit,
                                },
                            })
                        }
                    />
                </div>

                {/* Container for game configuration options */}
                <div className="create-options">
                    <h2 className="create-options-title">
                        Game
                        <span className="highlight">Options</span>
                    </h2>

                    <div className="create-options-wrapper">

                        {/* Card Shuffle selection */}
                        <MenuSelect 
                            label="Shuffle Style"
                            id="optionsSelect"
                            value={selectedShuffle}
                            onChange={(e) => setSelectedShuffle(e.target.value)}
                            options={shuffleStyles.map((s) => ({ name: s.name, value: s.type }))}
                        />
                        
                        {/* Card Match selection */}
                        <MenuSelect 
                            label="Card Match Rules"
                            id="optionsSelect"
                            value={selectedCardMatch}
                            onChange={(e) => setSelectedCardMatch(e.target.value)}
                            options={cardMatchStyles.map((s) => ({ name: s.name, value: s.type }))}
                        />

                        {/* Checkbox for marking game Chaos Mode */}
                        <MenuCheckBox 
                            label="Card Chaos Mode"
                            value={cardChaos}
                            onChange={() => setCardChaos(!cardChaos)}
                            className="options-selection"
                            selectType="checkbox"
                        />

                        {/* Turn Mode selection */}
                        <MenuSelect 
                            label="Turn Mode"
                            id="optionsSelect"
                            value={selectedTurnMode}
                            onChange={(e) => setSelectedTurnMode(e.target.value)}
                            options={turnModes.map((s) => ({ name: s.name, value: s.type }))}
                        />
                        
                        {/* Busfahrer Mode selection */}
                        <MenuSelect 
                            label="Busfahrer Selection Mode"
                            id="optionsSelect"
                            value={selectedBusfahrerMode}
                            onChange={(e) => setSelectedBusfahrerMode(e.target.value)}
                            options={busfahrerSelectionMode.map((s) => ({ name: s.name, value: s.type }))}
                        />

                        {/* Player limit per game */}
                        <div className="flex flex-col items-center">
                            <label 
                                htmlFor="playerLimit"
                                className="numberInc-label"
                            >
                                Player Limit
                            </label>
                            <input
                                type="number"
                                placeholder="Player Limit"
                                min={2}
                                max={10}
                                value={playerLimit}
                                onChange={(e) =>
                                    setPlayerLimit(parseInt(e.target.value))
                                }
                                className="numberInc-input"
                            />
                        </div>

                        {/* Schulcke Give Mode selection */}
                        <MenuSelect 
                            label="Schlucke Give Mode"
                            id="optionsSelect"
                            value={selectedSchluckGiveMode}
                            onChange={(e) => setSelectedSchluckGiveMode(e.target.value)}
                            options={schluckGiveMode.map((s) => ({ name: s.name, value: s.type }))}
                        />
                        
                        {/* Checkbox Everyone can play Phase3 */}
                        <MenuCheckBox 
                            label="Everyone can play Phase 3"
                            value={everyoneCanPhase3}
                            onChange={() => setEveryoneCanPhase3(!everyoneCanPhase3)}
                            className="options-selection"
                            selectType="checkbox"
                        />

                        {/* Checkbox Hot Join */}
                        <MenuCheckBox 
                            label="Hot Join"
                            value={hotJoin}
                            onChange={() => setHotJoin(!hotJoin)}
                            className="options-selection"
                            selectType="checkbox"
                        />

                        {/* Checkbox for marking game Cards can Change Mode */}
                        <MenuCheckBox 
                            label="Cards can Change"
                            value={cardChange}
                            onChange={() => setCardChange(!cardChange)}
                            className="options-selection"
                            selectType="checkbox"
                        />

                        {/* Checkbox for setting Game inheritance */}
                        <MenuCheckBox 
                            label="Game Master Inheritance"
                            value={gameInherit}
                            onChange={() => setGameInherit(!gameInherit)}
                            className="options-selection"
                            selectType="checkbox"
                        />
                    </div>
                </div>
            </div>

            {/* Navigation button to return to the homepage */}
            <BackButton />

            {/* Chat sidebar component */}
            <ChatSidebar />

            {/* Popup modal for displaying messages */}
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

export default Create;
