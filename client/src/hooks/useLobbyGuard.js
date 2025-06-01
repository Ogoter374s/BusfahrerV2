
// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const useLobbyGuard = () => {
    const [isLobbyAuthenticated, setIsLobbyAuthenticated] = useState(false);
    const { gameId } = useParams();
    const navigate = useNavigate();

    const checkLobbyAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}check-lobby-auth/${gameId}`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (!data.isLobbyAuthenticated) {
                navigate('/lobbys', { replace: true });
            }

            setIsLobbyAuthenticated(data.isLobbyAuthenticated);
        } catch (error) {
            console.error('Error checking lobby authentication:', error);
            setIsLobbyAuthenticated(false);
            navigate('/lobbys', { replace: true });
        }
    };

    useEffect(() => {
        checkLobbyAuth();
    }, [navigate]);

    return isLobbyAuthenticated;
};