import BASE_URL from "./config";

import {useState, useEffect} from "react";
import { useNavigate, useParams } from "react-router-dom";

function Join() {
    const {gameId} = useParams();
    
    const [playerName, setPlayerName] = useState("");
    const [gender, setGender] = useState("Male");
    
    const navigate = useNavigate();

    /**
     * Handles joining a game by sending the player's details to the backend.
     *
     * Validates that the player name is provided. Sends a POST request to the backend
     * with the player's name and gender. Authentication is handled via an HttpOnly cookie.
     * Navigates to the game page if successful or displays an error message otherwise.
     */
    const handleJoin = async () => {
        if (!playerName || playerName.trim() === "") {
            alert("Please provide a valid player name.");
            return;
        }

        const trmPlayerName = playerName.trim().slice(0, 26);

        try {
            const response = await fetch(`${BASE_URL}join-game/${gameId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ playerName: trmPlayerName, gender }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                navigate(`/game/${gameId}`);
            } else {
                alert(data.error);
            }
        }
        catch(error) {
            console.error("Unexpected error joining the game:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div className="overlay-cont">

            {/* Background decorative overlay */}
            <img src="/overlay.svg" alt="Overlay" className="overlay-img"/>

            {/* Main menu for joining a game */}
            <div className="join-menu">

                {/* Game logo displayed at the top */}
                <img src="/logo.svg" alt="Game Logo" className="join-logo"/>

                {/* Title indicating the "Join Game" section */}
                <h1 className="join-title">
                    Join 
                    <span className="highlight">
                        Game
                    </span>
                </h1>

                {/* Form for entering player details */}
                <div className="rustic-form-join">
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
                </div>

                {/* Button to join the game */}
                <div className="join-cont">
                    <button className="btn-join" onClick={handleJoin}>
                        <img src="/button.svg" alt="Create Game" className="join-icon"/>
                        <p className="btn-text-join">Join Game</p>
                    </button>
                </div>

                {/* Navigation button to go back to the lobby selection screen */}
                <div className="back-cont">
                    <button className="btn-back" onClick={() => navigate("/lobbys")}>
                        <img src="/back.svg" alt="Back Button" className="back-icon"/>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Join;