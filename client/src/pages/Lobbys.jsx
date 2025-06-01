
// Components
import ChatSidebar from '../components/ChatSidebar';
import MenuInput from '../components/MenuInput';
import BackButton from '../components/BackButton';
import LobbyList from '../components/LobbyList';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { PopupManager } from '../utils/popupManager';
import useLobbyManager from '../hooks/useLobbyManager';

// React
import { useState, useEffect, useRef } from 'react';

function Lobbys() {
    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    
    const [popup, setPopup] = useState(PopupManager.defaultPopup);
    const [privateCode, setPrivateCode] = useState('');

    const { joinGame, setPopupManager } = useLobbyManager();

    useEffect(() => {
        if (!isAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup);
        setPopupManager(PopupManager);
    }, [isAuthenticated]);
    
    return (
        <div className="overlay-cont">
            {/* Background overlay image */}
            <img src="overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main menu container for joining games */}
            <div className="lobbys-menu">
                {/* Title indicating the Join Game section */}
                <h1 className="lobbys-title">
                    Join
                    <span className="highlight">Game</span>
                </h1>

                {/* List of available public games */}
                <LobbyList onJoin={joinGame}/>

                {/* Section for joining private games using a unique code */}
                <div className="private-game-cont">
                    <MenuInput
                        type="text"
                        placeholder="Enter Private Game Code"
                        value={privateCode}
                        onChange={(e) => setPrivateCode(e.target.value)}
                        cssName="private-game"
                    />
                    <button 
                        className="btn-private" 
                        onClick={() => joinGame({gameId: privateCode, isPrivate: true})}
                    />
                </div>
            </div>

            {/* Navigation button to return to the homepage */}
            <BackButton />
            
            {/* Sidebar Toggle */}
            <ChatSidebar />

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onClose={PopupManager.closePopup}
            />
        </div>
    );
}

export default Lobbys;
