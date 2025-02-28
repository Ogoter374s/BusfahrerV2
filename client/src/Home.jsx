import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if(token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                if(payload.exp * 1000 > Date.now()) {
                    setIsAuthenticated(true);
                } else {
                    sessionStorage.removeItem("token");
                }
            } catch(error) {
                sessionStorage.removeItem("token");
            }
        }
    }, []);

    return (
        <div className="overlay-cont">
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 
            <div className="main-menu">
                <img src="logo.svg" alt="Game Logo" className="home-logo"/>
                <h1 className="home-title">
                    Busfahrer
                    <span className="highlight">
                    Extreme
                    </span>
                </h1>
                <div className="play-cont">
                    <button className={!isAuthenticated ? "btn-play-disabled" : "btn-play"} onClick={() => navigate("/create")} disabled={!isAuthenticated}>
                    <img src={isAuthenticated ? "home.svg" : "button_disabled.svg"} alt="Create Game" className="play-icon"/>
                    <p className="btn-text-play">Play Game</p>
                    </button>
                </div>
                <div className="lobby-cont">
                    <button className={!isAuthenticated ? "btn-lobby-disabled" : "btn-lobby"} onClick={() => navigate("/lobbys")} disabled={!isAuthenticated}>
                    <img src={isAuthenticated ? "home.svg" : "button_disabled.svg"} alt="Create Game" className="lobby-icon"/>
                    <p className="btn-text-lobby">Join Game</p>
                    </button>
                </div>
                <div className="settings-button">
                    <button className="btn" onClick={() => navigate(!isAuthenticated ? "/access" : "/account")}>
                        <img src="settings.svg" alt="Settings" className="settings-icon"/>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Home;