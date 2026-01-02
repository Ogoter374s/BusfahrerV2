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
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Framer Motion
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Preload background overlay images to improve performance.
 * This ensures that the images are loaded into the browser cache
 * before they are needed in the application.
 */
['/backgrounds/overlay.webp', '/backgrounds/overlay_account.webp', '/backgrounds/overlay_phase.webp']
  .forEach((src) => {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => { });
  });

const pageVariants = {
  initial: (direction) => ({
    opacity: 0,
    y: direction > 0 ? 100 : -100,
    scale: 1,
  }),
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 1, 0.25, 1],
    },
  },
  exit: (direction) => ({
    opacity: 0,
    y: direction < 0 ? 100 : -100,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  }),
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Home */}
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />

        {/* Account */}
        <Route path="/access" element={<PageWrapper><Access /></PageWrapper>} />
        <Route path="/account" element={<PageWrapper><Account /></PageWrapper>} />
        <Route path="/achievements" element={<PageWrapper><Achievements /></PageWrapper>} />

        {/* Lobby */}
        <Route path="/create" element={<PageWrapper><Create /></PageWrapper>} />
        <Route path="/lobbies" element={<PageWrapper><Lobbies /></PageWrapper>} />
        <Route path="/join/:lobbyId" element={<PageWrapper><Join /></PageWrapper>} />
        <Route path="/lobby/:lobbyId" element={<PageWrapper><Lobby /></PageWrapper>} />

        {/* Game */}
        <Route path="/game/:lobbyId" element={<PageWrapper><Game /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      className="page-wrapper"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}

/**
 * Render the React application.
 * This sets up the routing for the application using React Router.
 * Each route is associated with a specific page component.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <Router>
    <AnimatedRoutes />
  </Router>,
);
