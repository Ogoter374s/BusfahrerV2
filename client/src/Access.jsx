import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "./config";

function Access() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? "login" : "register";
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({username, password}),
        });

        const data = await response.json();
        if(data.success) {
            sessionStorage.setItem("token", data.token);
            navigate("/");
        } else {
            alert(data.error);
        }
    };

    return (
        <div className="overlay-cont">
            <img src="overlay.svg" alt="Overlay" className="overlay-img"/> 
            <div className="access-menu">
                <img src="logo.svg" alt="Game Logo" className="access-logo"/>
                <h1 className="access-title">{isLogin ? "Login" : "Register"}</h1>
                <form onSubmit={handleSubmit}>
                    <input className="rustic-input-access" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <input className="rustic-input-access" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <div className="access-cont">
                        <button className="btn-access" type="submit">
                            <img src="button.svg" alt="Create Game" className="access-icon"/>
                            <p className="btn-text-access">{isLogin ? "Login" : "Register"}</p>
                        </button>
                    </div>
                </form>
                <div className="switch-cont">
                    <button className="btn-switch" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Create an Account" : "Already have an account? Login"}
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

export default Access;