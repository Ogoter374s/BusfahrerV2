import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import BASE_URL from "./config";

function Phase2() {
    const [playerCards, setPlayerCards] = useState([]);
    const [gameCards, setGameCards] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState("");
    const [currentName, setCurrentName] = useState("");
    const [busfahrerName, setBusfahrerName] = useState("");
    const [drinkCount, setDrinkCount] = useState(0);
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);
    const [isNextPhase, setIsNextPhase] = useState(false);
    const [allCardsPlayed, setAllCardsPlayed] = useState(false);
    const [hasToEx, setHasToEx] = useState(false);
    const [ws, setWs] = useState(null);
    const {gameId} = useParams();
    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);
    const busfahrerIdRef = useRef(null);
    const roundRef = useRef(null);

    useEffect(() => {
        const newWs = new WebSocket("ws://localhost:8080");

        newWs.onopen = () => {
            newWs.send(JSON.stringify({type: "subscribe", gameId}));
        };

        newWs.onmessage = async (event) => {
            await fetchPlayerId();

            const message = JSON.parse(event.data);
            if(message.type === "gameUpdate") {
                fetchCards();
                getCurrentPlayer();
                getDrinkCount();
                getIsNextPhase();
                getBusfahrer();
                getAllCardsPlayed();
                getHasToEx();
            }

            if(message.type === "close") {
                if(message.userId !== playerIdRef.current) {
                  alert("Game has been closed")
                  navigate("/lobbys");
                }
            }

            if(message.type === "phase3") {
                navigate(`/phase3/${gameId}`);
            }
        };

        setWs(newWs);

        const fetchCards = async () => {
            const token = sessionStorage.getItem("token");

            const playerRes = await fetch(`${BASE_URL}get-player-cards?gameId=${gameId}`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                }
            });
            const gameRes = await fetch(`${BASE_URL}get-phase-cards?gameId=${gameId}`);
            
            const pCards = await playerRes.json();
            const gCards = await gameRes.json();

            const phaseRows = [];
            for(let row=0; row < 3; row++) {
                phaseRows.push(gCards?.[row]?.cards || []);
            }

            setPlayerCards(pCards);
            setGameCards(phaseRows);
        };
        fetchCards();

        const fetchPlayerId = async () => {
            const token = sessionStorage.getItem("token");
            const response = await fetch(`${BASE_URL}get-player-id`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            });
            const id = await response.json();
            playerIdRef.current = id;
        };

        const checkGameMaster = async () => {
            const token = sessionStorage.getItem("token");
            const respone = await fetch(`${BASE_URL}is-game-master?gameId=${gameId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            });
            const isMaster = await respone.json();
            gameMasterRef.current = isMaster;
        };
        checkGameMaster();

        const getIsNextPhase = async () => {
            const token = sessionStorage.getItem("token");
            const respone = await fetch(`${BASE_URL}get-round?gameId=${gameId}`);
            const round = await respone.json();

            roundRef.current = round;
            const nextRound = (round === 4);

            setIsNextPhase(nextRound);
        };
        getIsNextPhase();

        const getCurrentPlayer = async () => {
            const token = sessionStorage.getItem("token");

            const response = await fetch(`${BASE_URL}get-current-player?gameId=${gameId}`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                }
            });
            const player = await response.json();

            const isPlayer = player.playerId === playerIdRef.current;

            setCurrentPlayer(player.playerId);
            setCurrentName(player.playerName);
            setIsCurrentPlayer(isPlayer);
        };
        getCurrentPlayer();

        const getDrinkCount = async () => {
            const token = sessionStorage.getItem("token");

            const response = await fetch(`${BASE_URL}get-drink-count?gameId=${gameId}`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                }
            });
            const drinks = await response.json();
            setDrinkCount(drinks);
        };
        getDrinkCount();

        const getBusfahrer = async () => {
            const response = await fetch(`${BASE_URL}get-busfahrer?gameId=${gameId}`);
            const busfahrer = await response.json();
            busfahrerIdRef.current = busfahrer.playerIds;
            setBusfahrerName(busfahrer.busfahrerName);
        };
        getBusfahrer();

        const getAllCardsPlayed = async () => {
            const token = sessionStorage.getItem("token");
            const respone = await fetch(`${BASE_URL}all-cards-played?gameId=${gameId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            });
            const allPlayed = await respone.json();
            setAllCardsPlayed(allPlayed);
        };
        getAllCardsPlayed();

        const getHasToEx = async () => {
            const token = sessionStorage.getItem("token");
            const respone = await fetch(`${BASE_URL}get-has-to-ex?gameId=${gameId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            });
            const exen = await respone.json();
            setHasToEx(exen);
        };
        getHasToEx();

        return () => newWs.close();
    }, [gameId]);

    const leaveGame = async () => {
        const token = sessionStorage.getItem("token");
        
        const response = await fetch(`${BASE_URL}leave-game`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({gameId})
        });
    
        const data = await response.json();
        if(response.ok) {
          if(data.message === "one") {
            navigate("/lobbys");
          } else {
            navigate("/");
          }
        } else {
          alert(data.error);
        }
    };

    const handleLayCard = async (cardIdx) => {
        if(roundRef.current !== 2) {
            if(!isCurrentPlayer) return;
        }

        const token = sessionStorage.getItem("token");

        const res = await fetch(`${BASE_URL}lay-card-phase`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({gameId, cardIdx})
        });
    };

    const handleNextPlayer = async () => {
        const token = sessionStorage.getItem("token");

        if(!isNextPhase) {
            const response = await fetch(`${BASE_URL}next-player-phase`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gameId }),
            });
        } else {
            const response = await fetch(`${BASE_URL}start-phase3`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();
            if(!response.ok) {
                alert(data.error);
            }
        }
    }

    return (
        <div className="overlay-cont">
            <img src="/overlay_phase.svg" alt="Overlay-Pyramid" className="overlay-pyramid-img"/>
            <div className="phase2-menu">
                <div className="busfahrer-cont">
                    <h2 className="busfahrer-title">Busfahrer: <span className="busfahrer-name">{busfahrerName}</span></h2>
                    <p className="busfahrer-subtitle">Trinke für deine Übrigen Karten</p>
                    <ul className="busfahrer-rules">
                        <li>Pro 2-10: Trinke 2-10 Schluck</li>
                        <li>Pro J: Alle Burschen trinken einen Schluck</li>
                        <li>Pro Q: Alle Damen trinken einen Schluck</li>
                        <li>Pro K: Alle trinken einen Schluck</li>
                        <li>Pro A: Ex dein Glas</li>
                    </ul>
                </div>
                <div className="phase2-cards">
                    {gameCards.map((card, colIdx) => (
                        card[0] && card[0].type ? (
                        <div>
                            <div key={colIdx} className="card show">
                                <img className="front" src={`/cards/${card[0].number}${card[0].type[0].toUpperCase()}.svg`} alt="Card Front"/>
                                <img className="back"/>
                            </div>
                        </div>
                        ) : null
                    ))}
                </div>
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
                <div className="player-cards">
                {playerCards
                    .map((card, originalIndex) => ({ card, originalIndex }))
                    .filter(({ card }) => !card.played)
                    .map(({ card, originalIndex }) => (
                        <div key={originalIndex} className="card show" onClick={() => handleLayCard(originalIndex)}>
                            <img className="front" src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`} alt="Card Front"/>
                            <img className="back"/>
                        </div>
                    ))
                }
                </div>
                <div className="back-cont">
                    <button className="btn-back" onClick={leaveGame}>
                        <img src="/back.svg" alt="Back Button" className="back-icon"/>
                    </button>
                </div>
                <div className="next-cont">
                    <button className={(isCurrentPlayer && allCardsPlayed) ? "btn-next" : "btn-next-disabled"} disabled={!isCurrentPlayer ? true : !allCardsPlayed} onClick={handleNextPlayer}>
                        <img src={(isNextPhase && isCurrentPlayer) ? "/next_phase.svg" : ((isCurrentPlayer && allCardsPlayed) ? "/next.svg" : "/next_disabled.svg" )} alt="Next Button" className="next-icon"/>
                    </button>
                </div>
            </div>
        </div>
    );
}
  
export default Phase2;