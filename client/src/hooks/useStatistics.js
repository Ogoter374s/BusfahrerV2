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

    const formatStatistics = (stats) => {
        const playerStats = {
            drinksGiven: stats.drinksGiven,
            drinksSelf: stats.drinksSelf,
            numberEx: stats.numberEx,
            maxDrinksGiven: stats.maxDrinksGiven,
            maxDrinksSelf: stats.maxDrinksSelf,
            maxCardsSelf: stats.maxCardsSelf,
            layedCards: stats.layedCards,
            topDrinker: stats.topDrinker,
            topDrinks: stats.topDrinks,
            rowsFlipped: stats.rowsFlipped,
            cardsLeft: stats.cardsLeft,
            phase3Failed: stats.phase3Failed,
            maxRounds: stats.maxRounds,
            drinksReceived: stats.drinksReceived,
            maxDrinksReceived: stats.maxDrinksReceived,
            cardsPlayedPhase1: stats.cardsPlayedPhase1,
            drinksPhase3: stats.drinksPhase3,
        };

        const gameStats = {
            gamesJoined: stats.gamesJoined,
            gamesPlayed: stats.gamesPlayed,
            gamesBusfahrer: stats.gamesBusfahrer,
            gamesHosted: stats.gamesHosted,
            gamesWon: stats.gamesWon,
            playersKicked: stats.playersKicked,
            gotKicked: stats.gotKicked,
            spectatorJoined: stats.spectatorJoined,
            lobbyLeft: stats.lobbyLeft,
            gamesLeft: stats.gamesLeft,
            masterInherited: stats.masterInherited,
            lobbyCreated: stats.lobbyCreated,
            lobbyJoined: stats.lobbyJoined,
            chatMessagesSent: stats.chatMessagesSent,
        };

        const friendStats = {
            friendsAdded: stats.friendsAdded,
            friendsRemoved: stats.friendsRemoved,
            friends: stats.friends,
            friendsRequestsSent: stats.friendsRequestsSent,
            friendsRequestsReceived: stats.friendsRequestsReceived,
            friendsMessagesSent: stats.friendsMessagesSent,
            friendsMessagesReceived: stats.friendsMessagesReceived,
            friendsRequestDeclined: stats.friendsRequestDeclined,
            friendsRequestAccepted: stats.friendsRequestAccepted,
        };

        const cosmeticStats = {
            dailyLoginStreak: stats.dailyLoginStreak,
            changedTheme: stats.changedTheme,
            changedSound: stats.changedSound,
            uploadedAvatar: stats.uploadedAvatar,
            avatarChanged: stats.avatarChanged,
            titleChanged: stats.titleChanged,
        };

        const formattedStats = {
            playerStats,
            gameStats,
            friendStats,
            cosmeticStats,
        };

        setStatistics(formattedStats);
    }

    return {
        statistics,
        formatStatistics,
        statLabels,
    };
};

export default useStatistics;