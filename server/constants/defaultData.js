/**
 * @fileoverview Default data constants for user and game statistics.
 * This file defines the default values for user statistics, titles,
 * and game statistics used in the application.
 */

// Utilities
import { USER_KEYS, GAME_KEYS, GAME_PERKS, GAME_MODIFIERS, GAME_TITLES, GAME_FRAMES, REWARD_TYPES, SOUND_KEYS } from './defaultKeys.js';

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
    [GAME_KEYS.TOP_DRINKER]: { drinks: 0, id: "" },
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

export const upgradeGird = {
    luck: [
        { id: 1, unlocked: false, x: '1', y: '1', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },

        { id: 2, unlocked: false, x: '2', y: '1', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.BETTER_CARDS },
        { id: 3, unlocked: false, x: '2', y: '2', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },
        { id: 4, unlocked: false, x: '2', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.BETTER_CARDS },

        { id: 5, unlocked: false, x: '3', y: '1', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.SKIP_DRINK },
        { id: 6, unlocked: false, x: '3', y: '2', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.BETTER_CARDS },
        { id: 7, unlocked: false, x: '3', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },
        { id: 8, unlocked: false, x: '3', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.BETTER_CARDS },
        { id: 9, unlocked: false, x: '3', y: '5', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.SKIP_DRINK },

        { id: 10, unlocked: false, x: '4', y: '1', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.EXTRA_DRINK },
        { id: 11, unlocked: false, x: '4', y: '2', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.SKIP_DRINK },
        { id: 12, unlocked: false, x: '4', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },
        { id: 13, unlocked: false, x: '4', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },
        { id: 14, unlocked: false, x: '4', y: '5', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },
        { id: 15, unlocked: false, x: '4', y: '6', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.SKIP_DRINK },
        { id: 16, unlocked: false, x: '4', y: '7', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.EXTRA_DRINK },

        { id: 17, unlocked: false, x: '5', y: '1', value: 0, type: 'perk', perk: GAME_PERKS.DOUBLE_PENALTY },
        { id: 18, unlocked: false, x: '5', y: '2', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.RETRY_ROW },
        { id: 19, unlocked: false, x: '5', y: '3', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.LUCKY_MATCH },
        { id: 20, unlocked: false, x: '5', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },
        { id: 21, unlocked: false, x: '5', y: '5', value: 0, type: 'perk', perk: GAME_PERKS.HALF_PENALTY },
        { id: 22, unlocked: false, x: '5', y: '6', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_PENALTY },
        { id: 23, unlocked: false, x: '5', y: '7', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.LUCKY_MATCH },
        { id: 24, unlocked: false, x: '5', y: '8', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.LUCKY_SIP },
        { id: 25, unlocked: false, x: '5', y: '9', value: 0, type: 'perk', perk: GAME_PERKS.IGNORE_PENALTY },
    ],
    skill: [
        { id: 1, unlocked: false, x: '1', y: '1', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },

        { id: 2, unlocked: false, x: '2', y: '1', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_DOUBLE },
        { id: 3, unlocked: false, x: '2', y: '2', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },
        { id: 4, unlocked: false, x: '2', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_DOUBLE },

        { id: 5, unlocked: false, x: '3', y: '1', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.PENALTY_SENDER },
        { id: 6, unlocked: false, x: '3', y: '2', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_DOUBLE },
        { id: 7, unlocked: false, x: '3', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },
        { id: 8, unlocked: false, x: '3', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.DRINK_DOUBLE },
        { id: 9, unlocked: false, x: '3', y: '5', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.PENALTY_SENDER },

        { id: 10, unlocked: false, x: '4', y: '1', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.PENALTY_HALF },
        { id: 11, unlocked: false, x: '4', y: '2', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.PENALTY_SENDER },
        { id: 12, unlocked: false, x: '4', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },
        { id: 13, unlocked: false, x: '4', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },
        { id: 14, unlocked: false, x: '4', y: '5', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },
        { id: 15, unlocked: false, x: '4', y: '6', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.PENALTY_SENDER },
        { id: 16, unlocked: false, x: '4', y: '7', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.PENALTY_HALF },

        { id: 17, unlocked: false, x: '5', y: '1', value: 0, type: 'perk', perk: GAME_PERKS.THIRD_MULTIPLY },
        { id: 18, unlocked: false, x: '5', y: '2', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.SIP_INSTEAD },
        { id: 19, unlocked: false, x: '5', y: '3', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.RANDOM_SWAP },
        { id: 20, unlocked: false, x: '5', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },
        { id: 21, unlocked: false, x: '5', y: '5', value: 0, type: 'perk', perk: GAME_PERKS.REMOVE_CARD },
        { id: 22, unlocked: false, x: '5', y: '6', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.CARD_LESS },
        { id: 23, unlocked: false, x: '5', y: '7', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.RANDOM_SWAP },
        { id: 24, unlocked: false, x: '5', y: '8', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.CARD_NUMBER },
        { id: 25, unlocked: false, x: '5', y: '9', value: 0, type: 'perk', perk: GAME_PERKS.LAY_ANYTIME },
    ],
    focus: [
        { id: 1, unlocked: false, x: '1', y: '1', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },

        { id: 2, unlocked: false, x: '2', y: '1', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.PLAY_LESS },
        { id: 3, unlocked: false, x: '2', y: '2', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },
        { id: 4, unlocked: false, x: '2', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.PLAY_LESS },

        { id: 5, unlocked: false, x: '3', y: '1', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.END_DRINKS },
        { id: 6, unlocked: false, x: '3', y: '2', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.PLAY_LESS },
        { id: 7, unlocked: false, x: '3', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },
        { id: 8, unlocked: false, x: '3', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.PLAY_LESS },
        { id: 9, unlocked: false, x: '3', y: '5', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.END_DRINKS },

        { id: 10, unlocked: false, x: '4', y: '1', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.NO_GENDER },
        { id: 11, unlocked: false, x: '4', y: '2', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.END_DRINKS },
        { id: 12, unlocked: false, x: '4', y: '3', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },
        { id: 13, unlocked: false, x: '4', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },
        { id: 14, unlocked: false, x: '4', y: '5', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },
        { id: 15, unlocked: false, x: '4', y: '6', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.END_DRINKS },
        { id: 16, unlocked: false, x: '4', y: '7', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.NO_GENDER },

        { id: 17, unlocked: false, x: '5', y: '1', value: 0, type: 'perk', perk: GAME_PERKS.SWAP_HANDS },
        { id: 18, unlocked: false, x: '5', y: '2', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.NEW_CARD },
        { id: 19, unlocked: false, x: '5', y: '3', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.FLIP_PERCENTAGE },
        { id: 20, unlocked: false, x: '5', y: '4', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },
        { id: 21, unlocked: false, x: '5', y: '5', value: 0, type: 'perk', perk: GAME_PERKS.BLOCK_PLAYER },
        { id: 22, unlocked: false, x: '5', y: '6', value: 1, type: 'modifier', modifier: GAME_MODIFIERS.LESS_SELF },
        { id: 23, unlocked: false, x: '5', y: '7', value: 2, type: 'modifier', modifier: GAME_MODIFIERS.FLIP_PERCENTAGE },
        { id: 24, unlocked: false, x: '5', y: '8', value: 3, type: 'modifier', modifier: GAME_MODIFIERS.PLAYER_MULTIPLY },
        { id: 25, unlocked: false, x: '5', y: '9', value: 0, type: 'perk', perk: GAME_PERKS.EXTRA_BUSFAHRER },
    ]
}

export const levelSystem = [
    { level: 1, xpRequired: 100, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.BABY_SIPS },
    { level: 2, xpRequired: 283, type: REWARD_TYPES.NONE, reward: null, },
    { level: 3, xpRequired: 519, type: REWARD_TYPES.NONE, reward: null, },
    { level: 4, xpRequired: 800, type: REWARD_TYPES.PERK, reward: GAME_PERKS.GODLY_GLOW, },
    { level: 5, xpRequired: 1118, type: REWARD_TYPES.NONE, reward: null, },
    { level: 6, xpRequired: 1470, type: REWARD_TYPES.NONE, reward: null, },
    { level: 7, xpRequired: 1852, type: REWARD_TYPES.NONE, reward: null, },
    { level: 8, xpRequired: 2263, type: REWARD_TYPES.PERK, reward: GAME_PERKS.SPEEDRUNNER, },
    { level: 9, xpRequired: 2699, type: REWARD_TYPES.NONE, reward: null, },
    { level: 10, xpRequired: 3162, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_10, },
    { level: 11, xpRequired: 3648, type: REWARD_TYPES.NONE, reward: null, },
    { level: 12, xpRequired: 4157, type: REWARD_TYPES.PERK, reward: GAME_PERKS.TEAM_PLAYER, },
    { level: 13, xpRequired: 4687, type: REWARD_TYPES.NONE, reward: null, },
    { level: 14, xpRequired: 5237, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.SIP_STARTER, },
    { level: 15, xpRequired: 5809, type: REWARD_TYPES.NONE, reward: null, },
    { level: 16, xpRequired: 6399, type: REWARD_TYPES.PERK, reward: GAME_PERKS.XP_BOOST_1, },
    { level: 17, xpRequired: 7008, type: REWARD_TYPES.NONE, reward: null, },
    { level: 18, xpRequired: 7634, type: REWARD_TYPES.PERK, reward: GAME_PERKS.INSIDE_LOOK, },
    { level: 19, xpRequired: 8277, type: REWARD_TYPES.NONE, reward: null, },
    { level: 20, xpRequired: 8944, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_20, },
    { level: 21, xpRequired: 9630, type: REWARD_TYPES.NONE, reward: null, },
    { level: 22, xpRequired: 10340, type: REWARD_TYPES.PERK, reward: GAME_PERKS.PATTERN_READER, },
    { level: 23, xpRequired: 11067, type: REWARD_TYPES.NONE, reward: null, },
    { level: 24, xpRequired: 11820, type: REWARD_TYPES.PERK, reward: GAME_PERKS.IRON_STOMACH, },
    { level: 25, xpRequired: 12599, type: REWARD_TYPES.NONE, reward: null, },
    { level: 26, xpRequired: 13401, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.MISCH_MISCHER, },
    { level: 27, xpRequired: 14226, type: REWARD_TYPES.NONE, reward: null, },
    { level: 28, xpRequired: 15075, type: REWARD_TYPES.PERK, reward: GAME_PERKS.SURVIVORS_EDGE, },
    { level: 29, xpRequired: 15947, type: REWARD_TYPES.NONE, reward: null, },
    { level: 30, xpRequired: 16843, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_30, },
    { level: 31, xpRequired: 17760, type: REWARD_TYPES.NONE, reward: null, },
    { level: 32, xpRequired: 18699, type: REWARD_TYPES.PERK, reward: GAME_PERKS.LUCKY_TOUCH, },
    { level: 33, xpRequired: 19659, type: REWARD_TYPES.NONE, reward: null, },
    { level: 34, xpRequired: 20641, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.THROAT_TITAN, },
    { level: 35, xpRequired: 21642, type: REWARD_TYPES.NONE, reward: null, },
    { level: 36, xpRequired: 22664, type: REWARD_TYPES.PERK, reward: GAME_PERKS.ALWAYS_TOP, },
    { level: 37, xpRequired: 23705, type: REWARD_TYPES.NONE, reward: null, },
    { level: 38, xpRequired: 24766, type: REWARD_TYPES.NONE, reward: null, },
    { level: 39, xpRequired: 25846, type: REWARD_TYPES.NONE, reward: null, },
    { level: 40, xpRequired: 26945, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_40, },
    { level: 41, xpRequired: 28062, type: REWARD_TYPES.NONE, reward: null, },
    { level: 42, xpRequired: 29197, type: REWARD_TYPES.PERK, reward: GAME_PERKS.HYDRATED_BREW, },
    { level: 43, xpRequired: 30350, type: REWARD_TYPES.NONE, reward: null, },
    { level: 44, xpRequired: 31520, type: REWARD_TYPES.PERK, reward: GAME_PERKS.XP_BOOST_2, },
    { level: 45, xpRequired: 32707, type: REWARD_TYPES.NONE, reward: null, },
    { level: 46, xpRequired: 33910, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.THE_FLOWMASTER, },
    { level: 47, xpRequired: 35129, type: REWARD_TYPES.NONE, reward: null, },
    { level: 48, xpRequired: 36364, type: REWARD_TYPES.PERK, reward: GAME_PERKS.NO_YOU, },
    { level: 49, xpRequired: 37614, type: REWARD_TYPES.NONE, reward: null, },
    { level: 50, xpRequired: 38889, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_50, },
    { level: 51, xpRequired: 40178, type: REWARD_TYPES.NONE, reward: null, },
    { level: 52, xpRequired: 41482, type: REWARD_TYPES.PERK, reward: GAME_PERKS.THIRST_BREAK, },
    { level: 53, xpRequired: 42800, type: REWARD_TYPES.NONE, reward: null, },
    { level: 54, xpRequired: 44131, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.PARCHED_PROPHET, },
    { level: 55, xpRequired: 45476, type: REWARD_TYPES.NONE, reward: null, },
    { level: 56, xpRequired: 46833, type: REWARD_TYPES.PERK, reward: GAME_PERKS.PENALTY_GUARD, },
    { level: 57, xpRequired: 48203, type: REWARD_TYPES.NONE, reward: null, },
    { level: 58, xpRequired: 49585, type: REWARD_TYPES.NONE, reward: null, },
    { level: 59, xpRequired: 50980, type: REWARD_TYPES.NONE, reward: null, },
    { level: 60, xpRequired: 52387, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_60, },
    { level: 61, xpRequired: 53805, type: REWARD_TYPES.NONE, reward: null, },
    { level: 62, xpRequired: 55235, type: REWARD_TYPES.PERK, reward: GAME_PERKS.SKILL_ISSUE, },
    { level: 63, xpRequired: 56676, type: REWARD_TYPES.NONE, reward: null, },
    { level: 64, xpRequired: 58127, type: REWARD_TYPES.PERK, reward: GAME_PERKS.TURN_ANCHOR, },
    { level: 65, xpRequired: 59590, type: REWARD_TYPES.NONE, reward: null, },
    { level: 66, xpRequired: 61063, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.DRINK_DOMINATOR, },
    { level: 67, xpRequired: 62547, type: REWARD_TYPES.NONE, reward: null, },
    { level: 68, xpRequired: 64040, type: REWARD_TYPES.PERK, reward: GAME_PERKS.SELF_DEFENSE_CLASS, },
    { level: 69, xpRequired: 65544, type: REWARD_TYPES.NONE, reward: null, },
    { level: 70, xpRequired: 67057, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_70, },
    { level: 71, xpRequired: 68579, type: REWARD_TYPES.NONE, reward: null, },
    { level: 72, xpRequired: 70111, type: REWARD_TYPES.PERK, reward: GAME_PERKS.XP_BOOST_3, },
    { level: 73, xpRequired: 71651, type: REWARD_TYPES.NONE, reward: null, },
    { level: 74, xpRequired: 73199, type: REWARD_TYPES.NONE, reward: null, },
    { level: 75, xpRequired: 74756, type: REWARD_TYPES.NONE, reward: null, },
    { level: 76, xpRequired: 76321, type: REWARD_TYPES.PERK, reward: GAME_PERKS.SHIELDED_START, },
    { level: 77, xpRequired: 77893, type: REWARD_TYPES.NONE, reward: null, },
    { level: 78, xpRequired: 79473, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.GOBBLET_GUARDIAN, },
    { level: 79, xpRequired: 81060, type: REWARD_TYPES.NONE, reward: null, },
    { level: 80, xpRequired: 82654, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_80, },
    { level: 81, xpRequired: 84255, type: REWARD_TYPES.NONE, reward: null, },
    { level: 82, xpRequired: 85862, type: REWARD_TYPES.PERK, reward: GAME_PERKS.TEQUILA_TRUBBLE, },
    { level: 83, xpRequired: 87475, type: REWARD_TYPES.NONE, reward: null, },
    { level: 84, xpRequired: 89094, type: REWARD_TYPES.PERK, reward: GAME_PERKS.FULL_HOUSE, },
    { level: 85, xpRequired: 90719, type: REWARD_TYPES.NONE, reward: null, },
    { level: 86, xpRequired: 92349, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.CHAOS_NAVIGATOR, },
    { level: 87, xpRequired: 93984, type: REWARD_TYPES.NONE, reward: null, },
    { level: 88, xpRequired: 95625, type: REWARD_TYPES.PERK, reward: GAME_PERKS.LOCKED_HAND, },
    { level: 89, xpRequired: 97270, type: REWARD_TYPES.NONE, reward: null, },
    { level: 90, xpRequired: 98920, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_90, },
    { level: 91, xpRequired: 100574, type: REWARD_TYPES.NONE, reward: null, },
    { level: 92, xpRequired: 102233, type: REWARD_TYPES.PERK, reward: GAME_PERKS.RESHUFFLE, },
    { level: 93, xpRequired: 103895, type: REWARD_TYPES.NONE, reward: null, },
    { level: 94, xpRequired: 105562, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.THE_DRINK_REAPER, },
    { level: 95, xpRequired: 107232, type: REWARD_TYPES.NONE, reward: null, },
    { level: 96, xpRequired: 108906, type: REWARD_TYPES.PERK, reward: GAME_PERKS.SKIPPER, },
    { level: 97, xpRequired: 110583, type: REWARD_TYPES.NONE, reward: null, },
    { level: 98, xpRequired: 112263, type: REWARD_TYPES.NONE, reward: null, },
    { level: 99, xpRequired: 113947, type: REWARD_TYPES.TITLE, reward: GAME_TITLES.BUSFAHRER_PRIME, },
    { level: 100, xpRequired: 115634, type: REWARD_TYPES.FRAME, reward: GAME_FRAMES.LEVEL_100, },
]

export const userSounds = [
    { type: SOUND_KEYS.CLICK, name: 'ui-click.mp3', },
    { type: SOUND_KEYS.LAY_CARD, name: 'ui-click.mp3', },
    { type: SOUND_KEYS.FLIP_ROW, name: 'ui-click.mp3', },
    { type: SOUND_KEYS.EX, name: 'ui-click.mp3', },
    { type: SOUND_KEYS.WIN, name: 'ui-click.mp3', },
    { type: SOUND_KEYS.LOSE, name: 'ui-click.mp3', },
]

export const userUploadSounds = [
    { type: SOUND_KEYS.CLICK, name: '', },
    { type: SOUND_KEYS.LAY_CARD, name: '', },
    { type: SOUND_KEYS.FLIP_ROW, name: '', },
    { type: SOUND_KEYS.EX, name: '', },
    { type: SOUND_KEYS.WIN, name: '', },
    { type: SOUND_KEYS.LOSE, name: '', },
]