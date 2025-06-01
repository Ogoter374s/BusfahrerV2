
// Hooks
import useWebSocketConnector from './useWebSocketConnector';
import useGameCards from './useGameCards';
import useGameInfo from './useGameInfo';
import useBusfahrer from './useBusfahrer';
import useSpectatorManager from './useSpectatorManager';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

// React
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

let PopupManager = null;
const usePhase3Manager = () => {
    const phase = 3;
    const lastCard = null;

    const init = useRef(false);
    const { gameId } = useParams();
    const navigate = useNavigate();

    const [isGameMaster, setIsGameMaster] = useState(false);
    const [isLast, setIsLast] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [endGame, setEndGame] = useState(false);

    const {
        gameCards,
        setGameCards,
        fetchGameCards,
    } = useGameCards();

    const {
        busfahrerName,
        setBusfahrerName,
        isBusfahrer,
        setIsBusfahrer,
        fetchBusfahrer,
    } = useBusfahrer();

    const {
        currentRound,
        setCurrentRound,
        fetchRound,
        drinkCount,
        fetchDrinkCount,
    } = useGameInfo(3);

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

    const fetchIsOwner = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-owner?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const owner = await response.json();
            setIsOwner(owner);
        } catch (error) {
            console.error('Error fetching game owner status:', error);
        }
    };

    const fetchEndGame = async () => {
            try {
                const response = await fetch(
                    `${BASE_URL}get-end-game?gameId=${gameId}`,
                    {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    },
                );
    
                if (!response.ok)
                    throw new Error('Failed to check end game status');
    
                const end = await response.json();
                setEndGame(end);
            } catch (error) {
                console.error('Error checking game end status:', error);
            }
        };

    useEffect(() => {
        if (init.current) return;
        init.current = true;

        fetchGameCards(phase);

        fetchRound();
        fetchDrinkCount();

        fetchBusfahrer();
        
        fetchIsGameMaster();
        fetchIsOwner();
        fetchEndGame();
    }, [navigate]);

    useWebSocketConnector("subscribe", {gameId}, (message) => {
        if (message.type === 'cardsUpdate') {
            setGameCards(message.data.diamondCards);
            fetchIsOwner();
        }

        if (message.type === 'drinkUpdate') {
            fetchDrinkCount();
        }

        if (message.type === 'gameUpdate') {
            setBusfahrerName(message.data.busfahrerName);
            setIsBusfahrer(message.data.isBusfahrer);
            
            setCurrentRound(message.data.round);
            setEndGame(message.data.endGame);
        }

        if (message.type === 'close') {
            PopupManager.showPopup({
                title: "Game Closed",
                message: "The Game has been closed by the Game Master.",
                icon: '❌',
                to: '/lobbys',
            });
        }

        if (message.type === 'newGame') {
            PopupManager.showPopup({
                title: "New Game",
                message: "The Game has been closed and a new game has been opened.",
                icon: '⌛',
                to: '/lobbys',
            });
            navigate(`/game/${message.newId}`);
        }
    });

    const checkCard = async (cardIdx, btnType) => {
        try {
            if (gameCards.flat()[cardIdx].flipped) return;

            const endpoint =
                currentRound === 1 ? 'check-last-card' : 'check-card';
            let bodyData = { gameId, cardIdx, btnType };

            if (currentRound === 1) {
                if (!isLast) {
                    setIsLast(true);
                    lastCard = btnType;
                    return;
                }

                bodyData.lastBtn = lastCard;
            }

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(bodyData),
            });

            if (response.ok) SoundManager.playClickSound();
        } catch (error) {
            console.error('Error checking card selection:', error);
        }
    };

    return {
        gameCards,
        busfahrerName,
        currentRound,
        isLast,
        drinkCount,
        isGameMaster,
        isOwner,
        endGame,
        isSpectator,
        checkCard,
        setPopupManager,
    }
};

export default usePhase3Manager;