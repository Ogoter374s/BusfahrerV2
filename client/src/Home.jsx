import BASE_URL from "./config";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const navigate = useNavigate();

    /**
     * Checks the user's authentication status when the component mounts.
     *
     * Sends a GET request to the backend API to verify if the current user session is valid.
     * Updates the authentication state based on the response or logs an error if the request fails.
     */
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${BASE_URL}check-auth`, {
                    method: "GET",
                    credentials: "include",
                });

                const data = await response.json();
                setIsAuthenticated(data.isAuthenticated);
            }
            catch(error) {
                console.error("Error checking authentication:", error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    return (
        <div className="overlay-cont">

            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 

            {/* Main menu container */}
            <div className="main-menu">

                {/* Game logo displayed prominently on the homepage */}
                <img src="logo.svg" alt="Game Logo" className="home-logo"/>

                {/* Main game title with highlighted sub-title */}
                <h1 className="home-title">
                    Busfahrer
                    <span className="highlight">
                        Extreme
                    </span>
                </h1>

                {/* Button to create a new game; disabled if user is not authenticated */}
                <div className="play-cont">
                    <button 
                        className={!isAuthenticated ? "btn-play-disabled" : "btn-play"} 
                        onClick={() => navigate("/create")} 
                        disabled={!isAuthenticated}
                    >
                        <img src={isAuthenticated ? "home.svg" : "button_disabled.svg"} alt="Create Game" className="play-icon"/>
                        <p className="btn-text-play">Play Game</p>
                    </button>
                </div>

                {/* Button to join an existing game lobby; disabled if user is not authenticated */}
                <div className="lobby-cont">
                    <button 
                        className={!isAuthenticated ? "btn-lobby-disabled" : "btn-lobby"} 
                        onClick={() => navigate("/lobbys")} 
                        disabled={!isAuthenticated}
                    >
                        <img src={isAuthenticated ? "home.svg" : "button_disabled.svg"} alt="Create Game" className="lobby-icon"/>
                        <p className="btn-text-lobby">Join Game</p>
                    </button>
                </div>

                {/* Settings button redirects to login/register page or account settings based on authentication status */}
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