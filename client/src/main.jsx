import Home from './pages/Home';

// Account
import Access from './pages/Access';
import Account from './pages/Account';
import Achievements from './pages/Achievements';

// Lobby
import Create from './pages/Create';
import Lobbys from './pages/Lobbys';
import Join from './pages/Join';

// Game
import Game from './pages/Game';
import Phase1 from './pages/Phase1';
import Phase2 from './pages/Phase2';
import Phase3 from './pages/Phase3';

// CSS
import './index.css';

// React 
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />

                {/* Account */}
                <Route path="/access" element={<Access />} />
                <Route path="/account" element={<Account />} />
                <Route path="/achievements" element={<Achievements />} />

                {/* Lobby */}
                <Route path="/create" element={<Create />} />
                <Route path="/lobbys" element={<Lobbys />} />
                <Route path="/join/:gameId" element={<Join />} />

                {/* Game */}
                <Route path="/game/:gameId" element={<Game />} />
                <Route path="/phase1/:gameId" element={<Phase1 />} />
                <Route path="/phase2/:gameId" element={<Phase2 />} />
                <Route path="/phase3/:gameId" element={<Phase3 />} />
            </Routes>
        </Router>
    </React.StrictMode>,
);
