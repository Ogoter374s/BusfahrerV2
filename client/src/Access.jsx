import BASE_URL from "./config";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Access() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    
    const navigate = useNavigate();

    /**
     * Handles form submission for user login or registration.
     *
     * Sends credentials to the backend API, navigates to the homepage upon success,
     * and displays an alert with an error message upon failure.
     *
     * @param {Event} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? "login" : "register";

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({username, password}),
                credentials: "include",
            });

            const data = await response.json();
            if(data.success) {
                navigate("/");
            } else {
                alert(data.error);
            }
        }
        catch(error) {
            alert("An unexpected error occurred. Please try again later.");
            console.error(error);
        }
    };

    return (
        <div className="overlay-cont">

            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 

            {/* Main login/register container */}
            <div className="access-menu">

                {/* Game Logo displayed above the form */}
                <img src="logo.svg" alt="Game Logo" className="access-logo"/>

                {/* Title dynamically switches between Login and Register */}
                <h1 className="access-title">{isLogin ? "Login" : "Register"}</h1>

                {/* Form for handling user input (login or registration) */}
                <form onSubmit={handleSubmit}>

                    {/* Username input field */}
                    <input 
                        className="rustic-input-access" 
                        type="text" 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                    />

                    {/* Password input field */}
                    <input 
                        className="rustic-input-access" 
                        type="password" 
                        placeholder="Password" 
                        value={password} onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />

                    {/* Submit button container */}
                    <div className="access-cont">
                        <button className="btn-access" type="submit">
                            <img src="button.svg" alt="Create Game" className="access-icon"/>
                            <p className="btn-text-access">{isLogin ? "Login" : "Register"}</p>
                        </button>
                    </div>
                </form>

                {/* Switch button to toggle between Login and Register */}
                <div className="switch-cont">
                    <button className="btn-switch" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Create an Account" : "Already have an account? Login"}
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

export default Access;