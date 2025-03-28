import BASE_URL, { WBS_URL } from './config';
import { GetCardThemeURL } from './CardThemes';
import ChatSidebar from './ChatSidebar';
import AvatarInfo from "./AvatarInfo";

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
    const [isOwner, setIsOwner] = useState(false);

    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);
    const busfahrerIdRef = useRef(null);
    const roundRef = useRef(null);
    const lastCardRef = useRef(null);
    const wsRef = useRef(null);
    const init = useRef(false);

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

    const fetchIsOwner = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-owner?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const owner = await response.json();
            setIsOwner(owner);
        } catch (error) {
            console.error('Error fetching game owner status:', error);
        }
    }

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
                    fetchIsOwner();
                }

                if (message.type === 'drinkUpdate') {
                    getDrinkCount();
                }

                if (message.type === 'gameUpdate') {
                    roundRef.current = message.data.round;
                    busfahrerIdRef.current = message.data.busfahrerIds;

                    setBusfahrerName(message.data.busfahrerName);
                    setEndGame(message.data.endGame);
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
        fetchIsOwner();

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
    }, [gameId]);

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

    const checkCard = async (cardIdx, btnType) => {
        try {
            if(gameCards.flat()[cardIdx].flipped)
                return;

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

            if(response.ok)
                playClickSound();
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
            <AvatarInfo gameId={gameId}/>

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
                                            draggable={false}
                                        />

                                        {/* Display action buttons when hovering over a card */}
                                        {hoverCard === cardIdx && isOwner &&
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
            </div>

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
                        isOwner ? (!endGame ? 'btn-try' : (gameMasterRef.current ? 'btn-try' : 'btn-try-disabled')) : 'btn-try-disabled'
                    }
                    disabled={
                        isOwner ? (!endGame ? false : (gameMasterRef.current ? false : true)) : true
                    }
                    onClick={retryPhase}
                >
                    <img
                        src={
                            isOwner ? (!endGame ? '/retry.svg' : (gameMasterRef.current ? '/new.svg' : '/retry_disabled.svg')) : '/retry_disabled.svg'
                        }
                        alt="Try Button"
                        className="try-icon"
                    />
                </button>
            </div>

            {/* Sidebar Toggle */}
            <ChatSidebar />

        </div>
    );
}

export default Phase3;
