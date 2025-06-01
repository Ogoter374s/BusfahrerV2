
//Components
import ChatSidebar from '../components/ChatSidebar';
import MenuInput from '../components/MenuInput';
import MenuButton from '../components/MenuButton';
import BackButton from '../components/BackButton';
import MenuCheckBox from '../components/MenuCheckBox';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useLobbyGuard } from '../hooks/useLobbyGuard';
import { PopupManager } from '../utils/popupManager';
import useJoinGame from '../hooks/useJoinGame';

// React
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

function Join() {
    const { gameId } = useParams();

    const [playerName, setPlayerName] = useState('');
    const [gender, setGender] = useState('Male');
    const [isSpectator, setSpectator] = useState(false);

    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    const isLobbyAuthenticated = useLobbyGuard();

    const {
        joinGame,
        setPopupManager,
    } = useJoinGame();

    useEffect(() => {
        if(!isAuthenticated) return;
        if(!isLobbyAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup);
        setPopupManager(PopupManager);
    }, [isAuthenticated, isLobbyAuthenticated]);

    return (
        <div className="overlay-cont">
            {/* Background decorative overlay */}
            <img src="/overlay.svg" alt="Overlay" className="overlay-img" />

            {/* Main menu for joining a game */}
            <div className="join-menu">
                {/* Game logo displayed at the top */}
                <img src="/logo.svg" alt="Game Logo" className="join-logo" />

                {/* Title indicating the "Join Game" section */}
                <h1 className="join-title">
                    Join
                    <span className="highlight">Game</span>
                </h1>

                {/* Form for entering player details */}
                <div className="rustic-form-join">
                    
                    {/* Input for player's display name */}
                    <MenuInput 
                        type="text"
                        placeholder="Player Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        cssName="rustic-input"
                    />

                    {/* Gender selection dropdown */}
                    <label className="rustic-label">Gender:</label>
                    <select
                        className="gender-select"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Divers">Divers</option>
                    </select>

                    {/* Checkbox for joining Game as Player or Viewer */}
                    <MenuCheckBox 
                        label="Spectate Game"
                        value={isSpectator}
                        onChange={() => setSpectator(!isSpectator)}
                        className="options-selection"
                        selectType="checkbox"
                    />
                </div>

                {/* Button to join the game */}
                <MenuButton
                    wrapperClass="join-cont"
                    buttonClass="btn-join"
                    icon="/button.svg"
                    alt="Join Game"
                    text="Join Game"
                    onClick={() =>
                        joinGame({
                            gameId,
                            playerName,
                            gender,
                            isSpectator,
                        })
                    }
                />

            </div>

            {/* Navigation button to return to the homepage */}
            <BackButton to="/lobbys"/>

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

export default Join;
