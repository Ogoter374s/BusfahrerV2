import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import BASE_URL from "./config";

function Lobbys() {
    const [games, setGames] = useState([]);
    const [privateCode, setPrivateCode] = useState("");
    const [ws, setWs] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const newWs = new WebSocket("ws://localhost:8080");

        newWs.onopen = () => {
            newWs.send(JSON.stringify({type: "lobby"}));
        };

        newWs.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if(message.type === "lobbysUpdate") {
                setGames(message.data);
            }
        };

        setWs(newWs);

        const fetchGames = async () => {
            const response = await fetch(`${BASE_URL}get-waiting-games`);
            const availableGames = await response.json();
            setGames(availableGames);
        };
        fetchGames();

        return () => {
            newWs.close();
        }
    }, []);

    const joinGame = async (gameId) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("You must be logged in to create a game.");
            return;
        }

        navigate(`/join/${gameId}`);
    };

    const joinPrivateGame = async () => {
        if(privateCode) {
            const token = sessionStorage.getItem("token");

            if (!token) {
                alert("You must be logged in to create a game.");
                return;
            }

            navigate(`/join/${privateCode}`);
        }
    };

    return (
        <div className="overlay-cont">
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/>
            <div className="lobbys-menu">
                <h1 className="lobbys-title">
                    Join
                    <span className="highlight">
                        Game
                    </span>
                </h1>
                <div className="game-list">
                    {games.map((game) => (
                        <div key={game.id} className="game-item">
                            <span>{game.name} - {game.players.length} Players</span>
                            <button onClick={() => joinGame(game.id)}/>
                        </div>
                    ))}
                </div>
                <div className="private-game-cont">
                    <input className="private-game" type="text" placeholder="Enter Private Game Code" value={privateCode} onChange={(e) => setPrivateCode(e.target.value)}/>
                    <button className="btn-private" onClick={joinPrivateGame}/>
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

export default Lobbys;