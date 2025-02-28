import {useState, useEffect} from "react";
import { useNavigate, useParams } from "react-router-dom";
import BASE_URL from "./config";

function Join() {
    const [playerName, setPlayerName] = useState("");
    const [gender, setGender] = useState("Male");
    const {gameId} = useParams();
    const navigate = useNavigate();

    const handleJoin = async () => {
        if(!playerName.trim()) {
            alert("Please enter your name!");
            return;
        }

        const token = sessionStorage.getItem("token");
        if(!token) {
            alert("You must be logged in to join a game");
            return;
        }

        const response = await fetch(`${BASE_URL}join-game/${gameId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({playerName, gender}),
        });

        const data = await response.json();

        if(response.ok) {
            navigate(`/game/${gameId}`)
        } else {
            alert(data.error);
        }
    };

    return (
        <div className="overlay-cont">
            <img src="/overlay.svg" alt="Overlay" className="overlay-img"/> 
            <div className="join-menu">
                <img src="/logo.svg" alt="Game Logo" className="join-logo"/>
                <h1 className="join-title">
                    Join 
                    <span className="highlight">
                        Game
                    </span>
                </h1>
                <div className="rustic-form-join">
                    <input type="text" placeholder="Player Name" className="rustic-input" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
                    <label className="rustic-label">Gender:</label>
                    <select className="gender-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Divers">Divers</option>
                    </select>
                </div>
                <div className="join-cont">
                    <button className="btn-join" onClick={handleJoin}>
                        <img src="/button.svg" alt="Create Game" className="join-icon"/>
                        <p className="btn-text-join">Join Game</p>
                    </button>
                </div>
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