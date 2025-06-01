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
import useCreateGame from '../hooks/useCreateGame';

// React
import { useState, useEffect, useRef } from 'react';

function Create() {
    const [gameName, setGameName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [gender, setGender] = useState('Male');

    const [selectedShuffle, setSelectedShuffle] = useState('Fisher-Yates');
    const [selectedCardMatch, setSelectedCardMatch] = useState('Number-only');
    const [cardChaos, setCardChaos] = useState(false);
    const [selectedTurnMode, setSelectedTurnMode] = useState('Default');
    const [selectedBusfahrerMode, setSelectedBusfahrerMode] = useState('Default');
    const [playerLimit, setPlayerLimit] = useState(10);
    const [selectedSchluckGiveMode, setSelectedSchluckGiveMode] = useState('Default');
    const [everyoneCanPhase3, setEveryoneCanPhase3] = useState(true);

    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const init = useRef(false);
    const isAuthenticated = useAuthGuard();

    const {
        setPopupManager,
        createGame,
        shuffleStyles,
        cardMatchStyles,
        turnModes,
        busfahrerSelectionMode,
        schluckGiveMode,
    } = useCreateGame();
    

    useEffect(() => {
        if(!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup);
        setPopupManager(PopupManager);
    }, [isAuthenticated]);

    return (
        <div className="overlay-cont">
            {/* Background decorative overlay image */}
            <img
                src="overlay_account.svg"
                alt="Overlay"
                className="overlay-img"
            />

            {/* Container for creating a new game session */}
            <div className="create-menu">
                <div className="create-form-box">
                    {/* Game session title and branding logo */}
                    <img
                        src="logo.svg"
                        alt="Game Logo"
                        className="create-logo"
                    />
                    <h1 className="create-title">
                        Play
                        <span className="highlight">Game</span>
                    </h1>

                    {/* Form inputs for game and player details */}
                    <div className="rustic-form">
                        {/* Input for the game name */}
                        <MenuInput 
                            type="text"
                            placeholder="Game Name"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            cssName="rustic-input"
                        />

                        {/* Input for player's display name */}
                        <MenuInput 
                            type="text"
                            placeholder="Player Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            cssName="rustic-input"
                        />

                        {/* Gender selection dropdown */}
                        <label className="rustic-label">Gender:</label>
                        <select
                            className="gender-select"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Divers">Divers</option>
                        </select>

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
                        wrapperClass="create-cont"
                        buttonClass="btn-create"
                        icon="button.svg"
                        alt="Create Game"
                        text="Create Game"
                        onClick={() =>
                            createGame({
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
                                },
                            })
                        }
                    />
                </div>

                {/* Container for game configuration options */}
                <div className="create-options-box">
                    <h2 className="create-options-title">
                        Game
                        <span className="highlight">Options</span>
                    </h2>

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
                    <div className="options-selection">
                        <label htmlFor="optionsSelect">Player Limit</label>
                        <input
                            type="number"
                            className="limit-input"
                            placeholder="Player Limit"
                            min={2}
                            max={10}
                            value={playerLimit}
                            onChange={(e) =>
                                setPlayerLimit(parseInt(e.target.value))
                            }
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
                onClose={PopupManager.closePopup}
            />
        </div>
    );
}

export default Create;
