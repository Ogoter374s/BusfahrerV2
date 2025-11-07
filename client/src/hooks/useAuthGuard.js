/**
 * @fileoverview Custom hook for authentication guard in React applications.
 * <br><br>
 * This hook checks if the user is authenticated by making a request to the server.<br>
 * If the user is not authenticated, it redirects them to the home page.<br>
 * It uses the `useEffect` hook to perform the authentication check when the component mounts.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook that checks user authentication status and redirects if not authenticated.
 * <br><br>
 * This hook performs an API call to check if the user is authenticated. <br>
 * If the user is not authenticated, it redirects them to the home page. <br>
 * It uses the `useEffect` hook to run the authentication check when the component mounts.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * The `useEffect` hook is used to call the `checkAuth` function when the component mounts. <br>
 * This ensures that the authentication status is checked immediately after the component is rendered. <br>
 * If the user is not authenticated, they are redirected to the home page using the `useNavigate` hook.
 * <br><br>
 * <strong>checkAuth:</strong> <br>
 * The `checkAuth` function makes a GET request to the server to check the authentication status. <br>
 * If the response indicates that the user is not authenticated, it sets the `isAuthenticated`
 * state to `false` and redirects the user to the home page. <br>
 * If the user is authenticated, it sets the `isAuthenticated` state to `true`.
 * 
 * @function useAuthGuard
 * @return {boolean} isAuthenticated - Indicates whether the user is authenticated or not.
 */
export const useAuthGuard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    /**
     * Checks the authentication status of the user.
     * This function makes a GET request to the server to verify if the user is authenticated.
     * If the user is not authenticated, it redirects them to the home page.
     * If the user is authenticated, it updates the `isAuthenticated` state.
     */
    const checkAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}check-auth`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (!data.isAuthenticated) {
                navigate('/', { replace: true });
            }

            setIsAuthenticated(data.isAuthenticated);
        } catch (error) {
            console.error('Error checking authentication:', error);
            setIsAuthenticated(false);
            navigate('/', { replace: true });
        }
    };

    /**
     * useEffect hook that runs the authentication check when the component mounts.
     * This ensures that the authentication status is verified immediately after the component is rendered.
     * If the user is not authenticated, they are redirected to the home page.
     */
    useEffect(() => {
        checkAuth();
    }, [navigate]);

    return isAuthenticated;
};
