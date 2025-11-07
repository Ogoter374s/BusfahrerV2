/**
 * @fileoverview Default data constants for user and game statistics.
 * This file defines the default values for user statistics, titles,
 * and game statistics used in the application.
 */

// Utilities
import { USER_KEYS, GAME_KEYS } from './defaultKeys.js';

/**
 * Default statistics object initialized with zero values for each user key.
 * This object is created by mapping over the USER_KEYS and setting each key's value to 0.
 */
export const defaultStatistics = Object.fromEntries(
  Object.values(USER_KEYS).map(key => [key, 0])
);

/**
 * Default title array with a single title object.
 * The title has a name, color, and active status.
 */
export const defaultTitle = [
    {
        name: 'None',
        color: '#f5deb3',
        active: true,
    },
];

/**
 * Default game statistics object initialized with specific default values.
 * This object includes statistics for top drinker, drinks per player, and rounds per player.
 * Each statistic is initialized with appropriate default values.
 * The drinks per player and rounds per player statistics are initialized as empty arrays.
 * The top drinker statistic is initialized with a drink count of 0 and an empty ID.
 * The default values ensure that the game statistics are ready for use without additional initialization.
 */
export const defaultGameStatistics = {
    [GAME_KEYS.TOP_DRINKER]: { drinks: 0, id: ""},
    [GAME_KEYS.DRINKS_PER_PLAYER]: [],
    [GAME_KEYS.ROUNDS_PER_PLAYER]: [],
}

/**
 * Array of drink conditions based on card numbers.
 * Each condition specifies a card number, its type, and the number of drinks associated with it.
 * This array is used to determine the drinking rules based on the drawn card.
 * For example, drawing a Jack (11) requires 1 drink, a Queen (12) requires 1 drink, and a King (13) requires 1 drink.
 * These conditions can be expanded or modified to include additional card types and their associated drink rules.
 */
export const drinkConditions = [
    {
        condition: (card) => card.number === 11,
        type: "JACK",
        drinks: 1,
    },
    {
        condition: (card) => card.number === 12,
        type: "QUEEN",
        drinks: 1,
    },
    {
        condition: (card) => card.number === 13,
        type: "KING",
        drinks: 1,
    }
];