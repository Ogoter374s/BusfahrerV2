import BASE_URL, { WBS_URL } from './config';
import { GetCardThemeURL } from './CardThemes';

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Phase3() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [selectedTheme, setSelectedTheme] = useState('default');
    const [color1, setColor1] = useState('#ffffff');
    const [color2, setColor2] = useState('#ff4538');

    const { gameId } = useParams();

    const [gameCards, setGameCards] = useState([]);
    const [busfahrerName, setBusfahrerName] = useState('');
    const [drinkCount, setDrinkCount] = useState(0);
    const [endGame, setEndGame] = useState(false);
    const [hoverCard, setHoverCard] = useState(null);
    const [isLast, setIsLast] = useState(false);
    const [players, setPlayers] = useState([]);
    const [currentPlayerId, setCurrentPlayerId] = useState(null);
    const [ws, setWs] = useState(null);

    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);
    const busfahrerIdRef = useRef(null);
    const roundRef = useRef(null);
    const lastCardRef = useRef(null);
    const wsRef = useRef(null);
    const init = useRef(false);

    /**
     * Fetches and processes the game's card layout.
     *
     * Retrieves all cards in the game and structures them into a phase-based pyramid format.
     */
    const fetchCards = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-game-cards?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch game cards');
            }

            const gCards = await response.json();
            const phaseRows = [];
            let idx = 0;
            const maxRows = 5;

            phaseRows.push(gCards.slice(idx, idx + 2));
            idx += 2;

            for (let row = 2; row <= maxRows; row++) {
                phaseRows.push(gCards.slice(idx, idx + row));
                idx += row;
            }

            for (let row = maxRows - 1; row >= 2; row--) {
                phaseRows.push(gCards.slice(idx, idx + row));
                idx += row;
            }

            phaseRows.push(gCards.slice(idx, idx + 2));
            setGameCards(phaseRows);
        } catch (error) {
            console.error('Error fetching game cards:', error);
        }
    };

    /**
     * Fetches the total drink count in the game.
     *
     * Retrieves the drink count from the backend and updates state.
     */
    const getDrinkCount = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-drink-count?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const drinks = await response.json();
            setDrinkCount(drinks);
        } catch (error) {
            console.error('Error fetching drink count:', error);
        }
    };

    /**
     * Checks if the game has ended by retrieving the end-game status.
     *
     * Sends a GET request to determine if the game has reached its conclusion.
     * Updates the `setEndGame` state accordingly.
     * Uses HTTP-only cookies for authentication.
     */
    const checkEndGame = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-end-game?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            if (!response.ok)
                throw new Error('Failed to check end game status');

            const end = await response.json();
            setEndGame(end);
        } catch (error) {
            console.error('Error checking game end status:', error);
        }
    };

    /**
     * Fetches the Busfahrer details.
     *
     * Retrieves the busfahrer ID and name from the backend and updates state.
     * Uses HTTP-only cookies for authentication.
     */
    const getBusfahrer = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-busfahrer?gameId=${gameId}`,
                {
                    method: 'GET',
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch busfahrer details');
            }

            const busfahrer = await response.json();
            busfahrerIdRef.current = busfahrer.playerIds;
            setBusfahrerName(busfahrer.busfahrerName);
        } catch (error) {
            console.error('Error fetching busfahrer:', error);
        }
    };

    /**
     * Fetches the current round of the game from the server.
     *
     * Sends a GET request to retrieve the current round number for the specified game.
     * Updates the `roundRef` state to reflect the latest round value.
     * Uses HTTP-only cookies for authentication.
     */
    const getRound = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-round?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // Ensures HTTP-only cookies are sent
                },
            );

            if (!response.ok) throw new Error('Failed to fetch round data');

            const round = await response.json();
            roundRef.current = round;
        } catch (error) {
            console.error('Error fetching round data:', error);
        }
    };

    /**
     * Fetches the player's unique identifier from the backend.
     *
     * Sends a GET request using HttpOnly cookie authentication.
     * Stores the fetched player ID in a React ref for comparison during events.
     */
    const fetchPlayerId = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-player-id`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const id = await response.json();

            playerIdRef.current = id;
        } catch (error) {
            console.error('Error fetching player ID:', error);
        }
    };

    /**
     * Checks if the current player is the game master.
     *
     * Uses HttpOnly cookie authentication and updates the game master state.
     */
    const checkGameMaster = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-game-master?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const isMaster = await response.json();
            gameMasterRef.current = isMaster;
        } catch (error) {
            console.error('Error checking game master status:', error);
        }
    };

    /**
     * Fetches the user's selected click sound preference.
     *
     * Sends a GET request to the backend to retrieve the saved sound preference.
     * Updates the selected sound state and sets the audio source accordingly.
     * Uses HttpOnly cookies for authentication.
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
     * Fetches the user's selected card back theme.
     */
    const fetchCardTheme = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-card-theme`, {
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch card theme');

            const data = await response.json();

            setSelectedTheme(data.theme);

            setColor1(data.color1);
            setColor2(data.color2);
        } catch (error) {
            console.error('Error fetching card theme preference:', error);
        }
    };

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-players/${gameId}`, {
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch players');

            const data = await response.json();
            setPlayers(data.players);
            setCurrentPlayerId(data.currentPlayer);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    /**
     * Sets up a WebSocket connection to receive real-time game updates.
     *
     * Initializes the WebSocket, subscribes to game updates, and listens for incoming messages.
     * Fetches game-related data such as player ID, cards, drink count, and round information.
     * Cleans up by closing the WebSocket connection when the component unmounts.
     */
    useEffect(() => {
        if (init.current) return;
        init.current = true;

        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            wsRef.current = new WebSocket(WBS_URL);

            wsRef.current.onopen = () => {
                wsRef.current.send(
                    JSON.stringify({ type: 'subscribe', gameId }),
                );
            };

            wsRef.current.onmessage = async (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'cardsUpdate') {
                    setGameCards(message.data.diamondCards);
                }

                if (message.type === 'drinkUpdate') {
                    getDrinkCount();
                }

                if (message.type === 'gameUpdate') {
                    roundRef.current = message.data.round;
                    busfahrerIdRef.current = message.data.busfahrerIds;

                    setBusfahrerName(message.data.busfahrerName);
                    setEndGame(message.data.endGame);

                    setPlayers(message.data.players);
                    setCurrentPlayerId(message.data.currentPlayer);
                }

                if (message.type === 'close') {
                    if (message.userId !== playerIdRef.current) {
                        alert('Game has been closed');
                        navigate('/lobbys');
                    }
                }

                if (message.type === 'newGame') {
                    alert('A new game was opend');
                    navigate(`/game/${message.newId}`);
                }
            };
        }

        fetchPlayerId();
        fetchCards();
        checkGameMaster();
        getRound();
        getBusfahrer();
        checkEndGame();
        getDrinkCount();

        fetchSoundPreference();
        fetchCardTheme();
        fetchPlayers();

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
    }, [gameId]);

    /**
     * Plays a click sound effect.
     *
     * Resets the current playback time to the beginning and plays the sound.
     * Ensures the sound plays from the start each time the function is called.
     */
    const playClickSound = () => {
        soundRef.current.currentTime = 0;
        soundRef.current.play();
    };

    /**
     * Calculates the index of a card in the game's structured layout.
     *
     * The game board consists of multiple rows of varying sizes.
     * This function determines the card's absolute index based on its row and column position.
     *
     * @param {number} rowIdx - The index of the row where the card is located.
     * @param {number} colIdx - The index of the column within the specified row.
     * @returns {number} The absolute index of the card in the game's layout.
     */
    const getCardIdx = (rowIdx, colIdx) => {
        const rowSizes = [2, 2, 3, 4, 5, 4, 3, 2, 2];

        let totalCardsBefore = 0;
        // Sum up the number of cards before the target row
        for (let i = 0; i < rowIdx; i++) {
            totalCardsBefore += rowSizes[i];
        }

        // Compute and return the absolute card index
        return totalCardsBefore + colIdx;
    };

    /**
     * Checks whether the last played card meets a specific condition.
     *
     * Determines if the last played card was categorized as "higher," "lower," or "same."
     * This function is used to validate game progression based on the last card's status.
     *
     * @returns {boolean} True if the last card is classified as "higher," "lower," or "same," otherwise false.
     */
    const checkLastCard = () => {
        return (
            lastCardRef.current === 'higher' ||
            lastCardRef.current === 'lower' ||
            lastCardRef.current === 'same'
        );
    };

    /**
     * Allows a player to leave the game.
     *
     * Sends a POST request to remove the player from the game.
     * Navigates to the correct screen based on whether the player was the last one in the game.
     */
    const leaveGame = async () => {
        playClickSound();
        try {
            const response = await fetch(`${BASE_URL}leave-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.message === 'one') {
                    navigate('/lobbys');
                } else {
                    navigate('/');
                }
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error leaving game:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    /**
     * Handles retrying the current phase or starting a new game.
     *
     * If the game has not ended, it attempts to retry the current phase.
     * If the game has ended, it triggers a request to start a new game.
     * Uses HTTP-only cookies for authentication.
     */
    const retryPhase = async () => {
        playClickSound();
        try {
            if (!endGame) {
                const cards = await fetch(`${BASE_URL}flip-phase`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ gameId }),
                });

                if (cards.ok) {
                    const retry = await fetch(`${BASE_URL}retry-phase`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ gameId }),
                    });

                    if (!retry.ok) {
                        throw new Error(`Failed to retry phase`);
                    }
                }
            } else {
                const response = await fetch(`${BASE_URL}open-new-game`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ gameId }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to end game`);
                }
            }
        } catch (error) {
            console.error('Error processing retry or new game request:', error);
        }
    };

    /**
     * Sends a request to validate a selected card based on the game round.
     *
     * If the game is in Round 1, the function checks whether the last played card needs to be updated.
     * If a last card exists, it sends a request to validate the play based on the last selection.
     * For other rounds, it directly sends a validation request.
     * Uses HTTP-only cookies for authentication.
     * @param {number} cardIdx - The index of the selected card.
     * @param {string} btnType - The type of button clicked (e.g., "higher", "lower", "same").
     */
    const checkCard = async (cardIdx, btnType) => {
        playClickSound();
        try {
            const endpoint =
                roundRef.current === 1 ? 'check-last-card' : 'check-card';
            let bodyData = { gameId, cardIdx, btnType };

            if (roundRef.current === 1) {
                if (!isLast) {
                    setIsLast(true);
                    lastCardRef.current = btnType;
                    return;
                }

                bodyData.lastBtn = lastCardRef.current;
            }

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(bodyData),
            });
        } catch (error) {
            console.error('Error checking card selection:', error);
        }
    };

    return (
        <div className="overlay-cont">
            {/* Overlay background image for Phase 3 */}
            <img
                src="/overlay_phase.svg"
                alt="Overlay-Diamond"
                className="overlay-diamond-img"
            />

            {/* Player avatars container */}
            <div className="player-avatars">
                {players.map((player) => (
                    <div key={player.id} className={`avatar-container}`}>
                        <img
                            src={`${BASE_URL}avatars/${player.avatar}`}
                            alt={player.name}
                            className="avatar-image"
                        />
                    </div>
                ))}
            </div>

            {/* Main Phase 3 container */}
            <div className="phase3-menu">
                {/* Display Busfahrer name */}
                <div className="busfahrer-cont">
                    <h2 className="busfahrer-title">
                        Busfahrer:{' '}
                        <span className="busfahrer-name">{busfahrerName}</span>
                    </h2>
                </div>

                {/* Render the diamond-shaped card layout */}
                <div className="phase3-cards">
                    {gameCards.map((row, rowIdx) => (
                        <div key={rowIdx} className="phase3-row">
                            {row.map((card, colIdx) => {
                                const cardIdx = getCardIdx(rowIdx, colIdx);
                                return (
                                    <div
                                        key={cardIdx}
                                        className={`card ${card.flipped ? 'flipped' : ''} ${cardIdx}`}
                                        onMouseEnter={() =>
                                            setHoverCard(cardIdx)
                                        }
                                        onMouseLeave={() => setHoverCard(null)}
                                    >
                                        {/* Front of the card */}
                                        <img
                                            className="front"
                                            src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`}
                                            alt="Card Front"
                                        />
                                        {/* Back of the card */}
                                        <img
                                            className="back"
                                            style={{
                                                backgroundImage:
                                                    GetCardThemeURL({
                                                        color1,
                                                        color2,
                                                        id: selectedTheme,
                                                    }),
                                            }}
                                        />

                                        {/* Display action buttons when hovering over a card */}
                                        {hoverCard === cardIdx &&
                                            !card.flipped &&
                                            roundRef.current === rowIdx + 1 && (
                                                <div className="card-buttons">
                                                    {/* Show equal/unequal buttons in the final round or if a last card exists */}
                                                    {roundRef.current === 9 ||
                                                    isLast ? (
                                                        <>
                                                            <button
                                                                className="card-btn"
                                                                onClick={() =>
                                                                    checkCard(
                                                                        cardIdx,
                                                                        'equal',
                                                                    )
                                                                }
                                                            >
                                                                =
                                                            </button>
                                                            <button
                                                                className="card-btn"
                                                                onClick={() =>
                                                                    checkCard(
                                                                        cardIdx,
                                                                        'unequal',
                                                                    )
                                                                }
                                                            >
                                                                ≠
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="card-btn higher"
                                                                onClick={() =>
                                                                    checkCard(
                                                                        cardIdx,
                                                                        'higher',
                                                                    )
                                                                }
                                                            >
                                                                &lt;
                                                            </button>
                                                            <button
                                                                className="card-btn"
                                                                onClick={() =>
                                                                    checkCard(
                                                                        cardIdx,
                                                                        'same',
                                                                    )
                                                                }
                                                            >
                                                                =
                                                            </button>
                                                            <button
                                                                className="card-btn lower"
                                                                onClick={() =>
                                                                    checkCard(
                                                                        cardIdx,
                                                                        'lower',
                                                                    )
                                                                }
                                                            >
                                                                &gt;
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Display game result or drinking requirement */}
                {(roundRef.current === -1 || roundRef.current === 0) && (
                    <p className="turn-info-phase3">
                        {endGame ? (
                            <>
                                <span className="current-player">
                                    {busfahrerName}{' '}
                                </span>{' '}
                                {busfahrerName.includes('&') ? 'haben' : 'hat'}{' '}
                                das Spiel
                                <span className="drink-count"> überlebt </span>
                            </>
                        ) : (
                            <>
                                <span className="current-player">
                                    {busfahrerName}{' '}
                                </span>{' '}
                                {busfahrerName.includes('&')
                                    ? 'müssen'
                                    : 'muss'}
                                <span className="drink-count">
                                    {' '}
                                    {drinkCount}{' '}
                                </span>{' '}
                                Schlucke trinken
                            </>
                        )}
                    </p>
                )}

                {/* Back button to leave the game */}
                <div className="back-cont">
                    <button className="btn-back" onClick={leaveGame}>
                        <img
                            src="/back.svg"
                            alt="Back Button"
                            className="back-icon"
                        />
                    </button>
                </div>

                {/* Retry or Start New Game button */}
                <div className="try-cont">
                    <button
                        className={
                            !endGame
                                ? 'btn-try'
                                : gameMasterRef.current
                                  ? 'btn-try'
                                  : 'btn-try-disabled'
                        }
                        disabled={
                            !endGame
                                ? false
                                : gameMasterRef.current
                                  ? false
                                  : true
                        }
                        onClick={retryPhase}
                    >
                        <img
                            src={
                                !endGame
                                    ? '/retry.svg'
                                    : gameMasterRef.current
                                      ? '/new.svg'
                                      : '/retry_disabled.svg'
                            }
                            alt="Try Button"
                            className="try-icon"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Phase3;
