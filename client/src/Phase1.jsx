import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import BASE_URL from "./config";

function Phase1() {
    const [playerCards, setPlayerCards] = useState([]);
    const [gameCards, setGameCards] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState("");
    const [currentName, setCurrentName] = useState("");
    const [drinkCount, setDrinkCount] = useState(0);
    const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);
    const [isNextPhase, setIsNextPhase] = useState(false);
    const [isRowFlipped, setIsRowFlipped]  = useState(false);
    const [ws, setWs] = useState(null);
    const {gameId} = useParams();
    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);

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
                getIsRowFlipped();
            }

            if(message.type === "close") {
                if(message.userId !== playerIdRef.current) {
                  alert("Game has been closed")
                  navigate("/lobbys");
                }
            }

            if(message.type === "phase2") {
                navigate(`/phase2/${gameId}`);
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
            const gameRes = await fetch(`${BASE_URL}get-game-cards?gameId=${gameId}`);
            
            const pCards = await playerRes.json();
            const gCards = await gameRes.json();

            const phaseRows = [];
            let idx = 0;
            for(let row=1; row <= 5; row++) {
                phaseRows.push(gCards.slice(idx, idx + row));
                idx += row;
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

            const nextRound = (round === 6);

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

        const getIsRowFlipped = async () => {
            const token = sessionStorage.getItem("token");
            const response = await fetch(`${BASE_URL}get-is-row-flipped?gameId=${gameId}`);
            const flipped = await response.json();
            setIsRowFlipped(flipped);
        };
        getIsRowFlipped();

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
    
    const handleRowClick = async (rowIdx) => {
        if(!gameMasterRef.current) return;
        
        const token = sessionStorage.getItem("token");

        const res = await fetch(`${BASE_URL}flip-row`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ gameId, rowIdx })
        });
    };

    const handleLayCard = async (cardIdx) => {
        if(!isCurrentPlayer) return;

        const token = sessionStorage.getItem("token");

        const res = await fetch(`${BASE_URL}lay-card`, {
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
            const response = await fetch(`${BASE_URL}next-player`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gameId }),
            });
        } else {
            const response = await fetch(`${BASE_URL}start-phase2`, {
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
    };

    return (
        <div className="overlay-cont">
            <img src="/overlay_phase.svg" alt="Overlay-Pyramid" className="overlay-pyramid-img"/>
            <div className="phase1-menu">
                <div className="phase1-cards">
                    {gameCards.map((row, rowIdx) => (
                        <div key={rowIdx} className="phase-row">
                            {row.map((card, colIdx) => {
                                const cardIdx = rowIdx * (rowIdx+1) / 2 + colIdx;
                                return (
                                    <div key={cardIdx} className={`card ${card.flipped ? "flipped" : ""}`} onClick={() => handleRowClick(rowIdx+1)}>
                                        <img className="front" src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`} alt="Card Front"/>
                                        <img className="back"/>
                                    </div>
                                ); 
                            })}
                        </div>
                    ))}
                </div>
                <p className="turn-info">
                    {isNextPhase ? (
                        <>
                            <span className="current-player">Phase 2 </span> kann 
                            <span className="drink-count"> gestartet </span> werden!
                        </>
                    ) : (
                        <>
                            <span className="current-player"> {currentName} </span> darf 
                            <span className="drink-count"> {drinkCount} </span> Schlucke verteilen
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
                    <button className={(isCurrentPlayer && isRowFlipped) ? "btn-next" : "btn-next-disabled"} disabled={!isCurrentPlayer ? true : !isRowFlipped} onClick={handleNextPlayer}>
                        <img src={(isNextPhase && isCurrentPlayer) ? "/next_phase.svg" : ((isCurrentPlayer && isRowFlipped) ?  "/next.svg" : "/next_disabled.svg")} alt="Next Button" className="next-icon"/>
                    </button>
                </div>
            </div>
        </div>
    );
}
  
export default Phase1;