/**
 * @fileoverview Main entry point for the React application.
 * <br><br>
 * This file sets up the routing for the application using React Router. <br>
 * It imports all the necessary page components and defines the routes for navigation.
 */

// Home
import Home from './pages/Home';

// Account
import Access from './pages/Access';
import Account from './pages/Account';
import Achievements from './pages/Achievements';

// Lobby
import Create from './pages/Create';
import Lobbies from './pages/Lobbies';
import Join from './pages/Join';
import Lobby from './pages/Lobby';

// Game
import Game from './pages/Game';

// CSS
import './main.css';

// React 
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/**
 * Preload background overlay images to improve performance.
 * This ensures that the images are loaded into the browser cache
 * before they are needed in the application.
 */
['/backgrounds/overlay.webp', '/backgrounds/overlay_account.webp', '/backgrounds/overlay_phase.webp']
  .forEach((src) => {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => {});
  });

/**
 * Render the React application.
 * This sets up the routing for the application using React Router.
 * Each route is associated with a specific page component.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
    <Router>
        <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* Account */}
            <Route path="/access" element={<Access />} />
            <Route path="/account" element={<Account />} />
            <Route path="/achievements" element={<Achievements />} />

            {/* Lobby */}
            <Route path="/create" element={<Create />} />
            <Route path="/lobbies" element={<Lobbies />} />
            <Route path="/join/:lobbyId" element={<Join />} />
            <Route path="/lobby/:lobbyId" element={<Lobby />} />

            {/* Game */}
            <Route path="/game/:lobbyId" element={<Game />} />
        </Routes>
    </Router>,
);
