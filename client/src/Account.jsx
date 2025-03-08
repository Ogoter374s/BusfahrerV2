import BASE_URL, {WBS_URL} from "./config";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Account() {
    const [statistics, setStatistics] = useState("");
    const [ws, setWs] = useState(null);
    
    const navigate = useNavigate();

    /**
     * Sets up a WebSocket connection to receive real-time account updates.
     *
     * Initializes the WebSocket, sends an identification message upon opening,
     * and listens for incoming messages. On receiving an account update message,
     * fetches updated user statistics from the backend API.
     * Cleans up by closing the WebSocket connection when the component unmounts.
     */
    useEffect(() => {
        const newWs = new WebSocket(WBS_URL);

        newWs.onopen = () => {
            newWs.send(JSON.stringify({type: "account"}));
        };

        newWs.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if(message.type === "accountUpdate") {
                fetchStatistics();
            }
        };

        setWs(newWs);

        /**
         * Fetches user statistics from the backend API.
         *
         * Sends a GET request including the HttpOnly cookie automatically.
         * Updates the statistics state with the received data.
         */
        const fetchStatistics = async () => {
            const response = await fetch(`${BASE_URL}get-statistics`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include"
            });

            const stats = await response.json();

            setStatistics(stats);
        }
        fetchStatistics();

        return () => newWs.close();
    }, []);

    /**
     * Logs out the current user by clearing the session cookie.
     *
     * Sends a logout request to the backend API, which invalidates the HttpOnly cookie.
     * Redirects the user to the login page upon successful logout.
     */
    const handleLogout = async () => {
        try {
            await fetch(`${BASE_URL}logout`, {
                method: "POST",
                credentials: "include",
            });
    
            navigate("/access");
        } catch (error) {
            console.error("Error during logout:", error);
            alert("Logout failed. Please try again.");
        }
    };

    return (
        <div className="overlay-cont">

            {/* Decorative background overlay */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 

            {/* Main account menu container */}
            <div className="account-menu">

                {/* Title for the account section */}
                <h1 className="account-title">Account</h1>

                {/* Container for displaying user statistics */}
                <div className="stats-container">
                    <div className="stats-box">
                        <h2>Statistics</h2>

                         {/* Individual user statistic entries */}
                        <p><span>Games Played:</span>{statistics.gamesPlayed}</p>
                        <p><span>Games Busfahrer:</span>{statistics.gamesBusfahrer}</p>
                        <p><span>Schlucke Verteilt:</span>{statistics.drinksGiven}</p>
                        <p><span>Max. Schlucke Verteilt:</span>{statistics.maxDrinksGiven}</p>
                        <p><span>Schlucke Selbst:</span>{statistics.drinksSelf}</p>
                        <p><span>Max. Schlucke Selbst:</span>{statistics.maxDrinksSelf}</p>
                        <p><span>Anzahl Exen:</span>{statistics.numberEx}</p>
                        <p><span>Max. Karten Anzahl:</span>{statistics.maxCardsSelf}</p>
                    </div>
                </div>

                {/* Logout button */}
                <div className="account-cont">
                    <button className="btn-account" onClick={handleLogout}>
                        <img src="button.svg" alt="Logout" className="account-icon"/>
                        <p className="btn-text-account">Logout</p>
                    </button>
                </div>
            </div>

            {/* Back button to navigate to the home page */}
            <div className="back-cont">
                <button className="btn-back" onClick={() => navigate("/")}>
                    <img src="back.svg" alt="Back Button" className="back-icon"/>
                </button>
            </div>
        </div>
    );
}

export default Account;