import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import BASE_URL from "./config";

function Game() {
  const [players, setPlayers] = useState([]);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [ws, setWs] = useState(null);
  const {gameId} = useParams();
  const navigate = useNavigate();
  const playerIdRef = useRef(null);

  useEffect(()  => {
    const newWs = new WebSocket("ws://localhost:8080");

    newWs.onopen = () => {
      newWs.send(JSON.stringify({type: "subscribe", gameId}));
    };

    newWs.onmessage = async (event) => {
      await fetchPlayerId();
      const message = JSON.parse(event.data);
      if(message.type === "gameUpdate") {
        setPlayers(message.data.players);
      }

      if(message.type === "kicked") {
        if(message.id === playerIdRef.current) {
          alert("You have been removed from the game")
          navigate("/lobbys");
        }
      }

      if(message.type === "close") {
        if(message.userId !== playerIdRef.current) {
          alert("Game has been closed")
          navigate("/lobbys");
        }
      }

      if(message.type === "start") {
        navigate(`/phase1/${gameId}`);
      }
    };

    setWs(newWs);

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

    const fetchPlayers = async () => {
      const response = await fetch(`${BASE_URL}get-players/${gameId}`);
      const playersInGame = await response.json();
      setPlayers(playersInGame);
    };
    fetchPlayers();

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
      setIsGameMaster(isMaster);
    };
    checkGameMaster();

    return () => newWs.close();
  }, [gameId]);

  const kickPlayer = async (id) => {
    const token = sessionStorage.getItem("token");
    const response = await fetch(`${BASE_URL}kick-player`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({gameId, id})
    });

    const data = await response.json();
    if(response.ok) {
      setPlayers(players.filter(player => player.id !== id));
    } else {
      alert(data.error);
    }
  };

  const startGame = async () => {
    const token = sessionStorage.getItem("token");
    const respone = await fetch(`${BASE_URL}start-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({gameId})
    });

    const data = await respone.json();
    if(!respone.ok) {
      alert(data.error);
    }
  };

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

  return (
    <div className="overlay-cont">
      <img src="/overlay.svg" alt="Overlay" className="overlay-img"/>
      <div className="game-menu">
        <h1 className="game-title">
          Busfahrer
          <span className="highlight">
            Extreme
          </span>
        </h1>
        <div className="player-list">
          {players.map((player) => (
            <div key={player.id} className="player-item">
              <span>{player.name}</span>
              <button className={!isGameMaster ? "player-item-button-disabled" : "player-item-button"} disabled={!isGameMaster} onClick={() => kickPlayer(player.id)}/>
            </div>
          ))}
        </div>
        <div className="startGame-cont">
          <button className={!isGameMaster ? "btn-startGame-disabled" : "btn-startGame"} disabled={!isGameMaster} onClick={startGame}>
            <img src={!isGameMaster ? "/button_disabled.svg" : "/button.svg"} alt="Logout" className="startGame-icon"/>
            <p className="btn-text-startGame">Start Game</p>
          </button>
        </div>
        <div className="back-cont">
          <button className="btn-back" onClick={leaveGame}>
            <img src="/back.svg" alt="Back Button" className="back-icon"/>
          </button>
        </div>
      </div>
    </div>
  );
}
  
export default Game;