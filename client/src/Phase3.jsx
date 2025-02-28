import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import BASE_URL from "./config";

function Phase3() {
    const [gameCards, setGameCards] = useState([]);
    const [busfahrerName, setBusfahrerName] = useState("");
    const [drinkCount, setDrinkCount] = useState(0);
    const [endGame, setEndGame] = useState(false);
    const [hoverCard, setHoverCard] = useState(null);
    const [ws, setWs] = useState(null);
    const {gameId} = useParams();
    const navigate = useNavigate();
    const playerIdRef = useRef(null);
    const gameMasterRef = useRef(null);
    const busfahrerIdRef = useRef(null);
    const roundRef = useRef(null);
    const lastCardRef = useRef(null);

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
                getDrinkCount();
                getBusfahrer();
                getRound();
                checkEndGame();
                checkLastCard();
            }

            if(message.type === "close") {
                if(message.userId !== playerIdRef.current) {
                  alert("Game has been closed")
                  navigate("/lobbys");
                }
            }

            if(message.type === "newGame") {
                alert("A new game was opend");
                navigate(`/game/${message.newId}`);
            }
        };

        setWs(newWs);

        const fetchCards = async () => {
            const token = sessionStorage.getItem("token");

            const gameRes = await fetch(`${BASE_URL}get-game-cards?gameId=${gameId}`);
            const gCards = await gameRes.json();

            const phaseRows = [];
            let idx = 0;
            const maxRows = 5;

            phaseRows.push(gCards.slice(idx, idx + 2));
            idx += 2;

            for(let row=2; row <= maxRows; row++) {
                phaseRows.push(gCards.slice(idx, idx + row));
                idx += row;
            }

            for(let row=maxRows-1; row >= 2; row--) {
                phaseRows.push(gCards.slice(idx, idx+row));
                idx += row;
            }

            phaseRows.push(gCards.slice(idx, idx + 2));
            idx += 2;
            
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

        const getRound = async () => {
            const respone = await fetch(`${BASE_URL}get-round?gameId=${gameId}`);
            const round = await respone.json();

            roundRef.current = round;
        };
        getRound();

        const checkEndGame = async () => {
            const respone = await fetch(`${BASE_URL}get-end-game?gameId=${gameId}`);
            const end = await respone.json();

            setEndGame(end);
        };
        checkEndGame();

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

    const retryPhase = async () => {
        const token = sessionStorage.getItem("token");

        if(!endGame) {
            const respone = await fetch(`${BASE_URL}retry-phase`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({gameId})
            });
        } else {
            const respone = await fetch(`${BASE_URL}open-new-game`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({gameId})
            });
        }
    };

    const checkCard = async (cardIdx, btnType) => {
        const token = sessionStorage.getItem("token");

        if(roundRef.current === 1) {
            if(!checkLastCard()) {
                lastCardRef.current = btnType;
            } else {
                const lastBtn = lastCardRef.current;
                const respone = await fetch(`${BASE_URL}check-last-card`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({gameId, cardIdx, btnType, lastBtn})
                });
            }
        } else {
            const respone = await fetch(`${BASE_URL}check-card`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({gameId, cardIdx, btnType})
            });
        }
    };

    const getCardIdx = (rowIdx, colIdx) => {
        const rowSizes = [2, 2, 3, 4, 5, 4, 3, 2, 2];

        let totalCardsBefore = 0;
        for (let i = 0; i < rowIdx; i++) {
            totalCardsBefore += rowSizes[i];
        }

        return totalCardsBefore + colIdx;
    };

    const checkLastCard = () => {
        return (lastCardRef.current === "higher" || lastCardRef.current === "lower" || lastCardRef.current === "same");
    };

    return (
        <div className="overlay-cont">
            <img src="/overlay_phase.svg" alt="Overlay-Diamond" className="overlay-diamond-img"/>
            <div className="phase3-menu">
                <div className="busfahrer-cont">
                    <h2 className="busfahrer-title">Busfahrer: <span className="busfahrer-name">{busfahrerName}</span></h2>
                </div>
                <div className="phase3-cards">
                    {gameCards.map((row, rowIdx) => (
                        <div key={rowIdx} className="phase3-row">
                            {row.map((card, colIdx) => {
                                const cardIdx = getCardIdx(rowIdx, colIdx);
                                return (
                                    <div key={cardIdx} className={`card ${card.flipped ? "flipped" : ""} ${cardIdx}`} onMouseEnter={() => setHoverCard(cardIdx)} onMouseLeave={() => setHoverCard(null)}>
                                        <img className="front" src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`} alt="Card Front"/>
                                        <img className="back"/>
                                        {(hoverCard === cardIdx && !card.flipped && roundRef.current === rowIdx+1) && (
                                            <div className="card-buttons">
                                                {roundRef.current === 9 || checkLastCard() ? (
                                                    <>
                                                        <button className="card-btn" onClick={() => checkCard(cardIdx, "equal")}>=</button>
                                                        <button className="card-btn" onClick={() => checkCard(cardIdx, "unequal")}>≠</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="card-btn higher"onClick={() => checkCard(cardIdx, "higher")}>&lt;</button>
                                                        <button className="card-btn"onClick={() => checkCard(cardIdx, "same")}>=</button>
                                                        <button className="card-btn lower"onClick={() => checkCard(cardIdx, "lower")}>&gt;</button>
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
                {(roundRef.current === -1 || roundRef.current === 0) && (
                <p className="turn-info-phase3">
                    {endGame ? (
                        <>
                            <span className="current-player">{busfahrerName} </span> {busfahrerName.includes("&") ? "haben" : "hat"} das Spiel
                            <span className="drink-count"> überlebt </span>
                        </>
                    ) : (
                        <>
                            <span className="current-player">{busfahrerName} </span> {busfahrerName.includes("&") ? "müssen" : "muss"}
                            <span className="drink-count"> {drinkCount} </span> Schlucke trinken
                        </>
                    )}
                </p>
                )}
                <div className="back-cont">
                    <button className="btn-back" onClick={leaveGame}>
                        <img src="/back.svg" alt="Back Button" className="back-icon"/>
                    </button>
                </div>
                <div className="try-cont">
                    <button className={!endGame ? "btn-try" : (gameMasterRef.current ? "btn-try" : "btn-try-disabled")} disabled={!endGame ? false : (gameMasterRef.current ? false : true)} onClick={retryPhase}>
                        <img src={!endGame ? "/retry.svg" : (gameMasterRef.current ? "/new.svg" : "/retry_disabled.svg")} alt="Try Button" className="try-icon"/>
                    </button>
                </div>
            </div>
        </div>
    );
}
  
export default Phase3;