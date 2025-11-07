/**
 * @fileoverview Utility functions for game logic.
 */

// Database
import { db } from '../database/mongoClient.js';

// Utilities
import { generateCode } from './helperUtils.js';

// Constants
import { PLAYER_GENDER } from '../constants/defaultKeys.js';

/**
 * Determines the next player based on the current turn mode.
 * @function getNextPlayer
 * @param {Array} players - Array of player objects.
 * @param {string} currentPlayer - ID of the current player.
 * @param {Array} turnOrder - Array of player IDs in turn order.
 * @param {string} turnMode - Current turn mode ('Default', 'Reverse', 'Random').
 * @returns {string} - ID of the next player.
 */
export function getNextPlayer(players, currentPlayer, turnOrder, turnMode) {
    const currentPlayerIdx = turnOrder.indexOf(currentPlayer);
    if (currentPlayerIdx === -1) {
        throw new Error('Current player not found in turn order');
    }

    let nextPlayerIdx;

    switch (turnMode) {
        case 'Reverse':
            nextPlayerIdx = (currentPlayerIdx - 1 + turnOrder.length) % turnOrder.length;
            players[currentPlayerIdx].turnInfo.hadTurn = true;
            break;
        case 'Random':
            players[currentPlayerIdx].turnInfo.hadTurn = true;

            const remainingPlayers = players.filter(p => !p.turnInfo.hadTurn);

            if (remainingPlayers.length === 0) {
                nextIndex = 0;
            } else {
                let randomPlayerIdx;
                do {
                    const randomIdx = Math.floor(Math.random() * remainingPlayers.length);
                    randomPlayerIdx = remainingPlayers[randomIdx].id;
                } while (randomPlayerIdx === turnOrder[currentPlayerIdx]);

                nextIndex = turnOrder.indexOf(randomPlayerIdx);
            }
            break;
        case 'Default':
        default:
            nextPlayerIdx = (currentPlayerIdx + 1) % turnOrder.length;
            players[currentPlayerIdx].turnInfo.hadTurn = true;
            break;
    }

    return turnOrder[nextPlayerIdx];
}

/**
 * Calculates the Busfahrer (bus driver) based on unplayed cards and game mode.
 * @function calculateBusfahrer
 * @param {Array} players - Array of player objects.
 * @param {string} mode - Current game mode ('Default', 'Reverse', 'Random').
 * @returns {Array} - Array of player IDs who are the Busfahrer.
 */
export function calculateBusfahrer(players, mode) {
    const cardCounts = players.map((player) => {
        const unplayed = player.cards.filter((card) => !card.played).length;
        return { id: player.id, count: unplayed };
    });

    const max = Math.max(...cardCounts.map(c => c.count));
    const min = Math.min(...cardCounts.map(c => c.count));

    switch (mode) {
        case 'Reverse':
            return cardCounts.filter(c => c.count === min).map(c => c.id);
        case 'Random':
            const randomIdx = Math.floor(Math.random() * players.length);
            return [players[randomIdx].id];
        case 'Default':
        default:
            return cardCounts.filter(c => c.count === max).map(c => c.id);
    }
}

/**
 * Calculates the number of drinks a player has to take based on their gender and drink types.
 * @function getPlayerDrinksPerGender
 * @param {string} gender - Player's gender ('male', 'female', 'other').
 * @param {Object} drinksPerType - Object with drink counts per type (e.g., { JACK: 2, QUEEN: 1, KING: 3 }).
 * @returns {number} - Total number of drinks the player has to take.
 */
export function getPlayerDrinksPerGender(gender, drinksPerType) {
    if (!drinksPerType) return 0;

    switch (gender) {
        case PLAYER_GENDER.MALE:
            return (drinksPerType.JACK || 0) + (drinksPerType.KING || 0);
        case PLAYER_GENDER.FEMALE:
            return (drinksPerType.QUEEN || 0) + (drinksPerType.KING || 0);
        case PLAYER_GENDER.OTHER:
            return (drinksPerType.JACK || 0) + (drinksPerType.QUEEN || 0) + (drinksPerType.KING || 0);
        default:
            return 0;
    }
}

/**
 * Generates a unique game lobby code.
 * @function generateUniqueGameCode
 * @returns {Promise<string>} - A promise that resolves to a unique lobby code.
 */
export async function generateUniqueGameCode() {
    const lobbyCollection = db.collection('lobbies');

    let code;
    let exists = true;

    while (exists) {
        code = generateCode(5);
        exists = await lobbyCollection.findOne({ lobbyCode: code });
    }

    return code;
}