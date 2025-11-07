/**
 * @fileoverview Custom hook to manage user statistics state and labels.
 * <br><br>
 * This hook provides a state variable for user statistics and a predefined list of statistic labels.<br>
 * It uses the `useState` hook to manage the statistics state.
 */

// Utilities
import { statLabels } from '../utils/constants';

// React
import { useState } from 'react';

/**
 * Custom hook that provides user statistics state and predefined statistic labels.
 * <br><br>
 * This hook uses the `useState` hook to manage the statistics state. <br>
 * It also defines a list of statistic labels that can be used to display user statistics in the UI.
 * <br><br>
 * @function useStatistics
 * @return {Object} An object containing: <br>
 * - `statistics`: The current statistics state. <br>
 * - `setStatistics`: Function to update the statistics state. <br>
 * - `statLabels`: An array of objects defining statistic keys and their corresponding labels.
 */
const useStatistics = () => {
    const [statistics, setStatistics] = useState({});

    return {
        statistics,
        setStatistics,
        
        statLabels,
    };
};

export default useStatistics;