/**
 * @fileoverview This module defines constants used across the application,
 * including card themes and statistic labels.
 * <br><br>
 * <strong>drinkQuotes:</strong> <br>
 * An array of humorous drink-related quotes used for branding.
 * <br><br>
 * <strong>cardThemes:</strong> <br>
 * An array of available card themes, each with a name and path.
 * <br><br>
 * <strong>statLabels:</strong> <br>
 * An array of statistic labels used for displaying user statistics.
 * <br><br>
 * <strong>achievLabels:</strong> <br>
 * An object mapping statistic keys to human-readable labels.
 * <br><br>
 * <strong>shuffleStyles:</strong> <br>
 * An array of available shuffle styles for card shuffling.
 * <br><br>
 * <strong>cardMatchStyles:</strong> <br>
 * An array of available card match styles for gameplay.
 * <br><br>
 * <strong>turnModes:</strong> <br>
 * An array of available turn modes for gameplay.
 * <br><br>
 * <strong>busfahrerSelectionMode:</strong> <br>
 * An array of available Busfahrer selection modes for gameplay.
 * <br><br>
 * <strong>schluckGiveMode:</strong> <br>
 * An array of available Schluck give modes for gameplay.
 * <br><br>
 * <strong>PLAYER_GENDER:</strong> <br>
 * An object defining player gender constants used across the application. <br>
 * These constants are used to standardize player gender representation across the application.
 * If you change these, make sure to change them in server/constants/defaultKeys.js as well
 * <br><br>
 * <strong>playerActionFeatures:</strong> <br>
 * A function that generates an array of player action feature configurations
 * based on the game manager state and lobby ID.
 */

// Features
import NewGameButton from "../features/NewGameButton";
import NextPhaseButton from "../features/NextPhaseButton";
import NextPlayerButton from "../features/NextPlayerButton";
import RetryButton from "../features/RetryButton";

/**
 * Predefined list of drink-related quotes. <br>
 * These quotes are humorous and related to coding and drinking culture,
 * adding a fun element to the game's branding.
 */
export const drinkQuotes = [
    "Don't drink and code 🍺",
    'Ctrl + Brew 🍻',
    'Debug responsibly!',
    'Commit, push, exen 🍷',
    'Drunk on features!',
    'Refactoring with rum!',
    'Ship it and sip it!',
    'Code hard, drink harder 🍹',
    'Escape() to the pub',
    'Raise a glass, not exceptions!',
    "Import beer from 'fridge' 🍺",
    "console.beer('Cheers!')",
    'While(alive) { drink(); } 🍻',
    'Docs and Draughts 📖🍺',
    'Your build is buzzed 🛠️🍷',
    'Async, await... another round 🍻',
    '404: Beer Not Found 🚫🍺',
    'Happy hour = merge conflicts 🍹',
    'Git pull, then pour 🍾',
    'Deploy, then decant 🍷',
    'Ping me at the pub 🍻',
    'TypeError: Too sober to function 🥴',
    'sudo apt-get install beer 🍺',
    'brew install chill 🍺',
    'Add shot; commit; blame 🥃',
];

/**
 * Predefined list of card themes. <br>
 * Each object in the array contains a `name` for display purposes and a `path` for referencing the theme. <br>
 * This list is used to allow users to select different visual themes for cards in the application.
 */
export const cardThemes = [
    { name: 'Classic', path: 'default' },
    { name: 'Bricks', path: 'bricks' },
    { name: 'Hexagon', path: 'hexagon' },
    { name: 'Shingles', path: 'shingles' },
    { name: 'Square', path: 'square' },
    { name: 'Leafs', path: 'leafs' },
];

/**
 * Predefined list of statistic labels. <br>
 * Each object in the array contains a `key` corresponding to a statistic and a `label` for display purposes. <br>
 * This list is used to render user statistics in the UI.
 */
export const statLabels = [
    { key: 'gamesPlayed', label: 'Games Played' },
    { key: 'gamesBusfahrer', label: 'Games Busfahrer' },
    { key: 'drinksGiven', label: 'Schlucke Given' },
    { key: 'drinksSelf', label: 'Schlucke Self' },
    { key: 'numberEx', label: 'Number Exen' },
    { key: 'maxDrinksGiven', label: 'Max. Schlucke Given' },
    { key: 'maxDrinksSelf', label: 'Max. Schlucke Self' },
    { key: 'maxCardsSelf', label: 'Max. Cards Number' },
    { key: 'layedCards', label: 'Layed Cards' },
    { key: 'gamesJoined', label: 'Games Joined' },
    { key: 'dailyLoginStreak', label: 'Daily Login Streak' },
    { key: 'gamesHosted', label: 'Games Hosted' },
    { key: 'rowsFlipped', label: 'Rows Flipped' },
    { key: 'topDrinker', label: 'Top Drinker' },
    { key: 'topDrinks', label: 'Top Drinks' },
    { key: 'gamesWon', label: 'Games Won' },
    { key: 'cardsPlayedPhase1', label: 'Cards Played Phase 1' },
    { key: 'cardsLeft', label: 'Cards Left' },
    { key: 'phase3Failed', label: 'Phase 3 Failed' },
    { key: 'maxRounds', label: 'Max. Rounds' },
    { key: 'changedTheme', label: 'Changed Theme' },
    { key: 'changedSound', label: 'Changed Sound' },
    { key: 'uploadedAvatar', label: 'Uploaded Avatar' },
    { key: 'gotKicked', label: 'Got Kicked' },
    { key: 'playersKicked', label: 'Players Kicked' },
    { key: 'drinksReceived', label: 'Drinks Received' },
    { key: 'maxDrinksReceived', label: 'Max. Drinks Received' },
    { key: 'friends', label: 'Friends' },
    { key: 'friendsAdded', label: 'Friends Added' },
    { key: 'friendsRemoved', label: 'Friends Removed' },
    { key: 'friendsMessagesReceived', label: 'Messages Received' },
    { key: 'friendsMessagesSent', label: 'Messages Sent' },
    { key: 'friendsRequestsReceived', label: 'Requests Received' },
    { key: 'friendsRequestsSent', label: 'Requests Sent' },
];

/**
 * Mapping of statistic keys to human-readable labels. <br>
 * This object is used to convert statistic keys into more user-friendly labels when displaying statistics in the UI.
 */
export const achievLabels = {
    gamesJoined: 'Joined Games',
    gamesPlayed: 'Games Played',
    drinksGiven: 'Drinks Given',
    drinksSelf: 'Drinks Self',
    numberEx: 'Number of Ex',
    maxDrinksGiven: 'Max Drinks Given',
    maxDrinksSelf: 'Max Drinks Self',
    maxCardsSelf: 'Max Cards Held',
    layedCards: 'Cards Laid',
    dailyLoginStreak: 'Daily Login Streak',
    gamesHosted: 'Games Hosted',
    topDrinker: 'Top Drinker',
    rowsFlipped: 'Rows Flipped',
    cardsPlayedPhase1: 'Cards Played Phase 1',
    cardsLeft: 'Cards Left',
    phase3Failed: 'Failed Phase 3',
    gamesWon: 'Games Won',
    maxRounds: 'Phase 3 Rounds',
    changedTheme: 'Changed the Theme',
    changedSound: 'Changed the Sound',
    uploadedAvatar: 'Uploaded an Avatar',
};

/**
 * Predefined list of shuffle styles. <br>
 * Each object in the array contains a `name` for display purposes and a `type` for referencing the shuffle style. <br>
 * This list is used to allow users to select different shuffle styles for card shuffling.
 */
export const shuffleStyles = [
    { name: "Normal", type: "Fisher-Yates" },
    { name: "Chaotic", type: "Chaotic" },
    { name: "Riffle", type: "Riffle" },
];

/**
 * Predefined list of card match styles. <br>
 * Each object in the array contains a `name` for display purposes and a `type` for referencing the card match style. <br>
 * This list is used to allow users to select different card match styles for gameplay.
 */
export const cardMatchStyles = [
    { name: "Number-only", type: "Number-only" },
    { name: "Type-only", type: "Type-only" },
    { name: "Exact", type: "Exact" },
];

/**
 * Predefined list of turn modes. <br>
 * Each object in the array contains a `name` for display purposes and a `type` for referencing the turn mode. <br>
 * This list is used to allow users to select different turn modes for gameplay.
 */
export const turnModes = [
    { name: "Default", type: "Default" },
    { name: "Reverse", type: "Reverse" },
    { name: "Random", type: "Random" },
];

/**
 * Predefined list of Busfahrer selection modes. <br>
 * Each object in the array contains a `name` for display purposes and a `type` for referencing the selection mode. <br>
 * This list is used to allow users to select different Busfahrer selection modes for gameplay.
 */
export const busfahrerSelectionMode = [
    { name: "Default", type: "Default" },
    { name: "Reversed", type: "Reverse" },
    { name: "Random", type: "Random" },
];

/**
 * Predefined list of Schluck give modes. <br>
 * Each object in the array contains a `name` for display purposes and a `type` for referencing the give mode. <br>
 * This list is used to allow users to select different Schluck give modes for gameplay.
 */
export const schluckGiveMode = [
    { name: "Default", type: "Default" },
    { name: "Per Avatar", type: "Avatar" },
];

/**
 * Predefined player gender constants. <br>
 * These constants are used to standardize player gender representation across the application.
 * If you change these, make sure to change them in server/constants/defaultKeys.js as well
*/
export const PLAYER_GENDER = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
};

/**
 * Generates an array of player action feature configurations based on the game manager state and lobby ID. <br>
 * Each feature configuration includes a key, component, visibility condition, and props. <br>
 * This function is used to dynamically create the set of player action features available in the game UI.
 */
export const playerActionFeatures = (manager, lobbyId) => [
    {
        key: 'nextPlayer',
        component: NextPlayerButton,
        visible: manager?.phase !== 3 && !manager?.nextPhaseEnabled,
        props: {
            lobbyId,
            canClick: manager?.nextPlayerEnabled
        }
    },
    {
        key: 'nextPhase',
        component: NextPhaseButton,
        visible: manager?.phase !== 3 && manager?.nextPhaseEnabled,
        props: {
            lobbyId,
            canClick: manager?.nextPhaseEnabled,
        }
    },
    {
        key: 'retry',
        component: RetryButton,
        visible: manager?.phase === 3 && !manager?.gameOver,
        props: {
            lobbyId,
            canClick: manager?.tryOver,
        }
    }, 
    {
        key: 'newGame',
        component: NewGameButton,
        visible: manager?.phase === 3 && manager?.gameOver,
        props: {
            lobbyId,
            canClick: manager?.gameOver && manager?.isGameMaster,
        }
    }
];

export const REWARD_TYPES = {
    TITLE: 'title',
    FRAME: 'frame',
    PERK: 'perk',
    NONE: 'none',
}

export const SOUND_TYPES = {
    CLICK: 'click',
    LAY_CARD: 'layCard',
    ROW_FLIP: 'flipRow',
    EX: 'ex',
    WIN: 'win',
    LOSE: 'lose',
};