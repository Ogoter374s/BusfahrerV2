import BASE_URL, { WBS_URL } from "./config";


import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"

function Phase2() {
    const { gameId } = useParams();

    const [playerCards, setPlayerCards] = useState([]);
    const [gameCards, setGameCards] = useState([]);
    const [currentName, setCurrentName] = useState("");
    const [busfahrerName, setBusfahrerName] = useState("");
    const [drinkCount, setDrinkCount] = useState(0);
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);
    const [isNextPhase, setIsNextPhase] = useState(false);
    const [allCardsPlayed, setAllCardsPlayed] = useState(false);
    const [hasToEx, setHasToEx] = useState(false);
    const [ws, setWs] = useState(null);

    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);
    const busfahrerIdRef = useRef(null);
    const roundRef = useRef(null);

    /**
     * Sets up a WebSocket connection to receive real-time game updates.
     *
     * Establishes a WebSocket connection to listen for updates related to the game state,
     * including player actions, card updates, and phase transitions. It also fetches
     * necessary game data on mount and updates the state accordingly.
     *
     * Cleans up by closing the WebSocket connection when the component unmounts.
     */
    useEffect(() => {
        const newWs = new WebSocket(WBS_URL);

        newWs.onopen = () => {
            newWs.send(JSON.stringify({ type: "subscribe", gameId }));
        };

        newWs.onmessage = async (event) => {
            await fetchPlayerId();

            const message = JSON.parse(event.data);

            if (message.type == "playersUpdate") {
                fetchPlayerCards();
                getHasToEx();
                getDrinkCount();
            }

            if (message.type === "cardsUpdate") {
                fetchGameCards();
            }

            if (message.type === "drinkUpdate") {
                getDrinkCount();
            }

            if (message.type === "gameUpdate") {
                getCurrentPlayer();
                getIsNextPhase();
                getBusfahrer();
                getAllCardsPlayed();
            }

            if (message.type === "close") {
                if (message.userId !== playerIdRef.current) {
                    alert("Game has been closed")
                    navigate("/lobbys");
                }
            }

            if (message.type === "phase3") {
                navigate(`/phase3/${gameId}`);
            }
        };

        setWs(newWs);

        /**
         * Fetches the player's card data from the backend.
         *
         * Retrieves the player's current hand from the game state.
         * Uses HttpOnly cookie authentication.
         */
        const fetchPlayerCards = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-player-cards?gameId=${gameId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                const pCards = await response.json();
                setPlayerCards(pCards);
            }
            catch (error) {
                console.error("Error fetching player cards:", error);
            }
        };
        fetchPlayerCards();

        /**
        * Fetches the game's phase card data.
        *
        * Retrieves the phase-specific game cards from the backend.
        */
        const fetchGameCards = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-phase-cards?gameId=${gameId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                const gCards = await response.json();

                const phaseRows = [];
                for (let row = 0; row < 3; row++) {
                    phaseRows.push(gCards?.[row]?.cards || []);
                }

                setGameCards(phaseRows);
            }
            catch (error) {
                console.error("Error fetching game cards:", error);
            }
        };
        fetchGameCards();

        /**
         * Determines if the game should transition to the next phase.
         *
         * Retrieves the current round number and checks if it has reached 6.
         */
        const getIsNextPhase = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-round?gameId=${gameId}`, {
                    credentials: "include",
                });

                const round = await response.json();
                roundRef.current = round;
                setIsNextPhase(round === 4);
            } catch (error) {
                console.error("Error fetching round data:", error);
            }
        };
        getIsNextPhase();

        /**
         * Fetches the current active player in the game.
         *
         * Uses HttpOnly authentication and updates the state with the current player details.
         */
        const getCurrentPlayer = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-current-player?gameId=${gameId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                const player = await response.json();
                const isPlayer = player.playerId === playerIdRef.current;

                setCurrentName(player.playerName);
                setIsCurrentPlayer(isPlayer);
            } catch (error) {
                console.error("Error fetching current player:", error);
            }
        };
        getCurrentPlayer();

        /**
         * Fetches the total drink count in the game.
         *
         * Retrieves the drink count from the backend and updates state.
         */
        const getDrinkCount = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-drink-count?gameId=${gameId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                const drinks = await response.json();
                setDrinkCount(drinks);
            } catch (error) {
                console.error("Error fetching drink count:", error);
            }
        };
        getDrinkCount();

        /**
         * Fetches all played cards in the game.
         *
         * Retrieves the list of all cards that have been played and updates state.
         * Uses HTTP-only cookies for authentication.
         */
        const getAllCardsPlayed = async () => {
            try {
                const response = await fetch(`${BASE_URL}all-cards-played?gameId=${gameId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch played cards data");
                }

                const allPlayed = await response.json();
                setAllCardsPlayed(allPlayed);
            }
            catch (error) {
                console.error("Error fetching played cards:", error);
            }
        };
        getAllCardsPlayed();

        /**
         * Fetches the list of players who must drink.
         *
         * Retrieves the data from the backend that determines which players must drink.
         * Uses HTTP-only cookies for authentication.
         */
        const getHasToEx = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-has-to-ex?gameId=${gameId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch has-to-ex data");
                }

                const exen = await response.json();
                setHasToEx(exen);
            }
            catch (error) {
                console.error("Error fetching has-to-ex data:", error);
            }
        };
        getHasToEx();

        /**
         * Fetches the Busfahrer details.
         *
         * Retrieves the busfahrer ID and name from the backend and updates state.
         * Uses HTTP-only cookies for authentication.
         */
        const getBusfahrer = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-busfahrer?gameId=${gameId}`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch busfahrer details");
                }

                const busfahrer = await response.json();
                busfahrerIdRef.current = busfahrer.playerIds;
                setBusfahrerName(busfahrer.busfahrerName);
            }
            catch (error) {
                console.error("Error fetching busfahrer:", error);
            }
        };
        getBusfahrer();

        /**
         * Fetches the player's unique identifier from the backend.
         *
         * Sends a GET request using HttpOnly cookie authentication.
         * Stores the fetched player ID in a React ref for comparison during events.
         */
        const fetchPlayerId = async () => {
            try {
                const response = await fetch(`${BASE_URL}get-player-id`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                const id = await response.json();

                playerIdRef.current = id;
            }
            catch (error) {
                console.error("Error fetching player ID:", error);
            }
        };
        fetchPlayerId();

        /**
         * Checks if the current player is the game master.
         *
         * Uses HttpOnly cookie authentication and updates the game master state.
         */
        const checkGameMaster = async () => {
            try {
                const response = await fetch(`${BASE_URL}is-game-master?gameId=${gameId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                const isMaster = await response.json();
                gameMasterRef.current = isMaster;
            } catch (error) {
                console.error("Error checking game master status:", error);
            }
        };
        checkGameMaster();

        return () => newWs.close();
    }, [gameId]);

    /**
     * Allows a player to leave the game.
     *
     * Sends a POST request to remove the player from the game.
     * Navigates to the correct screen based on whether the player was the last one in the game.
     */
    const leaveGame = async () => {
        try {
            const response = await fetch(`${BASE_URL}leave-game`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ gameId })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.message === "one") {
                    navigate("/lobbys");
                } else {
                    navigate("/");
                }
            } else {
                alert(data.error);
            }
        }
        catch(error) {
            console.error("Error leaving game:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    /**
     * Handles laying down a card in the game.
     *
     * Sends a request to the backend to lay a card during the current game phase.
     * Ensures only the current player can play, except in round 2 where all can play.
     * Uses HTTP-only cookies for authentication.
     *
     * @param {number} cardIdx - The index of the card in the player's hand.
     */
    const handleLayCard = async (cardIdx) => {
        if (roundRef.current !== 2 && !isCurrentPlayer) {
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}lay-card-phase`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ gameId, cardIdx }),
            });

            if (!res.ok) {
                throw new Error(`Failed to lay card: ${res.statusText}`);
            }
        }
        catch (error) {
            console.error("Error laying card:", error);
        }
    };

    /**
     * Handles advancing to the next player or starting Phase 3.
     *
     * Sends a request to the backend to either move to the next player in the current phase
     * or transition to Phase 3 if the game has reached that stage.
     * Uses HTTP-only cookies for authentication.
     */
    const handleNextPlayer = async () => {
        try {
            if (!isNextPhase) {
                await fetch(`${BASE_URL}next-player-phase`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ gameId }),
                });
            } else {
                const response = await fetch(`${BASE_URL}start-phase3`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ gameId }),
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error);
                }
            }
        }
        catch (error) {
            console.error("Error advancing to the next player:", error);
        }
    }

    return (
        <div className="overlay-cont">

            {/* Overlay image for Phase 2 */}
            <img src="/overlay_phase.svg" alt="Overlay-Pyramid" className="overlay-pyramid-img" />

            {/* Main Phase 2 container */}
            <div className="phase2-menu">

                {/* Busfahrer (Driver) section displaying player name and drinking rules */}
                <div className="busfahrer-cont">
                    <h2 className="busfahrer-title">
                        Busfahrer: <span className="busfahrer-name">{busfahrerName}</span>
                    </h2>
                    <p className="busfahrer-subtitle">Trinke für deine Übrigen Karten</p>
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
                    {gameCards.map((card, colIdx) => (
                        card[0] && card[0].type ? (
                            <div>
                                <div key={colIdx} className="card show">
                                    {/* Front image of the card */}
                                    <img 
                                        className="front" 
                                        src={`/cards/${card[0].number}${card[0].type[0].toUpperCase()}.svg`} 
                                        alt="Card Front" 
                                    />
                                    {/* Back of the card */}
                                    <img className="back" />
                                </div>
                            </div>
                        ) : null
                    ))}
                </div>

                {/* Display turn information based on the phase and round */}
                <p className="turn-info">
                    {isNextPhase ? (
                        <>
                            <span className="current-player">Phase 3 </span> kann
                            <span className="drink-count"> gestartet </span> werden!
                        </>
                    ) : roundRef.current === 3 ? (
                        <>
                            <span className="current-player"> {currentName} </span> muss das Glas
                            <span className="drink-count"> {hasToEx ? "exen" : "nicht exen"} </span>
                        </>
                    ) : (
                        <>
                            <span className="current-player"> {currentName} </span> muss
                            <span className="drink-count"> {drinkCount} </span> Schlucke trinken
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
                                <img className="back" />
                            </div>
                        ))
                    }
                </div>

                {/* Back button to leave the game */}
                <div className="back-cont">
                    <button className="btn-back" onClick={leaveGame}>
                        <img src="/back.svg" alt="Back Button" className="back-icon" />
                    </button>
                </div>

                {/* Next Player button (enabled only if conditions are met) */}
                <div className="next-cont">
                    <button 
                        className={(isCurrentPlayer && allCardsPlayed) ? "btn-next" : "btn-next-disabled"} 
                        disabled={!isCurrentPlayer ? true : !allCardsPlayed} 
                        onClick={handleNextPlayer}
                    >
                        <img 
                            src={(isNextPhase && isCurrentPlayer) ? "/next_phase.svg" : ((isCurrentPlayer && allCardsPlayed) ? "/next.svg" : "/next_disabled.svg")}
                            alt="Next Button" 
                            className="next-icon" 
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Phase2;