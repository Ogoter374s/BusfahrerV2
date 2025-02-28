import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "./config";

function Create() {
    const [gameName, setGameName] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [gender, setGender] = useState("Male");
    const navigate = useNavigate();
  
    const createGame = async () => {
      if (!gameName || !playerName) return;
      
      const token = sessionStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to create a game.");
        return;
      }

      const response = await fetch(`${BASE_URL}create-game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({gameName, playerName, isPrivate, gender})
      });

      const data = await response.json();
      if(data.success) {
        navigate(`/game/${data.gameId}`);
      } else {
        console.error("Error creating game:", data.error);
      }
    };
  
    return (
      <div className="overlay-cont">
        <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 
        <div className="create-menu">
          <img src="logo.svg" alt="Game Logo" className="create-logo"/>
          <h1 className="create-title">
            Play 
            <span className="highlight">
              Game
            </span>
          </h1>
          <div className="rustic-form">
            <input type="text" placeholder="Game Name" className="rustic-input" value={gameName} onChange={(e) => setGameName(e.target.value)} />
            <input type="text" placeholder="Player Name" className="rustic-input" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            <label className="rustic-label">Gender:</label>
            <select className="gender-select" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Divers">Divers</option>
            </select>
            <label className="rustic-checkbox">
              <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} />
              Private Game
            </label>
          </div>
          <div className="create-cont">
            <button className="btn-create" onClick={createGame}>
              <img src="button.svg" alt="Create Game" className="create-icon"/>
              <p className="btn-text">Create Game</p>
            </button>
          </div>
          <div className="back-cont">
            <button className="btn-back" onClick={() => navigate("/")}>
              <img src="back.svg" alt="Back Button" className="back-icon"/>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default Create;