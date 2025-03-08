import BASE_URL from "./config";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Create() {
    const [gameName, setGameName] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [gender, setGender] = useState("Male");

    const navigate = useNavigate();
  
    /**
     * Creates a new game by sending the game details to the backend API.
     *
     * Sends a POST request with the game details, using HttpOnly cookie authentication.
     * Redirects the user to the new game page upon successful creation.
     * Alerts the user if authentication fails or if there's an error creating the game.
     * Limits game name length to a maximum of 16 characters.
     */
    const createGame = async () => {
      if (!gameName || gameName.trim() === "") {
        alert("Please provide a valid game name.");
        return;
      }

      if (!playerName || playerName.trim() === "") {
        alert("Please provide a valid player name.");
        return;
      }

      const trmGameName = gameName.trim().slice(0, 16);
      const trmPlayerName = playerName.trim().slice(0, 26);

      try {
        const response = await fetch(`${BASE_URL}create-game`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({gameName: trmGameName, playerName: trmPlayerName, isPrivate, gender})
        });

        const data = await response.json();
        if (data.success) {
          navigate(`/game/${data.gameId}`);
        } else {
            alert("Failed to create the game.");
        }
      }
      catch(error) {
        console.error("Unexpected error creating the game:", error);
        alert("An unexpected error occurred. Please try again.");
      }
    };
  
    return (
      <div className="overlay-cont">

        {/* Background decorative overlay image */}
        <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 

        {/* Container for creating a new game session */}
        <div className="create-menu">

          {/* Game session title and branding logo */}
          <img src="logo.svg" alt="Game Logo" className="create-logo"/>
          <h1 className="create-title">
            Play 
            <span className="highlight">
              Game
            </span>
          </h1>

          {/* Form inputs for game and player details */}
          <div className="rustic-form">

            {/* Input for the game name */}
            <input 
              type="text" 
              placeholder="Game Name" 
              className="rustic-input" 
              value={gameName} 
              onChange={(e) => setGameName(e.target.value)} 
            />

            {/* Input for player's display name */}
            <input 
              type="text"
              placeholder="Player Name" 
              className="rustic-input" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
            />

            {/* Gender selection dropdown */}
            <label className="rustic-label">Gender:</label>
            <select 
              className="gender-select" 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Divers">Divers</option>
            </select>

            {/* Checkbox for marking game as private or public */}
            <label className="rustic-checkbox">
              <input 
                type="checkbox" 
                checked={isPrivate} 
                onChange={() => setIsPrivate(!isPrivate)} 
              />
                Private Game
            </label>
          </div>

          {/* Button to create the game */}
          <div className="create-cont">
            <button className="btn-create" onClick={createGame}>
              <img src="button.svg" alt="Create Game" className="create-icon"/>
              <p className="btn-text">Create Game</p>
            </button>
          </div>

          {/* Navigation button to return to the homepage */}
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