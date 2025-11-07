/**
 * @fileoverview This file contains constant keys used for user and game statistics.
 * These keys are utilized throughout the application to reference specific statistics.
 * Each key is defined as a string to ensure consistency and avoid hardcoding values.
 * The keys cover a wide range of statistics, from games played to drinks given,
 * as well as various user actions and achievements.
 * By centralizing these keys in one file, we facilitate easier maintenance and updates.
 * If new statistics need to be tracked, they can be added here and referenced elsewhere in the codebase.
 * Make sure to keep this file synchronized with any client-side constants if applicable.
 */

/**
 * User statistics keys used to track various user-related metrics.
 * Each key corresponds to a specific statistic that can be recorded for a user.
 * These keys include metrics such as games joined, drinks given, friends added, and more.
 * They are defined as string constants to ensure consistency across the application.
 * When adding new user statistics, ensure to include the corresponding key here.
 * These keys are essential for maintaining accurate user profiles and tracking user activity.
 * They can be used in database schemas, API responses, and analytics.
 * Refer to this file whenever you need to access or modify user statistics.
 * Keep in mind that changes to these keys may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure data integrity.
 */
export const USER_KEYS = {
    GAMES_JOINED: 'gamesJoined',
    GAMES_PLAYED: 'gamesPlayed',
    GAMES_BUSFAHRER: 'gamesBusfahrer',
    DRINKS_GIVEN: 'drinksGiven',
    DRINKS_SELF: 'drinksSelf',
    NUMBER_EX: 'numberEx',
    MAX_DRINKS_GIVEN: 'maxDrinksGiven',
    MAX_DRINKS_SELF: 'maxDrinksSelf',
    MAX_CARDS_SELF: 'maxCardsSelf',
    LAYED_CARDS: 'layedCards',
    DAILY_LOGIN_STREAK: 'dailyLoginStreak',
    GAMES_HOSTED: 'gamesHosted',
    TOP_DRINKER: 'topDrinker',
    TOP_DRINKS: 'topDrinks',
    ROWS_FLIPPED: 'rowsFlipped',
    GAMES_WON: 'gamesWon',
    CARDS_LEFT: 'cardsLeft',
    PHASE3_FAILED: 'phase3Failed',
    MAX_ROUNDS: 'maxRounds',
    CHANGED_THEME: 'changedTheme',
    CHANGED_SOUND: 'changedSound',
    UPLOADED_AVATAR: 'uploadedAvatar',
    PLAYERS_KICKED: 'playersKicked',
    GOT_KICKED: 'gotKicked',
    DRINKS_RECEIVED: 'drinksReceived',
    MAX_DRINKS_RECEIVED: 'maxDrinksReceived',
    FRIENDS_ADDED: 'friendsAdded',
    FRIENDS_REMOVED: 'friendsRemoved',
    FRIENDS: 'friends',
    FRIENDS_REQUESTS_SENT: 'friendsRequestsSent',
    FRIENDS_REQUESTS_RECEIVED: 'friendsRequestsReceived',
    FRIENDS_MESSAGES_SENT: 'friendsMessagesSent',
    FRIENDS_MESSAGES_RECEIVED: 'friendsMessagesReceived',
    AVATAR_CHANGED: 'avatarChanged',
    TITLE_CHANGED: 'titleChanged',
    SPECTATOR_JOINED: 'spectatorJoined',
    LOBBY_LEFT: 'lobbyLeft',
    GAMES_LEFT: 'gamesLeft',
    MASTER_INHERITED: 'masterInherited',
    LOBBY_CREATED: 'lobbyCreated',
    LOBBY_JOINED: 'lobbyJoined',
    FRIENDS_REQUEST_DECLINED: 'friendsRequestDeclined',
    FRIENDS_REQUEST_ACCEPTED: 'friendsRequestAccepted',
    CARDS_PLAYED_PHASE1: 'cardsPlayedPhase1',
    CHAT_MESSAGES_SENT: 'chatMessagesSent',
    DRINKS_PHASE3: 'drinksPhase3',
}

/**
 * Game statistics keys used to track various game-related metrics.
 * Each key corresponds to a specific statistic that can be recorded for a game.
 * These keys include metrics such as top drinker, drinks per player, and rounds per player.
 * They are defined as string constants to ensure consistency across the application.
 * When adding new game statistics, ensure to include the corresponding key here.
 * These keys are essential for maintaining accurate game records and tracking game activity.
 * They can be used in database schemas, API responses, and analytics.
 * Refer to this file whenever you need to access or modify game statistics.
 * Keep in mind that changes to these keys may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure data integrity.
 */
export const GAME_KEYS = {
    TOP_DRINKER: 'topDrinker',
    DRINKS_PER_PLAYER: 'schluckePerPlayer',
    ROUNDS_PER_PLAYER: 'roundsPerPlayer',
}

/**
 * Player gender constants used to define possible gender options for players.
 * These constants include options for male, female, and other.
 * They are defined as string constants to ensure consistency across the application.
 * When referencing player gender, use these constants to avoid hardcoding values.
 * These constants are essential for maintaining accurate player profiles and ensuring inclusivity.
 * They can be used in database schemas, API responses, and user interfaces.
 * Refer to this file whenever you need to access or modify player gender options.
 * Keep in mind that changes to these constants may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure data integrity.
 * If you change these, make sure to change them in client/src/utils/constants.js as well.
 */
export const PLAYER_GENDER = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
}

/**
 * Player role constants used to define possible roles for players in a game.
 * These constants include options for master, player, and spectator.
 * They are defined as string constants to ensure consistency across the application.
 * When referencing player roles, use these constants to avoid hardcoding values.
 * These constants are essential for maintaining accurate game dynamics and ensuring proper role assignments.
 * They can be used in database schemas, API responses, and user interfaces.
 * Refer to this file whenever you need to access or modify player role options.
 * Keep in mind that changes to these constants may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure data integrity.
 */
export const PLAYER_ROLES = {
    MASTER: 'master',
    PLAYER: 'player',
    SPECTATOR: 'spectator',
}

/**
 * Lobby status constants used to define possible statuses for game lobbies.
 * These constants include options for waiting, full, and started.
 * They are defined as string constants to ensure consistency across the application.
 * When referencing lobby statuses, use these constants to avoid hardcoding values.
 * These constants are essential for maintaining accurate lobby states and ensuring proper game flow.
 * They can be used in database schemas, API responses, and user interfaces.
 * Refer to this file whenever you need to access or modify lobby status options.
 * Keep in mind that changes to these constants may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure data integrity.
 */
export const LOBBY_STATUS = {
    WAITING: 'waiting',
    FULL: 'full',
    STARTED: 'started',
}

/**
 * Game status constants used to define possible phases of a game.
 * These constants include options for phase1, phase2, phase3, and finished.
 * They are defined as string constants to ensure consistency across the application.
 * When referencing game statuses, use these constants to avoid hardcoding values.
 * These constants are essential for maintaining accurate game progression and ensuring proper phase transitions.
 * They can be used in database schemas, API responses, and user interfaces.
 * Refer to this file whenever you need to access or modify game status options.
 * Keep in mind that changes to these constants may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure data integrity.
 */
export const GAME_STATUS = {
    PHASE1: 'phase1',
    PHASE2: 'phase2',
    PHASE3: 'phase3',
    FINISHED: 'finished',
}

/**
 * Number of rounds for each game phase.
 * This constant object defines the number of rounds for phase 1, phase 2, and phase 3.
 * It is used to determine how many rounds should be played in each phase of the game.
 * These values are essential for maintaining consistent game rules and ensuring proper game flow.
 * Refer to this file whenever you need to access the number of rounds for each phase.
 * Keep in mind that changes to these values may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure game balance and integrity.
 */
export const PHASE_ROUNDS = {
    PHASE1: 6,
    PHASE2: 4,
    PHASE3: 9,
}

/**
 * Card action functions used to determine the relationship between two cards.
 * Each action is defined as a function that takes two card objects as parameters
 * and returns a boolean value based on the specified condition.
 * These actions include equal, unequal, same, lower, and higher.
 * They are essential for implementing game mechanics that depend on card comparisons.
 * Refer to this file whenever you need to access or modify card action logic.
 * Keep in mind that changes to these functions may require updates in other parts of the codebase.
 * Always test thoroughly after making modifications to ensure game functionality and integrity.
 */
export const CARD_ACTIONS = {
    equal: (card, lastCard) =>
        card.type === lastCard.type || card.number === lastCard.number,
    unequal: (card, lastCard) =>
        card.type !== lastCard.type && card.number !== lastCard.number,
    same: (card, lastCard) =>
        card.number === lastCard.number,
    lower: (card, lastCard) =>
        card.number < lastCard.number,
    higher: (card, lastCard) =>
        card.number > lastCard.number,
}