/**
 * useAuthGuard.js — Custom hook for managing user authentication status.
 *
 * Retrieves and returns the current user's authentication state from the backend.
 * Designed for conditionally rendering components and routes based on login state.
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useAuthGuard hook function.
 *
 * Initializes local state to store the authentication result.
 * Automatically checks authentication status on component mount.
 *
 * @function useAuthGuard
 * @returns {boolean} Whether the user is authenticated.
 */
export const useAuthGuard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    /**
     * checkAuth — Verifies the user's authentication status.
     *
     * Makes a request to the backend (e.g., /check-auth) using credentials.
     * Updates the state to reflect whether the user is currently logged in.
     *
     * @function checkAuth
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
     * useEffect — Runs once on component mount to validate authentication.
     *
     * Sends a fetch request to the backend to determine if the current user session is valid.
     * Updates the local auth state based on the response.
     */
    useEffect(() => {
        checkAuth();
    }, [navigate]);

    return isAuthenticated;
};
