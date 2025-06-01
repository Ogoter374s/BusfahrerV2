
// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useRef, useState } from 'react';
import { useParams } from "react-router-dom";

const useSpectatorManager = () => {
    const init = useRef(false);
    const { gameId } = useParams();

    const [isSpectator, setIsSpectator] = useState(false);
    const [spectators, setSpectators] = useState([]);

    const fetchIsSpectator = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}is-spectator?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            const isSpec = await response.json();
            setIsSpectator(isSpec);
        } catch (error) {
            console.error('Error checking spectator status:', error);
        }
    };

    const fetchSpectators = async () => {
        try {
            const response = await fetch(`${BASE_URL}get-spectators/${gameId}`, {
                credentials: 'include',
            });

            const data = await response.json();

            setSpectators(data.spectators);
        } catch (error) {
            console.error('Error fetching spectators:', error);
        }
    };

    useEffect(() => {
        if(init.current) return;
        init.current = true;

        fetchIsSpectator();
        fetchSpectators();
    }, [gameId]);

    return {
        isSpectator,
        setSpectators,
        spectators,
    };
};

export default useSpectatorManager;