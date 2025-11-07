/**
 * @fileoverview Custom hook to guard game routes by checking game authentication.
 * <br><br>
 * This hook checks if the user is authenticated to access a specific game by making a request to the server.<br>
 * If the user is not authenticated for the game, it redirects them to the lobby selection page.<br>
 * It uses the `useEffect` hook to perform the game authentication check when the component mounts.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Custom hook that checks game authentication status and redirects if not authenticated.
 * <br><br>
 * This hook performs an API call to check if the user is authenticated for the specified game. <br>
 * If the user is not authenticated for the game, it redirects them to the lobby selection page. <br>
 * It uses the `useEffect` hook to run the game authentication check when the component mounts.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * The `useEffect` hook is used to call the `checkGameAuth` function when the component mounts. <br>
 * This ensures that the game authentication status is checked immediately after the component is rendered. <br>
 * If the user is not authenticated for the game, they are redirected to the lobby selection page using the `useNavigate` hook.
 * <br><br>
 * <strong>checkGameAuth:</strong> <br>
 * The `checkGameAuth` function makes a GET request to the server to check the game authentication status. <br>
 * If the response indicates that the user is not authenticated for the game, it sets the `isGameAuthenticated`
 * state to `false` and redirects the user to the lobby selection page. <br>
 * If the user is authenticated for the game, it sets the `isGameAuthenticated` state to `true`.
 * 
 * @function useGameGuard
 * @return {boolean} isGameAuthenticated - Indicates whether the user is authenticated for the game or not.
 */
export const useGameGuard = () => {
    const [isGameAuthenticated, setIsGameAuthenticated] = useState(false);
    const { lobbyId } = useParams();
    const navigate = useNavigate();

    /**
     * Checks the game authentication status of the user.
     * This function makes a GET request to the server to verify if the user is authenticated for the specified game.
     * If the user is not authenticated for the game, it redirects them to the lobby selection page.
     * If the user is authenticated for the game, it updates the `isGameAuthenticated` state.
     */
    const checkGameAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}check-game-auth/${lobbyId}`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (!data.isGameAuthenticated) {
                console.error("Game auth failed");
                navigate('/lobbies', { replace: true });
            }

            setIsGameAuthenticated(data.isGameAuthenticated);
        } catch (error) {
            console.error('Error checking game authentication:', error);
            setIsGameAuthenticated(false);
            navigate('/lobbies', { replace: true });
        }
    };

    /**
     * useEffect hook that runs the game authentication check when the component mounts.
     * If the user is not authenticated for the game, it redirects them to the lobby selection page.
     * The dependency array includes `navigate` to ensure the effect runs only once on mount.
     */
    useEffect(() => {
        checkGameAuth();
    }, [navigate]);

    return isGameAuthenticated;
};