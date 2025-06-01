
// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const useGameGuard = () => {
    const [isGameAuthenticated, setIsGameAuthenticated] = useState(false);
    const { gameId } = useParams();
    const navigate = useNavigate();

    const checkGameAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}check-game-auth/${gameId}`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (!data.isGameAuthenticated) {
                navigate('/lobbys', { replace: true });
            }

            setIsGameAuthenticated(data.isGameAuthenticated);
        } catch (error) {
            console.error('Error checking game authentication:', error);
            setIsGameAuthenticated(false);
            navigate('/lobbys', { replace: true });
        }
    };

    useEffect(() => {
        checkGameAuth();
    }, [navigate]);

    return isGameAuthenticated;
};