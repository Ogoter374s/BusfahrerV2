
// Hooks
import useWebSocketConnector from './useWebSocketConnector';
import usePlayerCards from './usePlayerCards';
import useGameCards from './useGameCards';
import useGameInfo from './useGameInfo';
import useSpectatorManager from './useSpectatorManager';

// Utilities
import BASE_URL from "../utils/config";
import { SoundManager } from '../utils/soundManager';

// React
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";

let PopupManager = null;
const usePhase1Manager = () => {
    const phase = 1;

    const init = useRef(false);
    const { gameId } = useParams();
    const navigate = useNavigate();

    const [isGameMaster, setIsGameMaster] = useState(false);

    const {
        playerCards,
        fetchPlayerCards,
    } = usePlayerCards();

    const {
        gameCards,
        fetchGameCards,
        isRowFlipped,
        setIsRowFlipped,
        fetchIsRowFlipped,
    } = useGameCards();

    const {
        currentName,
        isCurrentPlayer,
        fetchCurrentPlayer,
        drinkCount,
        setDrinkCount,
        fetchDrinkCount,
        isNextPhase,
        setIsNextPhase,
        fetchRound,
        drinksReceived,
        fetchDrinksReceived,
        drinksGiven,
        fetchDrinksGiven,
    } = useGameInfo(1);

    const {
        isSpectator,
    } = useSpectatorManager();

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    const fetchIsGameMaster = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-game-master?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const isMaster = await response.json();
            setIsGameMaster(isMaster);
        } catch (error) {
            console.error('Error checking game master status:', error);
        }
    };

    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchPlayerCards();
        fetchGameCards(phase);
        fetchIsRowFlipped();

        fetchRound();
        fetchCurrentPlayer();
        fetchDrinkCount();
        fetchDrinksReceived();
        fetchDrinksGiven();

        fetchIsGameMaster();
    }, [navigate]);

    useWebSocketConnector("subscribe", {gameId}, (message) => {
        if (message.type === 'playersUpdate') {
            fetchPlayerCards();
            fetchDrinksGiven();
            fetchDrinksReceived();
        }

        if (message.type === 'drinkUpdate') {
            setDrinkCount(message.data.drinks);
        }

        if (message.type === 'cardsUpdate') {
            console.log("Update received");
            fetchGameCards(phase);
        }

        if (message.type === 'gameUpdate') {
            setIsNextPhase(message.data.round === 6);
            setIsRowFlipped(message.data.flipped);
            fetchDrinksReceived();

            fetchCurrentPlayer();
        }

        // Handle game being closed
        if (message.type === 'gameClosed') {
            PopupManager.showPopup({
                title: "Game Closed",
                message: "The Game has been closed by the Game Master.",
                icon: '❌',
                to: '/lobbys',
            });
        }

        if (message.type === 'phase2') {
            navigate(`/phase2/${gameId}`);
        }
    });

    const handleRowClick = async (rowIdx) => {
        if (!isGameMaster || isRowFlipped) return;

        try {
            const response = await fetch(`${BASE_URL}flip-row`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, rowIdx }),
            });

            if (response.ok) {
                SoundManager.playClickSound();
            } else {
                PopupManager.showPopup({
                    title: "Row Flip",
                    message: "Failed to flip row.",
                    icon: '❌',
                });
            }
        } catch (error) {
            console.error('Error flipping row:', error);
        }
    };

    const handleLayCard = async (cardIdx) => {
        if (!isCurrentPlayer) return;

        try {
            const response = await fetch(`${BASE_URL}lay-card`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, cardIdx }),
            });

            const data = await response.json();

            if (response.ok) {
                if(data.success) {
                    SoundManager.playClickSound();
                }
            } else {
                PopupManager.showPopup({
                    title: "Lay Card",
                    message: "Failed to lay card.",
                    icon: '❌',
                });
            }
        } catch (error) {
            console.error('Error laying card:', error);
        }
    };

    return {
        playerCards,
        gameCards,
        isRowFlipped,
        currentName,
        isCurrentPlayer,
        drinkCount,
        isNextPhase,
        drinksReceived,
        drinksGiven,
        isSpectator,
        setPopupManager,
        handleRowClick,
        handleLayCard,
    }
};

export default usePhase1Manager;