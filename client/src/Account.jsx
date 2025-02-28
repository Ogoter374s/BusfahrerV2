import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "./config";

function Account() {
    const [statistics, setStatistics] = useState("");
    const [ws, setWs] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const newWs = new WebSocket("ws://localhost:8080");

        console.log("Start")

        newWs.onopen = () => {
            newWs.send(JSON.stringify({type: "account"}));
        };

        newWs.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if(message.type === "accountUpdate") {
                getUserName();
                fetchStatistics();
            }
        };

        setWs(newWs);

        const fetchStatistics = async () => {
            const token = sessionStorage.getItem("token");
            const response = await fetch(`${BASE_URL}get-statistics`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                }
            });

            const stats = await response.json();

            setStatistics(stats);
        }
        fetchStatistics();

        return () => newWs.close();
    }, []);

    const handleLogout = async () => {
        sessionStorage.removeItem("token");
        navigate("/access");
    };

    return (
        <div className="overlay-cont">
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 
            <div className="account-menu">
                <h1 className="account-title">Account</h1>
                <div className="stats-container">
                    <div className="stats-box">
                        <h2>Statistics</h2>
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
                <div className="account-cont">
                    <button className="btn-account" onClick={handleLogout}>
                        <img src="button.svg" alt="Logout" className="account-icon"/>
                        <p className="btn-text-account">Logout</p>
                    </button>
                </div>
            </div>
            <div className="back-cont">
                <button className="btn-back" onClick={() => navigate("/")}>
                    <img src="back.svg" alt="Back Button" className="back-icon"/>
                </button>
            </div>
        </div>
    );
}

export default Account;