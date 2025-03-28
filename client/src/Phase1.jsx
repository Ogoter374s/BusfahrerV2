import BASE_URL, { WBS_URL } from './config';
import { GetCardThemeURL } from './CardThemes';
import ChatSidebar from './ChatSidebar';
import AvatarInfo from "./AvatarInfo";

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Phase1() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const [selectedTheme, setSelectedTheme] = useState('default');
    const [color1, setColor1] = useState('#ffffff');
    const [color2, setColor2] = useState('#ff4538');

    const { gameId } = useParams();

    const [playerCards, setPlayerCards] = useState([]);
    const [gameCards, setGameCards] = useState([]);
    const [currentName, setCurrentName] = useState('');
    const [drinkCount, setDrinkCount] = useState(0);
    const [isNextPhase, setIsNextPhase] = useState(false);
    const [isRowFlipped, setIsRowFlipped] = useState(false);
    const [drinksGiven, setDrinksGiven] = useState(false);
    const [drinksReceived, setDrinksReceived] = useState(0);

    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);
    const isCurrentPlayer = useRef(false);
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

    const fetchPlayerCards = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-player-cards?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch player cards');
            }

            const pCards = await response.json();
            setPlayerCards(pCards);
        } catch (error) {
            console.error('Error fetching player cards:', error);
        }
    };

    const fetchGameCards = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-game-cards?gameId=${gameId}`,
                {
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch game cards');
            }

            const gCards = await response.json();

            const phaseRows = [];
            let idx = 0;
            for (let row = 1; row <= 5; row++) {
                phaseRows.push(gCards.slice(idx, idx + row));
                idx += row;
            }

            setGameCards(phaseRows);
        } catch (error) {
            console.error('Error fetching game cards:', error);
        }
    };

    const getIsNextPhase = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-round?gameId=${gameId}`,
                {
                    credentials: 'include',
                },
            );

            const round = await response.json();
            setIsNextPhase(round === 6);
        } catch (error) {
            console.error('Error fetching round data:', error);
        }
    };

    const getCurrentPlayer = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-current-player?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const player = await response.json();
            const isPlayer = player.playerId === playerIdRef.current;

            setCurrentName(player.playerName);
            isCurrentPlayer.current = isPlayer;
        } catch (error) {
            console.error('Error fetching current player:', error);
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

    const getIsRowFlipped = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-is-row-flipped?gameId=${gameId}`,
                {
                    credentials: 'include',
                },
            );

            const flipped = await response.json();

            setIsRowFlipped(flipped);
        } catch (error) {
            console.error('Error fetching row flip status:', error);
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

    const fetchDrinksReceived = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-drinks-received?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const drinks = await response.json();
            setDrinksReceived(drinks);
        } catch (error) {
            console.error('Error fetching drinks received:', error);
        }
    }

    const fetchDrinksGiven = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}drinks-given?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const given = await response.json();
            setDrinksGiven(given);
        } catch (error) {
            console.error('Error fetching drinks given status:', error);
        }
    };

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

                if (message.type === 'playersUpdate') {
                    if (isCurrentPlayer.current) {
                        fetchPlayerCards();
                        fetchDrinksGiven();
                        fetchDrinksReceived();
                    }
                }

                if (message.type === 'drinkUpdate') {
                    setDrinkCount(message.data.drinks);
                }

                if (message.type === 'cardsUpdate') {
                    fetchGameCards();
                }

                if (message.type === 'gameUpdate') {
                    setIsNextPhase(message.data.round === 6);
                    setIsRowFlipped(message.data.flipped);
                    fetchDrinksReceived();

                    getCurrentPlayer();
                }

                if (message.type === 'close') {
                    if (message.userId !== playerIdRef.current) {
                        alert('Game has been closed');
                        navigate('/lobbys');
                    }
                }

                if (message.type === 'phase2') {
                    navigate(`/phase2/${gameId}`);
                }
            };
        }

        fetchPlayerCards();
        fetchPlayerId();
        fetchGameCards();
        getIsNextPhase();
        getIsRowFlipped();
        getCurrentPlayer();
        getDrinkCount();
        checkGameMaster();
        fetchDrinksGiven();
        fetchDrinksReceived();

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

    const handleRowClick = async (rowIdx) => {
        if (!gameMasterRef.current) return;

        try {
            const response = await fetch(`${BASE_URL}flip-row`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, rowIdx }),
            });

            if (response.ok) {
                playClickSound();
            } else {
                throw new Error('Failed to flip row');
            }
        } catch (error) {
            console.error('Error flipping row:', error);
        }
    };

    const handleLayCard = async (cardIdx) => {
        if (!isCurrentPlayer.current) return;

        try {
            const response = await fetch(`${BASE_URL}lay-card`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, cardIdx }),
            });

            if (response.ok) {
                playClickSound();
            } else {
                throw new Error('Failed to lay card');
            }
        } catch (error) {
            console.error('Error laying card:', error);
        }
    };

    const handleNextPlayer = async () => {
        playClickSound();
        try {
            const endpoint = isNextPhase ? 'start-phase2' : 'next-player';

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error advancing to next player:', error);
        }
    };

    return (
        <div className="overlay-cont">
            {/* Overlay image for the pyramid phase */}
            <img
                src="/overlay_phase.svg"
                alt="Overlay-Pyramid"
                className="overlay-pyramid-img"
            />

            {/* Player avatars container */}
            <AvatarInfo gameId={gameId}/>

            {/* Main Phase 1 container */}
            <div className="phase1-menu">
                {/* Card pyramid displaying all game cards */}
                <div className="phase1-cards">
                    {gameCards.map((row, rowIdx) => (
                        <div key={rowIdx} className="phase-row">
                            {row.map((card, colIdx) => {
                                // Calculate the unique index for each card based on its position in the pyramid
                                const cardIdx =
                                    (rowIdx * (rowIdx + 1)) / 2 + colIdx;
                                return (
                                    <div
                                        key={cardIdx}
                                        className={`card ${card.flipped ? 'flipped' : ''}`}
                                        onClick={() =>
                                            handleRowClick(rowIdx + 1)
                                        }
                                    >
                                        {/* Display the card front and back images */}
                                        <img
                                            className="front"
                                            src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`}
                                            alt="Card Front"
                                        />
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
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Display turn information */}
                <p className="turn-info">
                    {isNextPhase ? (
                        <>
                            <span className="current-player">Phase 2 </span>{' '}
                            kann
                            <span className="drink-count">
                                {' '}
                                gestartet{' '}
                            </span>{' '}
                            werden!
                        </>
                    ) : (
                        <>
                            <span className="current-player">
                                {' '}
                                {currentName}{' '}
                            </span>{' '}
                            darf
                            <span className="drink-count">
                                {' '}
                                {drinkCount}
                            </span>{' '}
                            Schlucke verteilen
                        </>
                    )}
                </p>

                {/* Display the number of drinks given */}
                <div className="given-info">
                    {drinksReceived > 0 && (
                        <>
                            <span className="current-player">
                                Du
                            </span>{' '}
                            musst
                            <span className="drink-count">
                                {' '}
                                {drinksReceived}
                            </span>{' '}
                            Schlucke trinken
                        </>
                    )}
                </div>

                {/* Player's available cards for selection */}
                <div className="player-cards">
                    {playerCards
                        .map((card, originalIndex) => ({ card, originalIndex }))
                        .filter(({ card }) => !card.played)
                        .map(({ card, originalIndex }) => (
                            <div
                                key={originalIndex}
                                className="card show"
                                onClick={() => handleLayCard(originalIndex)}
                            >
                                <img
                                    className="front"
                                    src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`}
                                    alt="Card Front"
                                />
                                <img className="back" draggable={false} />
                            </div>
                        ))}
                </div>
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

            {/* Next Player button (enabled only if conditions are met) */}
            <div className="next-cont">
                <button
                    className={
                        isCurrentPlayer.current && isRowFlipped
                            ? 'btn-next'
                            : 'btn-next-disabled'
                    }
                    disabled={
                        !isCurrentPlayer.current ? true : !isRowFlipped
                    }
                    onClick={handleNextPlayer}
                >
                    <img
                        src={
                            isNextPhase && isCurrentPlayer.current
                                ? '/next_phase.svg'
                                : (isCurrentPlayer.current && isRowFlipped && drinksGiven)
                                  ? '/next.svg'
                                  : '/next_disabled.svg'
                        }
                        alt="Next Button"
                        className="next-icon"
                    />
                </button>
            </div>


            {/* Sidebar Toggle */}
            <ChatSidebar />
        </div>
    );
}

export default Phase1;
