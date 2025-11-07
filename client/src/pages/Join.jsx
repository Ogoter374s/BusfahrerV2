/**
 * @fileoverview Join Game Page
 * <br><br>
 * This page allows users to join an existing game by entering their player name, selecting their gender,
 * and choosing whether to join as a spectator or a player.<br>
 * It includes input validation, authentication checks, and displays popups for errors or success.
 */

//Components
import ChatSidebar from '../components/ChatSidebar';
import MenuInput from '../components/MenuInput';
import MenuButton from '../components/MenuButton';
import LeaveButton from '../components/LeaveButton';
import MenuCheckBox from '../components/MenuCheckBox';
import MenuSelect from '../components/MenuSelect';
import PopupModal from '../components/PopUpModal';

// Hooks
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useLobbyGuard } from '../hooks/useLobbyGuard';
import { PopupManager } from '../utils/popupManager';
import useLobbyManager from '../hooks/useLobbyManager';

// Utilities
import { PLAYER_GENDER } from '../utils/constants';

// React
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Join Game Page Component
 * <br><br>
 * This component renders the Join Game page where users can enter their player name, select their gender,
 * and choose whether to join as a spectator or a player. <br>
 * It includes input validation, authentication checks, and displays popups for errors or success.
 * <br><br>
 * <strong>useAuthGuard()</strong>: <br>
 * Custom hook that checks if the user is authenticated. If not, it redirects to the home page.
 * <br><br>
 * <strong>useLobbyGuard()</strong>: <br>
 * Custom hook that checks if the user is authorized to join the specified lobby. If not, it redirects to the lobby list page.
 * <br><br>
 * <strong>useEffect</strong>: <br>
 * Hook that runs side effects in the component. In this case, it initializes the PopupManager and sets up the necessary state.
 * <br><br>
 * @function Join
 * @returns {JSX.Element} The Join Game page component.
 */
function Join() {
    const { lobbyId } = useParams();

    const [playerName, setPlayerName] = useState('');
    const [gender, setGender] = useState(PLAYER_GENDER.MALE);
    const [isSpectator, setSpectator] = useState(false);

    const navigate = useNavigate();
    const [popup, setPopup] = useState(PopupManager.defaultPopup);

    const init = useRef(false);
    const isAuthenticated = useAuthGuard();
    const isLobbyAuthenticated = useLobbyGuard();

    /**
     * Destructuring the joinGame function from the useJoinGame hook.
     * This function is used to handle the logic for joining a game.
     * It takes an object with gameId, playerName, gender, and isSpectator.
     */
    const { joinLobby, leaveJoin } = useLobbyManager();

    /**
     * useEffect hook that initializes the PopupManager when the component mounts.
     * It ensures that the PopupManager is only initialized once and only if the user is authenticated
     * and authorized to join the lobby.
     */
    useEffect(() => {
        if (!isAuthenticated) return;
        if (!isLobbyAuthenticated) return;

        if (init.current) return;
        init.current = true;

        PopupManager.initPopupManager(setPopup,navigate);
    }, [isAuthenticated, isLobbyAuthenticated]);

    return (
        <div className="@container/join flex flex-col items-center justify-center h-screen">

            {/* Background overlay image */}
            <div className="join-wrapper">
                {/* Main menu for joining a game */}
                <div className="join-menu">
                    {/* Game logo displayed at the top */}
                    <img
                        src="/logos/logo.svg"
                        alt="Game Logo"
                        className="join-logo"
                    />

                    {/* Title indicating the "Join Game" section */}
                    <h1 className="join-title">
                        Join
                        <span className="highlight">Game</span>
                    </h1>

                    {/* Form for entering player details */}
                    <div className="join-game">

                        {/* Input for player's display name */}
                        <MenuInput
                            type="text"
                            placeholder="Player Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            img="wood_blue"
                            required
                        />

                        {/* Gender selection dropdown only visible if not spectator */}
                        {!isSpectator && (
                            <MenuSelect
                                label="Gender:"
                                id="optionsSelect"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                options={[
                                    { name: "Male", value: PLAYER_GENDER.MALE },
                                    { name: "Female", value: PLAYER_GENDER.FEMALE },
                                    { name: "Other", value: PLAYER_GENDER.OTHER },
                                ]}
                            />
                        )}

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
                        wrapper={true}
                        wrapperClass="mt-25 sm:mt-11 lg:mt-30 xl:mt-30 2xl:mt-38"
                        buttonClass="join-btn"
                        textClass="btn-txt"
                        icon="button"
                        alt="Join Game"
                        text="Join Game"
                        onClick={() =>
                            joinLobby({
                                lobbyId,
                                playerName,
                                gender,
                                isSpectator,
                            })
                        }
                    />
                </div>
            </div>

            {/* Navigation button to return to the homepage */}
            <LeaveButton handleClick={leaveJoin} />

            {/* Sidebar Toggle */}
            <ChatSidebar />

            {/* Popup modal for displaying messages */}
            <PopupModal
                isOpen={popup.show}
                title={popup.title}
                message={popup.message}
                icon={popup.icon}
                onOk={PopupManager.okPopup}
                onCancel={PopupManager.cancelPopup}
                useCancel={popup.useCancel}
            />
        </div>
    );
}

export default Join;
