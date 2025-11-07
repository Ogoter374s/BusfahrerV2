/**
 * @fileoverview Custom hook to guard lobby routes by checking lobby authentication.
 * <br><br>
 * This hook checks if the user is authenticated to access a specific lobby by making a request to the server.<br>
 * If the user is not authenticated for the lobby, it redirects them to the lobby selection page.<br>
 * It uses the `useEffect` hook to perform the lobby authentication check when the component mounts.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Custom hook that checks lobby authentication status and redirects if not authenticated.
 * <br><br>
 * This hook performs an API call to check if the user is authenticated for the specified lobby. <br>
 * If the user is not authenticated for the lobby, it redirects them to the lobby selection page. <br>
 * It uses the `useEffect` hook to run the lobby authentication check when the component mounts.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * The `useEffect` hook is used to call the `checkLobbyAuth` function when the component mounts. <br>
 * This ensures that the lobby authentication status is checked immediately after the component is rendered. <br>
 * If the user is not authenticated for the lobby, they are redirected to the lobby selection page using the `useNavigate` hook.
 * <br><br>
 * <strong>checkLobbyAuth:</strong> <br>
 * The `checkLobbyAuth` function makes a GET request to the server to check the lobby authentication status. <br>
 * If the response indicates that the user is not authenticated for the lobby, it sets the `isLobbyAuthenticated`
 * state to `false` and redirects the user to the lobby selection page. <br>
 * If the user is authenticated for the lobby, it sets the `isLobbyAuthenticated` state to `true`.
 * 
 * @function useLobbyGuard
 * @return {boolean} isLobbyAuthenticated - Indicates whether the user is authenticated for the lobby or not.
 */
export const useLobbyGuard = () => {
    const [isLobbyAuthenticated, setIsLobbyAuthenticated] = useState(false);
    const { lobbyId } = useParams();
    const navigate = useNavigate();

    /**
     * Checks the lobby authentication status of the user.
     * This function makes a GET request to the server to verify if the user is authenticated for the specified lobby.
     * If the user is not authenticated for the lobby, it redirects them to the lobby selection page.
     * If the user is authenticated for the lobby, it updates the `isLobbyAuthenticated` state.
     */
    const checkLobbyAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}check-lobby-auth/${lobbyId}`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (!data.isLobbyAuthenticated) {
                navigate('/lobbies', { replace: true });
            }

            setIsLobbyAuthenticated(data.isLobbyAuthenticated);
        } catch (error) {
            console.error('Error checking lobby authentication:', error);
            setIsLobbyAuthenticated(false);
            navigate('/lobbies', { replace: true });
        }
    };

    /**
     * useEffect hook that runs the lobby authentication check when the component mounts.
     * This ensures that the lobby authentication status is verified immediately after the component is rendered.
     */
    useEffect(() => {
        checkLobbyAuth();
    }, [navigate]);

    return isLobbyAuthenticated;
};