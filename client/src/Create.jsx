import BASE_URL, { WBS_URL } from './config';
import ChatSidebar from './ChatSidebar';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Create() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

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

    const navigate = useNavigate();
    const init = useRef(false);

    const shuffleStyles = [
        { name: 'Normal', type: 'Fisher-Yates' },
        { name: 'Chaotic', type: 'Chaotic' },
    ];

    const cardMatchStyles = [
        { name: 'Number-only', type: 'Number-only' },
        { name: 'Type-only', type: 'Type-only'},
        { name: 'Exact', type: 'Exact' },
    ];

    const turnModes = [
        { name: 'Default', type: 'Default' },
        { name: 'Timed', type: 'Timed' },
        { name: 'Reverse', type: 'Reverse' },
        { name: 'Random', type: 'Random' },
    ];

    const busfahrerSelectionMode = [
        { name: 'Default', type: 'Default' },
        { name: 'Reversed', type: 'Reverse' },
        { name: 'Player Vote', type: 'Voted' },
        { name: 'Random', type: 'Random' },
    ];

    /**
     * Fetches the user's selected click sound preference.
     *
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio source accordingly.
     * Uses HttpOnly cookies for authentication.
     *
     * @function fetchSoundPreference
     * @async
     * @throws {Error} If the fetch operation fails.
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
     * Initializes the component by fetching the user's sound preference.
     *
     * Ensures the fetch operation only runs once on mount using a ref flag.
     * Retrieves the saved click sound preference from the backend and sets
     * the local audio configuration accordingly.
     *
     * @function useEffect
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchSoundPreference();
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
     * Creates a new game session with custom settings and player information.
     *
     * Validates user input for game and player names, ensuring both are non-empty.
     * Trims and limits the length of both names to prevent input abuse.
     * Constructs a request body containing the game configuration, including
     * privacy mode, gender, shuffling method, card matching rules, chaos mode,
     * turn system, busfahrer mode, and the player limit.
     *
     * Sends a POST request to the backend `create-game` endpoint using
     * HttpOnly cookies for session authentication. If the game is successfully
     * created, navigates the user to the new game's lobby. Otherwise, it shows an error alert.
     *
     * Plays a UI click sound before sending the request for interactive feedback.
     *
     * @async
     * @function createGame
     * @returns {Promise<void>} A promise that resolves once the game is created or an error is handled.
     * @throws {Error} If the request fails due to network issues or an unexpected server error.
     */
    const createGame = async () => {
        playClickSound();
        if (!gameName || gameName.trim() === '') {
            alert('Please provide a valid game name.');
            return;
        }

        if (!playerName || playerName.trim() === '') {
            alert('Please provide a valid player name.');
            return;
        }

        const trmGameName = gameName.trim().slice(0, 16);
        const trmPlayerName = playerName.trim().slice(0, 26);

        try {
            const body = {
                gameName: trmGameName,
                playerName: trmPlayerName,
                isPrivate,
                gender,
                settings: {
                    shuffling: selectedShuffle,
                    matching: selectedCardMatch,
                    isChaos: cardChaos,
                    turning: selectedTurnMode,
                    busMode: selectedBusfahrerMode,
                    playerLimit,
                }
            }

            const response = await fetch(`${BASE_URL}create-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (data.success) {
                navigate(`/game/${data.gameId}`);
            } else {
                alert('Failed to create the game.');
            }
        } catch (error) {
            console.error('Unexpected error creating the game:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    /**
     * Handles the selection change for the shuffle mode setting.
     *
     * Retrieves the selected shuffle mode value from the event target
     * and updates the local state with the new shuffle configuration.
     * Also logs the selected value for debugging purposes.
     *
     * @function handleShuffleChange
     * @returns {void}
     */
    const handleShuffleChange = () => {
        const newShuffle = event.target.value;
        console.log(newShuffle);
        setSelectedShuffle(newShuffle);
    };

    /**
     * Handles the selection change for the card matching rule.
     *
     * Updates the local state with the newly selected card matching mode
     * based on the user's dropdown or radio input selection.
     *
     * @function handleCardMatchChange
     * @returns {void}
     */
    const handleCardMatchChange = () => {
        const newMatch = event.target.value;
        setSelectedCardMatch(newMatch);
    };

    /**
     * Handles the selection change for the turn-taking mode.
     *
     * Updates the local state with the selected mode for how player turns are processed
     * (e.g., sequentially, randomly, or in custom order).
     *
     * @function handleTurnMode
     * @returns {void}
     */
    const handleTurnMode = () => {
        const newTurn = event.target.value;
        setSelectedTurnMode(newTurn);
    };

    /**
     * Handles the selection change for the Busfahrer game mode.
     *
     * Updates the local state with the selected Busfahrer variant (e.g., classic, extreme).
     * Used for configuring the final game phase behavior.
     *
     * @function handleBusfahrerMode
     * @returns {void}
     */
    const handleBusfahrerMode = () => {
        const newMode = event.target.value;
        setSelectedBusfahrerMode(newMode);
    };

    /**
     * Renders the game creation UI screen.
     *
     * This component displays input fields for configuring a new game session,
     * including game name, player name, gender, privacy toggle, and multiple
     * gameplay settings such as shuffle style, card matching rules, chaos mode,
     * turn system, busfahrer selection mode, and player limit.
     *
     * Provides a structured layout with branding, responsive form sections,
     * and dynamically populated select inputs based on configuration arrays.
     * Includes buttons for creating the game and returning to the homepage.
     * Also features a persistent sidebar chat for communication.
     *
     * @function JSX Return Block
     * @returns {JSX.Element} A complete React component that renders the game setup interface.
     */
    return (
        <div className="overlay-cont">
            {/* Background decorative overlay image */}
            <img src="overlay_account.svg" alt="Overlay" className="overlay-img" />

            {/* Container for creating a new game session */}
            <div className="create-menu">
                <div className="create-form-box">

                    {/* Game session title and branding logo */}
                    <img src="logo.svg" alt="Game Logo" className="create-logo" />
                    <h1 className="create-title">
                        Play
                        <span className="highlight">Game</span>
                    </h1>

                    {/* Form inputs for game and player details */}
                    <div className="rustic-form">
                        {/* Input for the game name */}
                        <input
                            type="text"
                            placeholder="Game Name"
                            className="rustic-input"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                        />

                        {/* Input for player's display name */}
                        <input
                            type="text"
                            placeholder="Player Name"
                            className="rustic-input"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
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
                        <label className="rustic-checkbox">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={() => setIsPrivate(!isPrivate)}
                            />
                            Private Game
                        </label>
                    </div>
                </div>

                {/* Container for game configuration options */}
                <div className="create-options-box">
                    <h2 className="create-options-title">
                        Game
                        <span className="highlight">Options</span>
                    </h2>
    
                    {/* Card Shuffle selection */}
                    <div className="options-selection">
                        <label htmlFor="optionsSelect">
                            Shuffle Style
                        </label>
                        <select
                            id="optionsSelect"
                            value={selectedShuffle}
                            onChange={handleShuffleChange}
                        >
                            {shuffleStyles.map((style) => (
                                <option key={style.type} value={style.type}>
                                    {style.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Card Match selection */}
                    <div className="options-selection">
                        <label htmlFor="optionsSelect">
                            Card Match Rules
                        </label>
                        <select
                            id="optionsSelect"
                            value={selectedCardMatch}
                            onChange={handleCardMatchChange}
                        >
                            {cardMatchStyles.map((style) => (
                                <option key={style.type} value={style.type}>
                                    {style.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Checkbox for marking game Chaos Mode */}
                    <div className="options-selection">
                        <label className="rustic-checkbox">
                            <input
                                type="checkbox"
                                checked={cardChaos}
                                onChange={() => setCardChaos(!cardChaos)}
                            />
                            Card Chaos Mode
                        </label>
                    </div>

                    {/* Turn Mode selection */}
                    <div className="options-selection">
                        <label htmlFor="optionsSelect">
                            Turn Mode
                        </label>
                        <select
                            id="optionsSelect"
                            value={selectedTurnMode}
                            onChange={handleTurnMode}
                        >
                            {turnModes.map((style) => (
                                <option key={style.type} value={style.type}>
                                    {style.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Busfahrer Mode selection */}
                    <div className="options-selection">
                        <label htmlFor="optionsSelect">
                            Busfahrer Selection Mode
                        </label>
                        <select
                            id="optionsSelect"
                            value={selectedBusfahrerMode}
                            onChange={handleBusfahrerMode}
                        >
                            {busfahrerSelectionMode.map((style) => (
                                <option key={style.type} value={style.type}>
                                    {style.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Player limit per game */}
                    <div className="options-selection">
                        <label htmlFor="optionsSelect">
                            Player Limit
                        </label>
                        <input
                            type="number"
                            className="limit-input"
                            placeholder="Player Limit"
                            min={2}
                            max={10}
                            value={playerLimit}
                            onChange={(e) => setPlayerLimit(parseInt(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {/* Button to create the game */}
            <div className="create-cont">
                <button className="btn-create" onClick={createGame}>
                    <img
                        src="button.svg"
                        alt="Create Game"
                        className="create-icon"
                    />
                    <p className="btn-text">Create Game</p>
                </button>
            </div>

            {/* Navigation button to return to the homepage */}
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

            {/* Chat sidebar component */}
            <ChatSidebar />
        </div>
    );
}

export default Create;
