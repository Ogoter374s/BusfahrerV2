/**
 * useStatistics.js — Custom hook for managing user statistics.
 *
 * Loads user statistics from the backend and provides local state access for display components.
 * Intended for use in account/profile pages or statistic overlays.
 */

// React
import { useState } from 'react';

/**
 * useStatistics hook function.
 *
 * Fetches the user's statistics on mount and stores them in local state.
 * Exposes both the statistics and a manual refresh function for reuse.
 *
 * @function useStatistics
 * @returns {Object} Statistic handling object:
 *   {Object} statistics - Key-value mapping of stat names to values.
 *   {Function} fetchStatistics - Function to manually reload statistics from the backend.
 */
const useStatistics = () => {
    const [statistics, setStatistics] = useState({});

    const statLabels = [
        { key: 'gamesPlayed', label: 'Games Played' },
        { key: 'gamesBusfahrer', label: 'Games Busfahrer' },
        { key: 'drinksGiven', label: 'Schlucke Given' },
        { key: 'maxDrinksGiven', label: 'Max. Schlucke Given' },
        { key: 'drinksSelf', label: 'Schlucke Self' },
        { key: 'maxDrinksSelf', label: 'Max. Schlucke Self' },
        { key: 'numberEx', label: 'Number Exen' },
        { key: 'maxCardsSelf', label: 'Max. Cards Number' },
    ];

    /**
     * Returns the statistics hook state and configuration.
     *
     * Provides access to user statistic values, a setter for external updates,
     * and a list of display label mappings used in statistic components.
     *
     * @returns {Object} Statistics management object:
     *   {Object} statistics - Object mapping stat keys to their numeric values.
     *   {Function} setStatistics - Setter to manually update the statistics state.
     *   {Array<Object>} statLabels - Array of { key, label } pairs for display formatting.
     */
    return {
        statistics,
        setStatistics,
        statLabels,
    };
};

export default useStatistics;