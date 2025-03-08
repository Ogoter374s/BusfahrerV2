import BASE_URL, {WBS_URL} from "./config";

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Lobbys() {
    const [games, setGames] = useState([]);
    const [privateCode, setPrivateCode] = useState("");
    const [ws, setWs] = useState(null);
    
    const navigate = useNavigate();

    /**
     * Sets up a WebSocket connection to receive real-time lobby updates.
     *
     * Initializes the WebSocket, sends a lobby identification message upon opening,
     * and listens for incoming messages. On receiving a lobby update message,
     * updates the games state with new lobby data.
     * Additionally, fetches the initial list of games from the backend API upon mounting.
     * Cleans up by closing the WebSocket connection when the component unmounts.
     */
    useEffect(() => {
        const newWs = new WebSocket(WBS_URL);

        newWs.onopen = () => {
            newWs.send(JSON.stringify({type: "lobby"}));
        };

        newWs.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if(message.type === "lobbysUpdate") {
                console.log("Update");
                fetchGames();
            }
        };

        setWs(newWs);

        /**
         * Fetches the initial list of available games from the backend API.
         *
         * Sends a GET request to retrieve lobby data and updates the games state.
         */
        const fetchGames = async () => {
            const response = await fetch(`${BASE_URL}get-waiting-games`, {
                credentials: "include"
            });

            const data = await response.json();
            setGames(data);
        };
        fetchGames();

        return () => newWs.close();
    }, []);

    /**
     * Navigates the user to join the selected game lobby.
     *
     * Checks if the user is authenticated via HttpOnly cookie.
     * If authenticated, redirects the user to the specified game's join page.
     * Otherwise, alerts the user to log in first.
     *
     * @param {string} gameId - The ID of the game to join.
     */
    const joinGame = async (gameId) => {
        try {
            const response = await fetch(`${BASE_URL}check-game-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ gameId })
            });
    
            const data = await response.json();
    
            if (data.success) {
                navigate(`/join/${data.game}`);
            } else {
                alert(data.error);
            }
        }
        catch(error) {
            console.error("Unexpected error joining game:", error);
            alert("Failed to join the game. Please try again.");
        }
    };

    /**
     * Joins a private game using a provided game code.
     *
     * Checks if the user is authenticated, sends the private game code to the backend
     * for verification, and navigates the user to the game page upon success.
     */
    const joinPrivateGame = async () => {
        if (!privateCode || !privateCode.trim()) {
            alert("Please enter a valid game code.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}check-game-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ gameId: privateCode }),
            });
    
            const data = await response.json();
    
            if (data.success) {
                navigate(`/join/${data.game}`);
            } else {
                alert(data.error);
            }
        }
        catch(error) {
            console.error("Unexpected error joining private game:", error);
            alert("Failed to join the private game. Please try again.");
        }
    };

    return (
        <div className="overlay-cont">

            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/>

            {/* Main menu container for joining games */}
            <div className="lobbys-menu">

                {/* Title indicating the Join Game section */}
                <h1 className="lobbys-title">
                    Join
                    <span className="highlight">
                        Game
                    </span>
                </h1>

                {/* List of available public games */}
                <div className="game-list">
                    {games.map((game) => (
                        <div key={game.id} className="game-item">
                            <span>{game.name} - {game.playerCount} {game.playerCount === 1 ? "Player" : "Players"}</span>
                            <button onClick={() => joinGame(game.id)}/>
                        </div>
                    ))}
                </div>

                {/* Section for joining private games using a unique code */}
                <div className="private-game-cont">
                    <input 
                        className="private-game" 
                        type="text" 
                        placeholder="Enter Private Game Code" 
                        value={privateCode} 
                        onChange={(e) => setPrivateCode(e.target.value)}
                    />
                    <button className="btn-private" onClick={joinPrivateGame}/>
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

export default Lobbys;