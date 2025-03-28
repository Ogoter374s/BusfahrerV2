import BASE_URL, { WBS_URL } from './config';
import ChatSidebar from './ChatSidebar';
import AvatarInfo from "./AvatarInfo";

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Phase2() {
    const [selectedSound, setSelectedSound] = useState('ui-click.mp3');
    const soundRef = useRef(new Audio(selectedSound));

    const { gameId } = useParams();

    const [playerCards, setPlayerCards] = useState([]);
    const [gameCards, setGameCards] = useState([]);
    const [currentName, setCurrentName] = useState('');
    const [busfahrerName, setBusfahrerName] = useState('');
    const [drinkCount, setDrinkCount] = useState(0);
    const [isNextPhase, setIsNextPhase] = useState(false);
    const [allCardsPlayed, setAllCardsPlayed] = useState(false);
    const [hasToEx, setHasToEx] = useState(false);
    const [currentRound, setCurrentRound] = useState(1);
    
    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);
    const busfahrerIdRef = useRef(null);
    const roundRef = useRef(null);
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

            const pCards = await response.json();
            setPlayerCards(pCards);
        } catch (error) {
            console.error('Error fetching player cards:', error);
        }
    };

    const fetchGameCards = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-phase-cards?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const gCards = await response.json();

            const phaseRows = [];
            for (let row = 0; row < 3; row++) {
                phaseRows.push(gCards?.[row]?.cards || []);
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
            roundRef.current = round;

            setCurrentRound(round);
            setIsNextPhase(round === 4);
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

    const getAllCardsPlayed = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}all-cards-played?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch played cards data');
            }

            const allPlayed = await response.json();
            setAllCardsPlayed(allPlayed);
        } catch (error) {
            console.error('Error fetching played cards:', error);
        }
    };

    const getHasToEx = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-has-to-ex?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch has-to-ex data');
            }

            const exen = await response.json();
            setHasToEx(exen);
        } catch (error) {
            console.error('Error fetching has-to-ex data:', error);
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

                if (message.type == 'playersUpdate') {
                    if (roundRef.current === 2) fetchPlayerCards();
                    else {
                        if (isCurrentPlayer.current) fetchPlayerCards();
                    }

                    getHasToEx();
                    getDrinkCount();
                }

                if (message.type === 'cardsUpdate') {
                    setGameCards(message.data.phaseCards);
                }

                if (message.type === 'drinkUpdate') {
                    getDrinkCount();
                }

                if (message.type === 'gameUpdate') {
                    getIsNextPhase();

                    busfahrerIdRef.current = message.data.busfahrerIds;

                    setBusfahrerName(message.data.busfahrerName);

                    getHasToEx();

                    getAllCardsPlayed();
                    getCurrentPlayer();
                }

                if (message.type === 'close') {
                    if (message.userId !== playerIdRef.current) {
                        alert('Game has been closed');
                        navigate('/lobbys');
                    }
                }

                if (message.type === 'phase3') {
                    navigate(`/phase3/${gameId}`);
                }
            };
        }

        fetchPlayerCards();
        fetchGameCards();
        getIsNextPhase();
        getCurrentPlayer();
        getDrinkCount();
        getAllCardsPlayed();
        getHasToEx();
        getBusfahrer();
        checkGameMaster();
        fetchPlayerId();

        fetchSoundPreference();

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

    const handleLayCard = async (cardIdx) => {
        if (roundRef.current !== 2 && !isCurrentPlayer.current) {
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}lay-card-phase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ gameId, cardIdx }),
            });

            if (res.ok) {
                playClickSound();
            } else {
                throw new Error(`Failed to lay card: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Error laying card:', error);
        }
    };

    const handleNextPlayer = async () => {
        playClickSound();
        try {
            if (!isNextPhase) {
                await fetch(`${BASE_URL}next-player-phase`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ gameId }),
                });
            } else {
                const response = await fetch(`${BASE_URL}start-phase3`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ gameId }),
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error);
                }
            }
        } catch (error) {
            console.error('Error advancing to the next player:', error);
        }
    };

    return (
        <div className="overlay-cont">
            {/* Overlay image for Phase 2 */}
            <img
                src="/overlay_phase.svg"
                alt="Overlay-Pyramid"
                className="overlay-pyramid-img"
            />

            {/* Player avatars container */}
            <AvatarInfo gameId={gameId}/>

            {/* Main Phase 2 container */}
            <div className="phase2-menu">
                {/* Busfahrer (Driver) section displaying player name and drinking rules */}
                <div className="busfahrer-cont">
                    <h2 className="busfahrer-title">
                        Busfahrer:{' '}
                        <span className="busfahrer-name">{busfahrerName}</span>
                    </h2>
                    <p className="busfahrer-subtitle">
                        Trinke für deine Übrigen Karten
                    </p>
                    <ul className="busfahrer-rules">
                        <li>Pro 2-10: Trinke 2-10 Schluck</li>
                        <li>Pro J: Alle Burschen trinken einen Schluck</li>
                        <li>Pro Q: Alle Damen trinken einen Schluck</li>
                        <li>Pro K: Alle trinken einen Schluck</li>
                        <li>Pro A: Ex dein Glas</li>
                    </ul>
                </div>

                {/* Displaying game cards */}
                <div className="phase2-cards">
                    {gameCards.map((card, colIdx) =>
                        card[0] && card[0].type ? (
                            <div
                                key={colIdx}
                                className="card show"
                            >
                                {/* Front image of the card */}
                                <img
                                    className="front"
                                    src={`/cards/${card[0].number}${card[0].type[0].toUpperCase()}.svg`}
                                    alt="Card Front"
                                />
                                {/* Back of the card */}
                                <img className="back" draggable={false} />
                            </div>
                        ) : null,
                    )}
                </div>

                {/* Display turn information based on the phase and round */}
                <p className="turn-info-phase2">
                    {isNextPhase ? (
                        <>
                            <span className="current-player">Phase 3 </span>{' '}
                            kann
                            <span className="drink-count">
                                {' '}
                                gestartet{' '}
                            </span>{' '}
                            werden!
                        </>
                    ) : currentRound === 3 ? (
                        <>
                            <span className="current-player">
                                {' '}
                                {currentName}{' '}
                            </span>{' '}
                            muss das Glas
                            <span className="drink-count">
                                {' '}
                                {hasToEx ? 'exen' : 'nicht exen'}{' '}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="current-player">
                                {' '}
                                {currentName}{' '}
                            </span>{' '}
                            muss
                            <span className="drink-count">
                                {' '}
                                {drinkCount}{' '}
                            </span>{' '}
                            Schlucke trinken
                        </>
                    )}
                </p>

                {/* Display player's cards that have not been played yet */}
                <div className="player-cards">
                    {playerCards
                        .map((card, originalIndex) => ({ card, originalIndex }))
                        .filter(({ card }) => !card.played)
                        .map(({ card, originalIndex }) => (
                            <div
                                key={`${card.number}-${card.type}-${originalIndex}`}
                                className="card show"
                                onClick={() => handleLayCard(originalIndex)}
                            >
                                {/* Front image of the player's card */}
                                <img
                                    className="front"
                                    src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`}
                                    alt="Card Front"
                                />
                                {/* Back of the card */}
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
                        isCurrentPlayer.current && allCardsPlayed
                            ? 'btn-next'
                            : 'btn-next-disabled'
                    }
                    disabled={
                        !isCurrentPlayer.current ? true : !allCardsPlayed
                    }
                    onClick={handleNextPlayer}
                >
                    <img
                        src={
                            isNextPhase && isCurrentPlayer.current
                                ? '/next_phase.svg'
                                : isCurrentPlayer.current && allCardsPlayed
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

export default Phase2;
