
// Hooks
import useWebSocketConnector from './useWebSocketConnector';
import usePlayerCards from './usePlayerCards';
import useGameCards from './useGameCards';
import useGameInfo from './useGameInfo';
import useBusfahrer from './useBusfahrer';
import useSpectatorManager from './useSpectatorManager';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

// React
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

let PopupManager = null;
const usePhase2Manager = () => {
    const phase = 2;

    const init = useRef(false);
    const { gameId } = useParams();
    const navigate = useNavigate();

    const {
        playerCards,
        fetchPlayerCards,
    } = usePlayerCards();

    const {
        gameCards,
        setGameCards,
        fetchGameCards,
    } = useGameCards();

    const {
        busfahrerName,
        setBusfahrerName,
        fetchBusfahrer,
    } = useBusfahrer();

    const {
        currentName,
        isCurrentPlayer,
        fetchCurrentPlayer,
        drinkCount,
        fetchDrinkCount,
        isNextPhase,
        currentRound,
        fetchRound,
        allCardsPlayed,
        fetchAllCardsPlayed,
        hasToEx,
        fetchHasToEx,
    } = useGameInfo(2);

    const {
        isSpectator,
    } = useSpectatorManager();

    const setPopupManager = (pm) => {
        PopupManager = pm;
    };

    useEffect(() => {
        if(init.current) return;
        init.current = true;

        fetchPlayerCards();
        fetchGameCards(phase);

        fetchRound();
        fetchCurrentPlayer();
        fetchDrinkCount();

        fetchAllCardsPlayed();
        fetchHasToEx();
        
        fetchBusfahrer();
    }, [navigate]);

    useWebSocketConnector("subscribe", {gameId}, (message) => {
        if (message.type == 'playersUpdate') {
            fetchPlayerCards();

            fetchDrinkCount();
            fetchHasToEx();
        }

        if (message.type === 'cardsUpdate') {
            setGameCards(message.data.phaseCards);
        }

        if (message.type === 'drinkUpdate') {
            fetchDrinkCount();
        }

        if (message.type === 'gameUpdate') {
            fetchRound();
            fetchCurrentPlayer();

            fetchAllCardsPlayed();
            fetchHasToEx();

            setBusfahrerName(message.data.busfahrerName);
        }

        if (message.type === 'close') {
            PopupManager.showPopup({
                title: "Game Closed",
                message: "The Game has been closed by the Game Master.",
                icon: '❌',
                to: '/lobbys',
            });
        }

        if (message.type === 'phase3') {
            navigate(`/phase3/${gameId}`);
        }
    });

    const handleLayCard = async (cardIdx) => {
        if (currentRound !== 2 && !isCurrentPlayer) {
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}lay-card-phase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ gameId, cardIdx }),
            });

            const data = await res.json();

            if (res.ok) {
                if( data.error?.length < 0 ) {
                    SoundManager.playClickSound();
                }
            } else {
                throw new Error(`Failed to lay card: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Error laying card:', error);
        }
    };

    return {
        playerCards,
        gameCards,
        currentName,
        isCurrentPlayer,
        drinkCount,
        isNextPhase,
        currentRound,
        allCardsPlayed,
        hasToEx,
        busfahrerName,
        isSpectator,
        setPopupManager,
        handleLayCard,
    }
};

export default usePhase2Manager;