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

export const GAME_PERKS = {
    HALF_PENALTY: { name: 'Half Penalty', icon: 'perk_half.svg', description: 'Drink only half the amount of drinks you would normally have to drink.' },
    IGNORE_PENALTY: { name: 'Ignore Penalty', icon: 'perk_ignore.svg', description: 'Completely ignore one drinking penalty during the game.' },
    DOUBLE_PENALTY: { name: 'Double Penalty', icon: 'perk_double.svg', description: 'Choose one player to drink double the amount of drinks they would normally have to drink.' },

    REMOVE_CARD: { name: 'Remove Card', icon: 'perk_remove.svg', description: 'Remove one card from your hand during phase 1.' },
    THIRD_MULTIPLY: { name: 'Third Multiply', icon: 'perk_third.svg', description: 'In phase 1 one card you lay can be multiplied by 3' },
    LAY_ANYTIME: { name: 'Lay Anytime', icon: 'perk_anytime.svg', description: 'You can lay cards at any time during phase 1.' },

    BLOCK_PLAYER: { name: 'Block Player', icon: 'perk_block.svg', description: 'Block one player from playing cards during phase 1.' },
    SWAP_HANDS: { name: 'Swap Hands', icon: 'perk_swap.svg', description: 'Swap your hand with another player during phase 1.' },
    EXTRA_BUSFAHRER: { name: 'Extra Busfahrer', icon: 'perk_extra.svg', description: 'Choose an additional player to be Busfahrer during phase 3.' },

    GODLY_GLOW: { name: 'Godly Glow', icon: 'perk_godly.svg', description: 'All cards that can be played emit a godly glow.' },
    XP_BOOST_1: { name: 'XP Boost I', icon: 'perk_xp1.svg', description: 'Earn 5% more XP from this game.' },
    XP_BOOST_2: { name: 'XP Boost II', icon: 'perk_xp2.svg', description: 'Earn 10% more XP from this game.' },
    XP_BOOST_3: { name: 'XP Boost III', icon: 'perk_xp3.svg', description: 'Earn 15% more XP from this game.' },
    TEAM_PLAYER: { name: 'Team Player', icon: 'perk_team.svg', description: 'Games with a Friend yield 10% more XP.' },
    SPEEDRUNNER: { name: 'Speedrunner', icon: 'perk_speed.svg', description: 'Games shorter than 10 minutes yield 20% more XP.' },
    INSIDE_LOOK: { name: 'Inside Look', icon: 'perk_second.svg', description: 'In phase 1 you can check any card one time.' },
    LUCKY_TOUCH: { name: 'Lucky Touch', icon: 'perk_lucky.svg', description: 'You have a 5% chance to double all drinks given and received.' },
    ALWAYS_TOP: { name: 'Always Top', icon: 'perk_always.svg', description: 'In phase 3 equal counts as higher or lower depending on your choice.' },
    IRON_STOMACH: { name: 'Iron Stomach', icon: 'perk_iron.svg', description: 'Always drink 1 sip less.' },
    NO_YOU: { name: 'No You', icon: 'perk_noyou.svg', description: 'Once per game when you would have to drink, choose another player to drink instead.' },
    THIRST_BREAK: { name: 'Thirst Break', icon: 'perk_thirst.svg', description: 'Once per game you can half the amount of drinks you have to take.' },
    HYDRATED_BREW: { name: 'Hydrated Brew', icon: 'perk_hydrated.svg', description: 'If you have to drink 5+ sips, you get 10% more XP.' },
    SURVIVORS_EDGE: { name: 'Survivor\'s Edge', icon: 'perk_survivor.svg', description: 'If you are Busfahrer you have to drink 10% less.' },
    PENALTY_GUARD: { name: 'Penalty Guard', icon: 'perk_guard.svg', description: 'In phase 1 and 2 you allways have to drink 3 sips less.' },
    TURN_ANCHOR: { name: 'Turn Anchor', icon: 'perk_anchor.svg', description: 'You can\'t get blocked and skipped.' },
    PATTERN_READER: { name: 'Pattern Reader', icon: 'perk_pattern.svg', description: 'In phase 1 you know the most common card in the pyramid.' },
    SHIELDED_START: { name: 'Shielded Start', icon: 'perk_shielded.svg', description: 'You start with one card less.' },
    FULL_HOUSE: { name: 'Full House', icon: 'perk_fullhouse.svg', description: 'If you have over 8 cards, your drinks given are doubled.' },
   LOCKED_HAND: { name: 'Locked Hand', icon: 'perk_locked.svg', description: 'Your cards can\'t be swapped or taken by other players.' },
    RESHUFFLE: { name: 'Reshuffle', icon: 'perk_reshuffle.svg', description: 'Once per game you can reshuffle your hand.' },
    SELF_DEFENSE_CLASS: { name: 'Self Defense Class', icon: 'perk_selfdefense.svg', description: 'In phase 2 you have to drink 10% less.' },
    SKILL_ISSUE: { name: 'Skill Issue', icon: 'perk_skillissue.svg', description: 'Once per game you can down your drink and receive 20 drinks to give.' },
    TEQUILA_TRUBBLE: { name: 'Tequila Trubble', icon: 'perk_tequila.svg', description: 'Once per phase you can give a player a shot to drink.' },
    SKIPPER: { name: 'Skipper', icon: 'perk_skipper.svg', description: 'Once per phase you can skip your drink.' },
}

export const GAME_MODIFIERS = {
    DRINK_PENALTY: { id: 0, name: 'Drink Penalty', icon: 'luck_penalty.svg', description: 'Decrease the drink penalty by 1 a certain percentage of time', multiplier: 2.5 },
    BETTER_CARDS: { id: 1, name: 'Better Cards', icon: 'luck_better.svg', description: 'Increase the chance of drawing cards that are in the first phase', multiplier: 2.5 },
    SKIP_DRINK: { id: 2, name: 'Skip Drink', icon: 'luck_skip.svg', description: 'Skip the drink penalty during the game', multiplier: 1.25 },
    EXTRA_DRINK: { id: 3, name: 'Extra Drink', icon: 'luck_extra.svg', description: 'Increase the drinks to give by 1 a certain percentage of time', multiplier: 2.5 },
    RETRY_ROW: { id: 4, name: 'Retry Row', icon: 'luck_retry.svg', description: 'Get one additional attempt to flip the row correctly in phase 3', multiplier: 1.25 },
    LUCKY_MATCH: { id: 5, name: 'Lucky Match', icon: 'luck_match.svg', description: 'If a card is only 1 of the number, the higher and lower is counted correctly in phase 3', multiplier: 1.25 },
    LUCKY_SIP: { id: 6, name: 'Lucky Sip', icon: 'luck_sip.svg', description: 'If you have to drink over 10 sips, you only have to drink 10 sips', multiplier: 0.75 },

    CARD_LESS: { id: 7, name: 'Less Cards', icon: 'skill_less.svg', description: 'Start phase 1 with less cards in your hand', multiplier: 2.5 },
    DRINK_DOUBLE: { id: 8, name: 'Double Cards', icon: 'skill_double.svg', description: 'Give double the amount of drinks when you have to lay cards', multiplier: 2.5 },
    PENALTY_SENDER: { id: 9, name: 'Penalty Sender', icon: 'skill_sender.svg', description: 'If a player gives you drinks, he gets one sip back', multiplier: 2.5 },
    PENALTY_HALF: { id: 10, name: 'Half Penalty', icon: 'skill_half.svg', description: 'If you have to receive drinks, you only have to drink half the amount', multiplier: 1.25 },
    RANDOM_SWAP: { id: 11, name: 'Random Swap', icon: 'skill_swap.svg', description: 'Once per turn, swap one card with a random player', multiplier: 1.25 },
    SIP_INSTEAD: { id: 12, name: 'Sip Instead', icon: 'skill_sip.svg', description: 'Instead of downing your drinks, you only have to drink 10 sips', multiplier: 0.75 },
    CARD_NUMBER: { id: 13, name: 'Card Number', icon: 'skill_number.svg', description: 'Once per turn, if you lay a card the number of the card will be multiplied with the amount of drinks you can give', multiplier: 0.75 },

    LESS_SELF: { id: 14, name: 'Less Self', icon: 'focus_lessself.svg', description: 'In phase 2, drink less drinks yourself', multiplier: 2.5 },
    PLAY_LESS : { id: 15, name: 'Play Less', icon: 'focus_playless.svg', description: 'In phase 1, one random player can play fewer cards', multiplier: 2.5 },
    END_DRINKS: { id: 16, name: 'End Drinks', icon: 'focus_enddrinks.svg', description: 'In phase 3, at the end if you beat the game, other players have to drink extra', multiplier: 2.5 },
    NO_GENDER: { id: 17, name: 'No Gender', icon: 'focus_nogender.svg', description: 'Players with your gender have to drink extra', multiplier: 1.25 },
    FLIP_PERCENTAGE: { id: 18, name: 'Flip Percentage', icon: 'focus_flip.svg', description: 'Show sometimes the percentage of higher or lower in phase 3', multiplier: 1.25 },
    NEW_CARD: { id: 19, name: 'New Card', icon: 'focus_newcard.svg', description: 'Once per game, a random player gets a new card in phase 1', multiplier: 1.25 },
    PLAYER_MULTIPLY: { id: 20, name: 'Player Multiply', icon: 'focus_player.svg', description: 'In phase 1 or 2 a player has randomly their drink count multiplied by 2', multiplier: 0.75 },
}

export const GAME_TITLES = {
    NEWCOMER: { name: 'Newcomer', color: '#4CAF50'},
    PASSENGER: { name: 'Passenger', color: '#2196F3'},
    ALCOHOLIC: { name: 'Alcoholic', color: '#FFC107'},
    HUMBLE_HOST: { name: 'Humble Host', color: '#9C27B0'},
    BUSDRIVER: { name: 'Busdriver', color: '#E91E63'},
    SIPPER: { name: 'Sipper', color: '#00BCD4'},
    SOAKED: { name: 'Soaked', color: '#607D8B'},
    CHUG_JUGGER: { name: 'Chug Jugger', color: '#34ffe6'},
    TANKED_UP: { name: 'Tanked Up', color: '#0c300e'},
    DISTRIBUTOR: { name: 'Distributor', color: '#8BC34A'},
    MASTER_OF_ROUNDS: { name: 'Master of Rounds', color: '#946a1c'},
    GIFT_OF_BOOZE: { name: 'Gift of Booze', color: '#c90e0e'},
    HEAVY_HITTER: { name: 'Heavy Hitter', color: '#FF9800'},
    GULPZILLA: { name: 'Gulpzilla', color: '#795548'},
    CARD_PRO: { name: 'Card Pro', color: '#3F51B5'},
    FLIP_DADDY: { name: 'Flip Daddy', color: '#607D8B'},
    DECK_DIGGER: { name: 'Deck Digger', color: '#673AB7'},
    SIR_DRINKS_A_LOT: { name: 'Sir Drinks-a-Lot', color: '#FFC107'},
    CARDEMON_MASTER: { name: 'Cardemon Master', color: '#3F51B5'},
    DRAW_0: { name: 'Draw 0', color: '#009688'},
    THE_DRIVER: { name: 'The Driver', color: '#FF5722'},
    ROAD_WARRIOR: { name: 'Road Warrior', color: '#9C27B0'},
    WHEELS_OF_FATE: { name: 'Wheels of Fate', color: '#E91E63'},
    LONDON_BRIDGE_DOWN: { name: 'London Bridge Down', color: '#9E9E9E'},
    ONE_WAY_LEGEND: { name: 'One Way Legend', color: '#009688'},
    THE_ENDLESS_RIDE: { name: 'The Endless Ride', color: '#CDDC39'},
    THE_DOOMED: { name: 'The Doomed', color: '#3F51B5'},
    SURVIVOR: { name: 'Survivor', color: '#00E676'},
    LAST_SIP_STANDING: { name: 'Last Sip Standing', color: '#a55ced'},
    BUSSBLESSED: { name: 'Bussblessed', color: '#bcc2eb'},
    ESCAPE_THE_BUS: { name: 'Escape the Bus', color: '#6adec7'},
    SMOOTH_OPERATOR: { name: 'Smooth Operator', color: '#FFD700'},
    THE_DRIP_MASTER: { name: 'The Drip Master', color: '#F06292'},
    DJ_BIG_SHROOM: { name: 'DJ Big Shroom', color: '#BA68C8'},
    FACE_OF_FAME: { name: 'Face of Fame', color: '#FFD54F'},
    FULLY_DRIPPED: { name: 'Fully Dripped', color: '#4DD0E1'},
    STRATEGIC_WAITER: { name: 'Strategic Waiter', color: '#FFC107'},
    
    BABY_SIPS: { name: 'Baby Sips', color: '#9EE6FF'},
    SIP_STARTER: { name: 'Sip Starter', color: '#7EE87F'},
    MISCH_MISCHER: { name: 'Misch-Mischer', color: '#D2B6FF'},
    THROAT_TITAN: { name: 'Throat Titan', color: '#FF6A4D'},
    THE_FLOWMASTER: { name: 'The Flowmaster', color: '#4DD4FF'},
    PARCHED_PROPHET: { name: 'Parched Prophet', color: '#F0C46D'},
    DRINK_DOMINATOR: { name: 'Drink Dominator', color: '#E8567C'},
    GOBBLET_GUARDIAN: { name: 'Gobblet Guardian', color: '#7F96FF'},
    CHAOS_NAVIGATOR: { name: 'Chaos Navigator', color: '#FF9D3B'},
    THE_DRINK_REAPER: { name: 'The Drink Reaper', color: '#B84EFF'},
    BUSFAHRER_PRIME: { name: 'Busfahrer Prime', color: '#FFD447'},
}

export const GAME_FRAMES = {
    LEVEL_10: {name: 'Level 10 Frame', icon: 'level_10.png'},
    LEVEL_20: {name: 'Level 20 Frame', icon: 'level_20.png'},
    LEVEL_30: {name: 'Level 30 Frame', icon: 'level_30.png'},
    LEVEL_40: {name: 'Level 40 Frame', icon: 'level_40.png'},
    LEVEL_50: {name: 'Level 50 Frame', icon: 'level_50.png'},
    LEVEL_60: {name: 'Level 60 Frame', icon: 'level_60.png'},
    LEVEL_70: {name: 'Level 70 Frame', icon: 'level_70.png'},
    LEVEL_80: {name: 'Level 80 Frame', icon: 'level_80.png'},
    LEVEL_90: {name: 'Level 90 Frame', icon: 'level_90.png'},
    LEVEL_100: {name: 'Level 100 Frame', icon: 'level_100.png'},
}

export const REWARD_TYPES = {
    TITLE: 'title',
    FRAME: 'frame',
    PERK: 'perk',
    NONE: 'none',
}

export const SOUND_KEYS = {
    CLICK: 'click',
    LAY_CARD: 'layCard',
    FLIP_ROW: 'flipRow',
    EX: 'ex',
    WIN: 'win',
    LOSE: 'lose',
}