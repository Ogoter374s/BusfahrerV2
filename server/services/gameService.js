/**
 * @fileoverview Game Service
 * <br><br>
 * This file contains service functions for game-related operations. <br>
 * It includes functions to fetch game settings, check spectator status, retrieve game players, player cards, game cards, 
 * drink information, game information, player information, and Busfahrer (Game Master) details. <br>
 * It also includes functions to give drinks to players, flip rows, lay cards, check card actions, advance to the next player, retry Phase 3, open a new game, and leave the game.
 */

import WebSocket from 'ws';
import { ObjectId } from 'mongodb';

// Database
import { db, updateStatistics } from '../database/mongoClient.js';

// WebSocket
import { gameConnections } from "../websockets/connectionMaps.js";

// Constants
import { GAME_STATUS, PHASE_ROUNDS, PLAYER_ROLES, USER_KEYS, GAME_KEYS, CARD_ACTIONS, LOBBY_STATUS } from '../constants/defaultKeys.js';
import { drinkConditions } from '../constants/defaultData.js';

// Utilities
import { checkCardMatch, createDeck } from '../utils/deckUtils.js';
import { getNextPlayer, calculateBusfahrer, getPlayerDrinksPerGender } from '../utils/gameUtils.js';
import { logTrace } from '../utils/logger.js';

/**
 * Fetches the game settings for the specified game ID.
 * <br><br>
 * 
 * @function getGameSettings
 * @param {string} gameId - The ID of the game.
 * @returns {object} An object containing the game settings.
 */
async function getGameSettings(gameId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { settings: 1, status: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    // Only return settings relevant for the client
    const result = {
        giving: game.status === GAME_STATUS.PHASE1 && game.settings.giving === "Avatar"
    };

    return { settings: result };
}

/**
 * Checks if a user is a spectator in the specified game.
 * <br><br>
 * 
 * @function checkIsSpectator
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user.
 * @returns {object} An object containing a boolean indicating if the user is a spectator.
 */
async function checkIsSpectator(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { spectators: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const isSpectator = game.spectators?.some((spectator) => spectator.id === userId);

    return { isSpectator };
}

/**
 * Fetches the list of players in the specified game along with their active status and drinks per player.
 * <br><br>
 * 
 * @function getGamePlayers
 * @param {string} gameId - The ID of the game.
 * @returns {object} An object containing the list of players with their details.
 */
async function getGamePlayers(gameId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, gameInfo: 1, status: 1, settings: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const players = game.players.map((player) => {
        let isActive = game.gameInfo?.activePlayer === player.id || false;

        // All players are active in phase 2 round 2
        if (game.status === GAME_STATUS.PHASE2 && game.gameInfo?.roundNr === 2) {
            isActive = true;
        }

        const drinks = player?.turnInfo?.drinksPerPlayer || 0;

        return {
            id: player.id,
            name: player.name,
            avatar: player.avatar,
            title: player.title,
            drinksPerPlayer: drinks,
            active: isActive,
        };
    });

    return { players };
}

/**
 * Fetches the player cards for the specified game ID and user ID.
 * <br><br>
 * 
 * @function getPlayerCards
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user.
 * @returns {object} An object containing the list of player cards.
 */
async function getPlayerCards(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, spectators: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const isSpectator = game.spectators?.some((spectator) => spectator.id === userId);

    if (isSpectator) {
        return { cards: [] };
    }

    const player = game.players.find(p => p.id === userId);

    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    return { cards: player.cards || [] };
}

/**
 * Fetches the game cards for the specified game ID.
 * <br><br>
 * 
 * @function getGameCards
 * @param {string} gameId - The ID of the game.
 * @returns {object} An object containing the list of game cards.
 */
async function getGameCards(gameId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { cards: 1, status: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    return { cards: game.cards };
}

/**
 * Fetches drink-giving information for the specified game ID and user ID.
 * <br><br>
 * 
 * @function getDrinkInfo
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user.
 * @returns {object} An object containing drink-giving related information.
 */
async function getDrinkInfo(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, settings: 1, gameInfo: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    let given = true;
    let canUp = false;
    let canDown = false;

    // Only the active player can give drinks
    if (game.gameInfo.activePlayer !== userId) {
        return { given, canUp, canDown };
    }

    if (game.settings.giving === "Avatar") {
        const totalGiven = game.players.reduce((sum, player) => {
            return sum + player.drinks;
        }, 0);

        given = totalGiven >= game.gameInfo.drinksPerRound;
    }

    const totalDrinksGiven = game.players.reduce((sum, p) => sum + p.drinks, 0);

    if (totalDrinksGiven < game.gameInfo.drinksPerRound) {
        canUp = true;
    }

    if (totalDrinksGiven > 0) {
        canDown = true;
    }

    return { given, canUp, canDown };
}

/**
 * Fetches game information for the specified game ID and user ID. <br>
 * It provides details about the current phase, player and drink rows, and various game states.
 * <br> <br>
 * 
 * @function getGameInfo
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user.
 * @returns {object} An object containing game information and states.
 */
async function getGameInfo(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { status: 1, gameInfo: 1, players: 1, settings: 1, status: 1, spectators: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    // Check if user is in the game as a player or spectator
    const isSpectator = game.spectators?.some((spectator) => spectator.id === userId);
    const player = game.players.find(p => p.id === userId);
    if (!player && !isSpectator) {
        throw { status: 404, message: 'Player not found' };
    }

    // Determine current phase
    let status = -1;
    switch (game.status) {
        case GAME_STATUS.PHASE1:
            status = 1;
            break;
        case GAME_STATUS.PHASE2:
            status = 2;
            break;
        case GAME_STATUS.PHASE3:
            status = 3;
            break;
        default:
            status = -1;
            break;
    }

    const playerRow = {
        name: "",
        info: ""
    }

    const drinkRow = {
        name: "",
        info: ""
    }

    if (game.status === GAME_STATUS.PHASE3) {
        if (!game.gameInfo.busfahrer) {
            throw { status: 404, message: 'Busfahrer not found' };
        }

        if (game.gameInfo.activePlayer === null) {
            playerRow.info = "Ein Spieler muss die ";
            drinkRow.name = "erste ";
            drinkRow.info = "Karte aufdecken";
        } else {
            let player = game.players.find(p => p.id === game.gameInfo.activePlayer);
            if (!player) {
                throw { status: 404, message: 'Player not found' };
            }

            playerRow.name = player.name + " ";
            playerRow.info = "versucht eine Runde zu ";
            drinkRow.name = "überleben";

            if (game.gameInfo.tryOver) {
                playerRow.info = "muss ";
                drinkRow.name = game.gameInfo.drinksPerTry + " ";
                drinkRow.info = "Schlucke trinken";
            }

            if (game.gameInfo.gameOver) {
                playerRow.info = "hat das Spiel ";
                drinkRow.name = "überlebt";
                drinkRow.info = "";
            }
        }

        return {
            playerRow,
            drinkRow,
            phase: status,
            currentRow: game.gameInfo.currentRow,
            tryOver: game.gameInfo.tryOver,
            gameOver: game.gameInfo.gameOver,
        };
    }

    const activePlayer = game.players.find(p => p.id === game.gameInfo.activePlayer);
    if (!activePlayer) {
        throw { status: 404, message: 'Active player not found' };
    }

    let nextPlayerEnabled = false;
    let nextPhaseEnabled = false;

    if (game.status === GAME_STATUS.PHASE1) {
        playerRow.name = activePlayer.name + " ";
        playerRow.info = "darf";
        drinkRow.name = game.gameInfo.drinksPerRound + " ";
        drinkRow.info = "Schlucke verteilen";

        if (!game.gameInfo.isRowFlipped && activePlayer.role === PLAYER_ROLES.MASTER) {
            playerRow.info = "muss die ";
            drinkRow.name = "Reihe ";
            drinkRow.info = "aufdecken";
        }

        if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE1) {
            playerRow.name = "Phase 2 ";
            playerRow.info = "kann";
            drinkRow.name = "gestartet ";
            drinkRow.info = "werden!";
        }
    }

    if (game.status === GAME_STATUS.PHASE2) {
        playerRow.name = activePlayer.name + " ";
        playerRow.info = "muss";
        drinkRow.name = game.gameInfo.drinksPerRound + " ";
        drinkRow.info = "Schlucke trinken";

        if (game.gameInfo.roundNr === 2) {
            if (!isSpectator) {
                playerRow.name = player.name + " ";
                playerRow.info = "muss";
                drinkRow.name = getPlayerDrinksPerGender(player.gender, game.gameInfo.drinksPerType) + " ";
                drinkRow.info = "Schlucke trinken";
            } else {
                playerRow.name = "";
                playerRow.info = "";
                drinkRow.name = "";
                drinkRow.info = "";
            }
        }

        if (game.gameInfo.roundNr === 3) {
            playerRow.info = "muss das Glas";
            drinkRow.name = game.gameInfo.hasToDown[activePlayer.id] > 0 ? "exen " : "nicht exen ";
            drinkRow.info = "";
        }

        if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE2) {
            playerRow.name = "Phase 3 ";
            playerRow.info = "kann";
            drinkRow.name = "gestartet ";
            drinkRow.info = "werden!";
        }
    }

    if (isSpectator) {
        return {
            playerRow,
            drinkRow,
            nextPlayerEnabled: false,
            nextPhaseEnabled: false,
            phase: status
        };
    }

    if (player.id === game.gameInfo.activePlayer) {
        nextPlayerEnabled = true;

        if (game.status === GAME_STATUS.PHASE1) {
            if (player.role === PLAYER_ROLES.MASTER && !game.gameInfo.isRowFlipped) {
                nextPlayerEnabled = false;
            }

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE1) {
                nextPlayerEnabled = true;
                nextPhaseEnabled = true;
            }
        }

        if (game.status === GAME_STATUS.PHASE2) {
            let unplayedCards = player.cards.filter(c => !c.played);
            if (game.gameInfo.roundNr === 1) {
                unplayedCards = unplayedCards.filter(c => c.number >= 2 && c.number <= 10);
            }

            if (game.gameInfo.roundNr === 2) {
                unplayedCards = game.players
                    .flatMap(player => player.cards)
                    .filter(c => !c.played && c.number >= 11 && c.number <= 13);
            }

            if (game.gameInfo.roundNr === 3) {
                unplayedCards = unplayedCards.filter(c => c.number === 14);
            }

            nextPlayerEnabled = unplayedCards.length <= 0;

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE2) {
                nextPlayerEnabled = true;
                nextPhaseEnabled = true;
            }
        }
    }

    return {
        playerRow,
        drinkRow,
        phase: status,
        nextPlayerEnabled,
        nextPhaseEnabled,
    };
}

/**
 * Fetches player information such as game master status and current player status. <br>
 * This function makes a GET request to the server to retrieve player-related data. <br>
 * It updates the `isGameMaster`, `isCurrentPlayer`, and `drinksReceived` state variables based on the response.
 * 
 * @function getPlayerInfo
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user.
 * @returns {object} An object containing player information and states.
 */
async function getPlayerInfo(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, gameInfo: 1, settings: 1, spectators: 1, status: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    // If user is a spectator, return default values
    const isSpectator = game.spectators?.some((spectator) => spectator.id === userId);
    if (isSpectator) {
        return {
            isGameMaster: false,
            isCurrentPlayer: false,
            drinksReceived: 0,
        };
    }

    const player = game.players.find(p => p.id === userId);
    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    if (game.status === GAME_STATUS.PHASE3) {
        let currentPlayer = true;
        if (game.gameInfo.activePlayer !== null) {
            currentPlayer = game.gameInfo.activePlayer === userId;
        }

        return {
            isGameMaster: player.role === PLAYER_ROLES.MASTER,
            isCurrentPlayer: currentPlayer,
        }
    }

    let drinksReceived = 0;
    if (game.settings.giving === "Avatar") {
        drinksReceived = player.turnInfo.drinksPerPlayer;
    }

    let currentPlayer = game.gameInfo.activePlayer === userId;
    if (game.status === GAME_STATUS.PHASE2) {
        if (game.gameInfo.roundNr == 2) {
            currentPlayer = true;
        }
    }

    return {
        isGameMaster: player.role === PLAYER_ROLES.MASTER,
        isCurrentPlayer: currentPlayer,
        drinksReceived
    };
}

/**
 * Fetches the names of the "Busfahrer" players for the specified game ID and user ID. <br>
 * This function retrieves the names of the players assigned as "Busfahrer" in the game. <br>
 * If the requesting user is a spectator, it returns only the names of the "Busfahrer" players. <br>
 * Otherwise, it returns the names of the "Busfahrer" players as a concatenated string.
 * 
 * @function getBusfahrer
 * @param {string} gameId - The ID of the game.
 * @returns {object} An object containing the names of the "Busfahrer" players.
 */
async function getBusfahrer(gameId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    if (game.status !== GAME_STATUS.PHASE2 && game.status !== GAME_STATUS.PHASE3) {
        throw { status: 400, message: 'Game is not in the correct phase' };
    }

    const busfahrerPlayers = game.gameInfo.busfahrer.map((id) => {
        const player = game.players.find((p) => p.id === id);
        if (!player) {
            throw { status: 404, message: 'Player not found' };
        }
        return player.name;
    });

    return { busfahrerName: busfahrerPlayers.join(" & ") };
}

/**
 * Gives or takes drinks from a specified player in the game. <br>
 * This function updates the drink count for a player based on the increment value provided. <br>
 * It also updates the statistics for both the user giving/taking drinks and the player receiving them.
 * <br>><br>
 * 
 * @function giveDrinkToPlayer
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user giving/taking drinks.
 * @param {string} playerId - The ID of the player receiving drinks.
 * @param {number} inc - The increment value (positive to give drinks, negative to take drinks).
 * @returns {object} An object indicating the success of the operation.
 */
async function giveDrinkToPlayer(gameId, userId, playerId, inc) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, gameInfo: 1, settings: 1, activePlayer: 1, statistics: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    if (game.activePlayer !== userId) {
        throw { status: 403, message: 'Not your turn' };
    }

    const totalDrinksGiven = game.players.reduce((sum, p) => sum + p.drinks, 0);

    if (totalDrinksGiven >= game.gameInfo.drinksPerRound || totalDrinksGiven <= 0) {
        throw { status: 400, message: 'No more drinks can be given/taken' };
    }

    const player = game.players.find(p => p._id === playerId);
    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    await gamesCollection.updateOne(
        { _id: new ObjectId(gameId), 'players._id': playerId },
        { $inc: { 'players.$.turnInfo.drinksPerPlayer': inc } }
    );

    await updateStatistics(userId, {
        [USER_KEYS.DRINKS_GIVEN]: { inc: inc },
    });

    await updateStatistics(playerId, {
        [USER_KEYS.DRINKS_RECEIVED]: { inc: inc },
    });

    return { success: true };
}

/**
 * Flips a row of cards in the specified game. <br>
 * This function allows the master player to flip a row of cards during phase 1 of the game. <br>
 * It updates the game state and player statistics accordingly.
 * <br> <br>
 * 
 * @function flipRow
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user flipping the row.
 * @param {number} rowIdx - The index of the row to be flipped.
 * @returns {object} An object indicating the success of the operation.
 */
async function flipRow(gameId, userId, rowIdx) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, cards: 1, status: 1, gameInfo: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const player = game.players.find(p => p.id === userId);

    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    if (player.role !== PLAYER_ROLES.MASTER) {
        throw { status: 403, message: 'Not authorized' };
    }

    if (player.id !== game.gameInfo.activePlayer) {
        throw { status: 403, message: 'Not your turn' };
    }

    if (game.status !== GAME_STATUS.PHASE1) {
        throw { status: 400, message: 'Cannot flip rows in the current phase' };
    }

    if (game.gameInfo.roundNr !== rowIdx) {
        throw { status: 400, message: 'Can only flip the current round row' };
    }

    const rowCards = game.cards[rowIdx - 1];

    if (!rowCards) {
        throw { status: 400, message: 'Row does not exist' };
    }

    if (rowCards.some(card => card.flipped)) {
        throw { status: 400, message: 'Row already flipped' };
    }

    rowCards.forEach(card => card.flipped = true);

    game.cards[rowIdx - 1] = rowCards;

    await gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        {
            $set:
            {
                cards: game.cards,
                gameInfo: { ...game.gameInfo, isRowFlipped: true }
            }
        }
    );

    await updateStatistics(userId, {
        [USER_KEYS.ROWS_FLIPPED]: { inc: 1 }
    });

    return { success: true };
}

/**
 * Lays a card in the specified game for the given user. <br>
 * This function allows a player to lay a card during phases 1 and 2 of the game. <br>
 * It updates the game state, player statistics, and drink counts accordingly.
 * <br> <br>
 * 
 * @function layCard
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user laying the card.
 * @param {number} cardIdx - The index of the card to be laid.
 * @returns {object} An object indicating the success of the operation.
 */
async function layCard(gameId, userId, cardIdx) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    let allHaveTurn = (game.status === GAME_STATUS.PHASE2 && game.gameInfo.roundNr === 2);
    if (game.gameInfo.activePlayer !== userId && !allHaveTurn) {
        throw { status: 403, message: 'Not your turn' };
    }

    const player = game.players.find(p => p.id === userId);

    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    const card = player.cards[cardIdx];

    if (!card) {
        throw { status: 400, message: 'Invalid card index' };
    }

    if (card.played) {
        throw { status: 400, message: 'Card already played' };
    }

    if (game.status !== GAME_STATUS.PHASE1 && game.status !== GAME_STATUS.PHASE2) {
        throw { status: 400, message: 'Cannot lay cards in the current phase' };
    }

    if (game.status === GAME_STATUS.PHASE1) {
        const rowIdx = game.gameInfo.roundNr - 1;
        const cardRow = game.cards[rowIdx];

        if (!cardRow) {
            throw { status: 400, message: 'No cards available to lay in this round' };
        }

        const matchStyle = game.settings.matching;

        const isInRow = cardRow.some((c) => checkCardMatch(card, c, matchStyle));

        if (!isInRow) {
            throw { status: 400, message: 'Card does not match any in the current row' };
        }

        let drinkCount = game.gameInfo.drinksPerRound;

        if (isInRow) {
            // Calculate drinks to add based on chaos mode
            if (game.settings.isChaos) {
                const shouldMultiply = Math.random() < process.env.CHAOS_MODE;
                const chaosMultiplier = shouldMultiply ? game.gameInfo.roundNr : 1;
                drinkCount += card.number * chaosMultiplier;
            } else {
                drinkCount += game.gameInfo.roundNr;
            }

            player.cards[cardIdx].played = true;
        }

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId), 'players.id': userId },
            { $set: { 'players.$.cards': player.cards } }
        );

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { gameInfo: { ...game.gameInfo, drinksPerRound: drinkCount } } }
        );

        await updateStatistics(userId, {
            [USER_KEYS.LAYED_CARDS]: { inc: 1 },
            [USER_KEYS.DRINKS_GIVEN]: { inc: drinkCount },
        });
    }

    if (game.status === GAME_STATUS.PHASE2) {
        let drinksPerRound = game.gameInfo.drinksPerRound;
        let drinksPerType = game.gameInfo.drinksPerType;
        let hasToDown = game.gameInfo.hasToDown;

        if (game.gameInfo.roundNr === 1) {
            if (card.number < 2 || card.number > 10) {
                throw { status: 400, message: 'In round 1, only cards 2-10 can be played' };
            }

            drinksPerRound += card.number;
        }

        if (game.gameInfo.roundNr === 2) {
            if (card.number < 11 || card.number > 13) {
                throw { status: 400, message: 'In round 2, only J, Q, K can be played' };
            }

            drinkConditions.forEach(({ condition, type, drinks }) => {
                if (condition(card)) {
                    drinksPerType[type] += drinks;
                }
            });
        }

        if (game.gameInfo.roundNr === 3) {
            if (card.number !== 14) {
                throw { status: 400, message: 'In round 3, only the A can be played' };
            }

            hasToDown[player.id] += 1;
        }

        let cards = game.cards[game.gameInfo.roundNr - 1];
        cards.unshift(card);

        player.cards[cardIdx].played = true;

        if (game.status === GAME_STATUS.PHASE2 && game.gameInfo.roundNr === 2) {
            let unplayedCards = player.cards.filter(c => !c.played && c.number >= 11 && c.number <= 13);
            if (unplayedCards.length === 0) {
                player.turnInfo.hadTurn = true;
            }
        }

        const drinksPerPlayer = game.statistics?.[GAME_KEYS.DRINKS_PER_PLAYER] || {};

        const playerIdx = drinksPerPlayer.findIndex(p => p.id === userId);
        if (playerIdx !== -1) {
            drinksPerPlayer[playerIdx].drinks += drinksPerRound;
        }

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId), 'players.id': userId },
            {
                $set:
                {
                    'players.$.cards': player.cards,
                    'players.$.turnInfo': player.turnInfo,
                    [`cards.${game.gameInfo.roundNr - 1}`]: cards,
                    gameInfo: {
                        ...game.gameInfo,
                        drinksPerRound
                    },
                    statistics: {
                        ...game.statistics,
                        [GAME_KEYS.DRINKS_PER_PLAYER]: drinksPerPlayer
                    }
                }
            }
        );

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set:
                {
                    "gameInfo.drinksPerType": drinksPerType,
                    "gameInfo.hasToDown": hasToDown
                }
            }
        );
    }

    return { success: true };
}

/**
 * Checks a card action in the specified game for the given user. <br>
 * This function allows a player to check a card action during phase 3 of the game. <br>
 * It updates the game state, player statistics, and drink counts accordingly.
 * <br> <br>
 * 
 * @function checkCardAction
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user checking the card action.
 * @param {string} cardIdx - The index of the card to be checked (format: "row-col").
 * @param {string} action - The action to be performed on the card.
 * @param {string|null} secondAction - An optional second action to be performed on the card.
 * @returns {object} An object indicating the success of the operation.
 */
async function checkCardAction(gameId, userId, cardIdx, action, secondAction = null) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    if (game.status !== GAME_STATUS.PHASE3) {
        throw { status: 400, message: 'Game is not in Phase 3' };
    }

    const player = game.players.find(p => p.id === userId);

    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    let activePlayer = game.players.find(p => p.id === game.gameInfo.activePlayer);

    if (!activePlayer) {
        activePlayer = player;

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { 'gameInfo.activePlayer': activePlayer.id } }
        );
    }

    const [row, col] = cardIdx.split('-').map(Number);

    if (!game.cards?.[row]?.[col]) {
        throw { status: 400, message: 'Invalid card index' };
    }

    const card = game.cards[row][col];
    let lastCard = game.gameInfo.lastCard;

    let rule = CARD_ACTIONS[action];
    if (!rule) {
        throw { status: 400, message: 'Invalid action' };
    }

    let validCard = rule(card, lastCard);

    if (secondAction) {
        rule = CARD_ACTIONS[secondAction];
        if (!rule) {
            throw { status: 400, message: 'Invalid second action' };
        }

        lastCard = game.cards[8][0];
        validCard = rule(card, lastCard);
    }

    game.cards[row][col].flipped = true;

    if (validCard) {
        const nextRow = game.gameInfo.currentRow + 1;

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    cards: game.cards,
                    gameInfo: { ...game.gameInfo, activePlayer: activePlayer.id, lastCard: card, currentRow: nextRow }
                }
            }
        );

        if (nextRow >= PHASE_ROUNDS.PHASE3) {
            await gamesCollection.updateOne(
                { _id: new ObjectId(gameId) },
                {
                    $set: { "gameInfo.gameOver": true }
                }
            );

            await updateStatistics(activePlayer.id.toString(), {
                [USER_KEYS.GAMES_WON]: { inc: 1 },
            });

            await Promise.all(
                game.players.map(p =>
                    updateStatistics(p.id, {
                        [USER_KEYS.GAMES_PLAYED]: { inc: 1 },
                    })
                )
            );
        }
    } else {
        const drinksPerTry = game.gameInfo.currentRow + 1;

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    cards: game.cards,
                    gameInfo: { ...game.gameInfo, activePlayer: activePlayer.id, lastCard: card, drinksPerTry, tryOver: true }
                }
            }
        );

        await updateStatistics(activePlayer.id.toString(), {
            [USER_KEYS.DRINKS_PHASE3]: { inc: drinksPerTry },
            [USER_KEYS.PHASE3_FAILED]: { inc: 1 },
        });
    }

    return { success: true };
}

/**
 * Move to the next player in the game. <br>
 * This function updates the active player to the next player in the game. <br>
 * It ensures that the game state is updated accordingly.
 * <br> <br>
 * 
 * @function nextPlayer
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user requesting the next player.
 * @returns {object} An object indicating the success of the operation.
 */
async function nextPlayer(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    if (game.gameInfo.activePlayer !== userId) {
        throw { status: 403, message: 'Not your turn' };
    }

    let players = game.players;
    let nextPlayerId = getNextPlayer(players, game.gameInfo.activePlayer, game.gameInfo.turnOrder, game.settings.turning);
    let nextRoundNr = game.gameInfo.roundNr;

    if (game.status === GAME_STATUS.PHASE1) {
        if (game.gameInfo.roundNr >= PHASE_ROUNDS.PHASE1) {
            // Start Phase 2
            await startPhase2(gameId, userId);
            return { success: true };
        }

        const allHadTurn = players.every((p) => p.turnInfo.hadTurn === true);
        if (allHadTurn && nextRoundNr < PHASE_ROUNDS.PHASE1) {
            nextRoundNr += 1;
            players = players.map((p) => ({
                ...p,
                turnInfo: { ...p.turnInfo, hadTurn: false }
            }));
        }

        players = players.map((p) => ({
            ...p,
            turnInfo: { ...p.turnInfo, drinksPerPlayer: 0 }
        }));

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    gameInfo: {
                        ...game.gameInfo,
                        roundNr: nextRoundNr,
                        drinksPerRound: 0,
                        activePlayer: nextPlayerId,
                        isRowFlipped: false,
                    },
                }
            }
        );

        // Need to do update players seperate from gameInfo to trigger change stream event
        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { players } }
        );

        await updateStatistics(userId, {
            [USER_KEYS.DRINKS_GIVEN]: { inc: (game.settings.giving === "Default" ? game.gameInfo.drinksPerRound : 0) },
            [USER_KEYS.MAX_DRINKS_GIVEN]: { max: game.gameInfo.drinksPerRound }
        });
    }

    if (game.status === GAME_STATUS.PHASE2) {
        if (game.gameInfo.roundNr >= PHASE_ROUNDS.PHASE2) {
            // Start Phase 3
            await startPhase3(gameId, userId);
            return { success: true };
        }

        let resetTurn = false;
        const allHadTurn = players.every((p) => p.turnInfo.hadTurn === true);
        if (allHadTurn && nextRoundNr < PHASE_ROUNDS.PHASE2) {
            nextRoundNr += 1;
            if (nextRoundNr === 2) {
                resetTurn = true;
            }
            players = players.map((p) => ({
                ...p,
                turnInfo: { ...p.turnInfo, hadTurn: resetTurn }
            }));
        }

        players = players.map((p) => ({
            ...p,
            turnInfo: { ...p.turnInfo, drinksPerPlayer: 0 }
        }));

        if (game.gameInfo.roundNr === 2) {
            nextPlayerId = game.gameInfo.activePlayer;
        }

        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            {
                $set: {
                    gameInfo: {
                        ...game.gameInfo,
                        roundNr: nextRoundNr,
                        drinksPerRound: 0,
                        activePlayer: nextPlayerId,
                    },
                }
            }
        );

        // Need to do update players seperate from gameInfo to trigger change stream event
        await gamesCollection.updateOne(
            { _id: new ObjectId(gameId) },
            { $set: { players } }
        );

        if (game.gameInfo.roundNr === 1) {
            await updateStatistics(userId, {
                [USER_KEYS.DRINKS_SELF]: { inc: game.gameInfo.drinksPerRound },
                [USER_KEYS.MAX_DRINKS_SELF]: { max: game.gameInfo.drinksPerRound }
            });
        }

        if (game.gameInfo.roundNr === 2) {
            await Promise.all(
                game.players.map(player =>
                    updateStatistics(player.id, {
                        [USER_KEYS.DRINKS_SELF]: { inc: getPlayerDrinksPerGender(player.gender, game.gameInfo.drinksPerType) }
                    })
                )
            );
        }

        if (game.gameInfo.roundNr === 3) {
            const player = game.players.find(p => p.id === userId);

            if (!player) {
                throw { status: 404, message: 'Player not found' };
            }

            await updateStatistics(userId, {
                [USER_KEYS.NUMBER_EX]: { inc: game.gameInfo.hasToDown[player.id] ? 1 : 0 },
            });
        }
    }

    return { success: true };
}

/**
 * Retries Phase 3 of the game. <br>
 * This function resets the game state for Phase 3, allowing players to retry the phase. <br>
 * It flips all cards back down, creates a new deck, and sets up the game information for a new attempt.
 * <br> <br>
 */
async function retryPhase3(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const player = game.players.find(p => p.id === userId);
    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    if (game.status !== GAME_STATUS.PHASE3) {
        throw { status: 400, message: 'Game is not in Phase 3' };
    }

    const flipCards = game.cards.map(row =>
        row.map(card => ({ ...card, flipped: false }))
    );

    await gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        { $set: { cards: flipCards } }
    );

    // Small delay to ensure clients receive the card flip update first
    await new Promise(resolve => setTimeout(resolve, 350));

    let deck = createDeck(game.settings.shuffling);

    const cards = [];
    cards.push(deck.splice(0, 2).map((card, i) => ({
        ...card,
        flipped: i === 1,
    })));

    for (let row = 2; row <= 5; row++) {
        cards.push(
            deck.splice(0, row).map((card) => ({
                ...card,
                flipped: false,
            }))
        );
    }

    for (let row = 4; row >= 2; row--) {
        cards.push(
            deck.splice(0, row).map((card) => ({
                ...card,
                flipped: false,
            }))
        );
    }

    cards.push(deck.splice(0, 2).map((card, i) => ({
        ...card,
        flipped: i === 0,
    })));

    const gameInfo = {
        busfahrer: game.gameInfo.busfahrer,
        activePlayer: null,
        lastCard: cards[0][1],
        currentRow: 0,
        drinksPerTry: 0,
        gameOver: false,
        tryOver: false,
    };

    // Need to set activePlayer to null first to trigger change stream event
    await gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        { $set: { 'gameInfo.activePlayer': null } }
    );

    await gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        {
            $set: {
                cards,
                gameInfo
            }
        }
    );

    return { success: true };
}

/**
 * Opens a new game lobby after the current game has ended. <br>
 * This function allows the Game Master to open a new game lobby once the current game is over. <br>
 * It updates the lobby status and notifies all connected clients about the new game.
 * <br> <br>
 * 
 * @function openNewGame
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user requesting to open a new game.
 * @returns {object} An object indicating the success of the operation.
 */
async function openNewGame(gameId, userId) {
    const gamesCollection = db.collection('games');
    const lobbyCollection = db.collection('lobbies');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const player = game.players.find(p => p.id === userId);

    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    if (player.role !== PLAYER_ROLES.MASTER) {
        throw { status: 403, message: 'Only the Game Master can open a new game' };
    }

    if (game.status !== GAME_STATUS.PHASE3 || !game.gameInfo.gameOver) {
        throw { status: 400, message: 'Game is not over yet' };
    }

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    await lobbyCollection.updateOne(
        { _id: new ObjectId(gameId) },
        {
            $set: { status: LOBBY_STATUS.WAITING }
        }
    );

    gameConnections.get(game._id.toString()).forEach((client, pid) => {
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'newGameUpdate',
                data: { lobbyId: lobby._id.toString() }
            }));
        }
    });

    await gamesCollection.deleteOne(
        { _id: new ObjectId(gameId) }
    );

    return { success: true };
}

/**
 * Allows a user to leave a game. <br>
 * This function handles the logic for a user leaving a game, including updating the game state, 
 * reassigning the Game Master role if necessary, and deleting the game if there are no players left.
 * <br> <br>
 * 
 * @function leaveGame
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user leaving the game.
 * @returns {object} An object indicating the success of the operation.
 */
async function leaveGame(gameId, userId) {
    const gameCollection = db.collection('games');
    const lobbyCollection = db.collection('lobbies');
    const chatCollection = db.collection('chats');

    const game = await gameCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, spectators: 1, settings: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const isPlayerInGame = game.players.some((player) => player.id === userId);
    const isSpectatorInGame = game.spectators.some((spectator) => spectator.id === userId);

    if (!(isPlayerInGame || isSpectatorInGame)) {
        throw { status: 400, message: 'You are not in this game' };
    }

    if (isPlayerInGame) {
        const playerCount = game.players.length;
        const leavingPlayer = game.players.find(player => player.id === userId);

        if (playerCount === 1) {
            const clients = gameConnections.get(gameId.toString());
            if (clients) {
                for (const [id, client] of clients.entries()) {
                    if (id === userId) continue;

                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'closeUpdate'
                        }));
                    }
                }
            }

            await gameCollection.deleteOne(
                { _id: new ObjectId(gameId) }
            );

            await lobbyCollection.deleteOne(
                { _id: new ObjectId(gameId) }
            );

            await chatCollection.deleteOne(
                { _id: new ObjectId(gameId) }
            );
        } else {
            if (leavingPlayer.role === PLAYER_ROLES.MASTER) {
                if (game.settings.canInherit) {
                    const otherPlayers = game.players.filter(player => player.id !== userId);
                    otherPlayers.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

                    const newGameMaster = otherPlayers[0];

                    await gameCollection.updateOne(
                        { _id: new ObjectId(gameId), 'players.id': newGameMaster.id },
                        { $set: { 'players.$.role': PLAYER_ROLES.MASTER } }
                    );

                    await updateStatistics(newGameMaster.id, {
                        [USER_KEYS.MASTER_INHERITED]: { inc: 1 }
                    });

                    const client = gameConnections.get(gameId.toString())?.get(newGameMaster.id);
                    if (client && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'roleUpdate',
                            data: { isGameMaster: true }
                        }));
                    }
                } else {
                    const clients = gameConnections.get(gameId.toString());
                    if (clients) {
                        for (const [id, client] of clients.entries()) {
                            if (id === userId) continue;

                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: 'closeUpdate'
                                }));
                            }
                        }
                    }

                    await gameCollection.deleteOne(
                        { _id: new ObjectId(gameId) }
                    );

                    await lobbyCollection.deleteOne(
                        { _id: new ObjectId(gameId) }
                    );

                    await chatCollection.deleteOne(
                        { _id: new ObjectId(gameId) }
                    );
                }
            }

            await gameCollection.updateOne(
                { _id: new ObjectId(gameId) },
                {
                    $pull: {
                        players: { id: userId },
                        "gameInfo.turnOrder": userId
                    }
                }
            );
        }
    }

    if (isSpectatorInGame) {
        await gameCollection.updateOne(
            { _id: new ObjectId(gameId) },
            { $pull: { spectators: { id: userId } } }
        );
    }

    await updateStatistics(userId, {
        [USER_KEYS.GAMES_LEFT]: { inc: 1 }
    });

    return { success: true };
}

/**
 * Starts Phase 2 of the game. <br>
 * This function transitions the game from Phase 1 to Phase 2, updating the game state and player statistics accordingly.
 * <br> <br>
 * 
 * @function startPhase2
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user starting Phase 2.
 * @returns {object} An object indicating the success of the operation.
 */
async function startPhase2(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    if (game.gameInfo.activePlayer !== userId) {
        throw { status: 403, message: 'Only the active player can start Phase 2' };
    }

    if (game.status !== GAME_STATUS.PHASE1) {
        throw { status: 400, message: 'Game is not in Phase 1' };
    }

    const player = game.players.find(p => p.id === userId);

    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    if (player.role !== PLAYER_ROLES.MASTER) {
        throw { status: 403, message: 'Only the Game Master can start Phase 2' };
    }

    const busfahrer = calculateBusfahrer(game.players, game.settings.busMode);

    const cards = [[], [], []];

    const players = game.players.map((p) => ({
        ...p,
        turnInfo: {
            drinksPerPlayer: 0,
            hadTurn: false,
        }
    }));

    let hasToDown = {};
    players.forEach((p) => {
        hasToDown[p.id] = 0;
    });

    await gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        {
            $set: {
                status: GAME_STATUS.PHASE2,
                players,
                cards,
                gameInfo: {
                    turnOrder: game.gameInfo.turnOrder,
                    activePlayer: game.gameInfo.turnOrder[0],
                    busfahrer,
                    drinksPerRound: 0,
                    drinksPerType: { JACK: 0, QUEEN: 0, KING: 0 },
                    hasToDown,
                    roundNr: 1,
                }
            }
        }
    );

    for (const p of players) {
        const unplayedCards = p.cards.filter(c => !c.played).length;

        await updateStatistics(p.id, {
            [USER_KEYS.CARDS_LEFT]: { inc: unplayedCards },
            [USER_KEYS.CARDS_PLAYED_PHASE1]: { min: (10 - unplayedCards) },
            [USER_KEYS.MAX_CARDS_SELF]: { max: unplayedCards }
        });
    }

    for (const p of busfahrer) {
        await updateStatistics(p, {
            [USER_KEYS.GAMES_BUSFAHRER]: { inc: 1 }
        });
    }
}

/**
 * Starts Phase 3 of the game. <br>
 * This function transitions the game from Phase 2 to Phase 3, setting up the game state and cards for the new phase.
 * <br> <br>
 * 
 * @function startPhase3
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user starting Phase 3.
 * @returns {object} An object indicating the success of the operation.
 */
async function startPhase3(gameId, userId) {
    const gamesCollection = db.collection('games');

    const game = await gamesCollection.findOne(
        { _id: new ObjectId(gameId) },
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    if (game.gameInfo.activePlayer !== userId) {
        throw { status: 403, message: 'Only the active player can start Phase 3' };
    }

    if (game.status !== GAME_STATUS.PHASE2) {
        throw { status: 400, message: 'Game is not in Phase 2' };
    }

    const player = game.players.find(p => p.id === userId);

    if (!player) {
        throw { status: 404, message: 'Player not found' };
    }

    if (player.role !== PLAYER_ROLES.MASTER) {
        throw { status: 403, message: 'Only the Game Master can start Phase 3' };
    }

    let deck = createDeck(game.settings.shuffling);

    const cards = [];
    cards.push(deck.splice(0, 2).map((card, i) => ({
        ...card,
        flipped: i === 1,
    })));

    for (let row = 2; row <= 5; row++) {
        cards.push(
            deck.splice(0, row).map((card) => ({
                ...card,
                flipped: false,
            }))
        );
    }

    for (let row = 4; row >= 2; row--) {
        cards.push(
            deck.splice(0, row).map((card) => ({
                ...card,
                flipped: false,
            }))
        );
    }

    cards.push(deck.splice(0, 2).map((card, i) => ({
        ...card,
        flipped: i === 0,
    })));

    const players = game.players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        gender: p.gender,
        avatar: p.avatar,
        title: p.title,
        joinedAt: p.joinedAt,
    }));

    const gameInfo = {
        busfahrer: game.gameInfo.busfahrer,
        activePlayer: null,
        lastCard: cards[0][1],
        currentRow: 0,
        drinksPerTry: 0,
        gameOver: false,
        tryOver: false,
    };

    await gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        {
            $set: {
                status: GAME_STATUS.PHASE3,
                players,
                cards,
                gameInfo
            }
        }
    );
}

/**
 * Checks for game updates based on changed keys. <br>
 * This function evaluates the changed keys in the game state and sends appropriate updates to connected clients. <br>
 * It handles updates for avatar info, drink system, game settings, game cards, player cards, and turn info.
 * <br> <br>
 * 
 * @function checkGameUpdate
 * @param {Array<string>} keys - The list of changed keys in the game state.
 * @param {object} game - The current game state.
 * @param {Array<WebSocket>} clients - The list of connected WebSocket clients.
 * @returns {void}
 */
async function checkGameUpdate(keys, game, clients) {
    logTrace(`Checking game update for keys: ${keys.join(', ')}`);

    // Avatar Info
    if (keys.some((key) =>
        !key.includes('turnInfo') &&
        !key.includes('cards') &&
        key.startsWith('players') ||
        key.includes('activePlayer')
    )) {

        const players = game.players.map((player) => {
            const drinksPerPlayer =
                game.phase <= GAME_STATUS.PHASE1
                    ? player.turnInfo.drinksPerPlayer
                    : 0;

            const isActivePlayer = game.gameInfo.activePlayer !== null && player.id === game.gameInfo.activePlayer;
            const active = isActivePlayer || (game.status === GAME_STATUS.PHASE2 && game.gameInfo.roundNr === 2);

            return {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                title: player.title,
                drinksPerPlayer,
                active,
            };
        });

        const data = { players };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'avatarUpdate',
                    data
                }));
            }
        });
    }

    // Avatar Drink System
    if (keys.some((key) =>
        (key.startsWith('players') &&
            key.includes('drinksPerPlayer')) &&
        game.status === GAME_STATUS.PHASE1
    )) {

        let given = true;
        let canUp = false;
        let canDown = false;

        if (game.settings.giving !== "Avatar") {
            const totalGiven = game.players.reduce((sum, player) => {
                return sum + player.drinks;
            }, 0);

            given = totalGiven >= game.gameInfo.drinksPerRound;
        }

        const totalDrinksGiven = game.players.reduce((sum, p) => sum + p.drinks, 0);

        if (totalDrinksGiven < game.gameInfo.drinksPerRound) {
            canUp = true;
        }

        if (totalDrinksGiven > 0) {
            canDown = true;
        }

        const data = { given, canUp, canDown };

        const client = gameConnections.get(game._id.toString())?.get(player.id);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'playerDrinkUpdate',
                data
            }));
        }
    }

    // Game Settings
    if (keys.some((key) =>
        key.startsWith('settings')
    )) {

        const settings = {
            giving: game.status === GAME_STATUS.PHASE1 && game.settings.giving === "Avatar"
        }

        const data = { settings };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'settingUpdate',
                    data
                }));
            }
        });
    }

    // Game Cards
    if (keys.some((key) =>
        (key.startsWith('cards') &&
            !key.includes('players')) ||
        key.includes('status')
    )) {

        const data = { cards: game.cards || [] };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'gameCardUpdate',
                    data
                }));
            }
        });
    }

    // Player Cards
    if (keys.some((key) =>
        (key.startsWith('players') &&
            key.includes('cards')) &&
        game.status !== GAME_STATUS.PHASE3
    )) {

        const key = keys.find(k => k.startsWith("players") && k.includes("cards"));

        if (!key) return;

        const playerIdx = parseInt(key.split(".")[1], 10);

        const player = game.players[playerIdx];

        if (!player) return;

        const data = { cards: player.cards || [] };

        const client = gameConnections.get(game._id.toString())?.get(player.id);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'playerCardUpdate',
                data
            }));
        }
    }

    // Player Turn Info Phase 1 & 2
    if (keys.some((key) =>
        ((key.startsWith('players') &&
            key.includes('turnInfo')) ||
            key.includes('activePlayer')) &&
        game.status !== GAME_STATUS.PHASE3
    )) {

        const key = keys.find(k => k.startsWith("players") && k.includes("turnInfo"));
        let player;

        if (key) {
            const playerIdx = parseInt(key.split(".")[1], 10);
            player = game.players[playerIdx];
        }

        const activePlayer = game.players.find(p => p.id === game.gameInfo.activePlayer);
        if (!player) player = activePlayer;


        let drinksReceived = 0;
        let nextPlayerEnabled = false;
        let nextPhaseEnabled = false;

        const isGameMaster = player.role === PLAYER_ROLES.MASTER;
        let isCurrentPlayer = game.gameInfo.activePlayer === player.id;

        if (game.settings.giving === "Avatar") {
            drinksReceived = player.turnInfo.drinksPerPlayer;
        }

        if (player.id === game.gameInfo.activePlayer) {
            nextPlayerEnabled = true;

            if (player.role === PLAYER_ROLES.MASTER && !game.gameInfo.isRowFlipped) {
                nextPlayerEnabled = false;
            }

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE1 && game.status === GAME_STATUS.PHASE1) {
                nextPhaseEnabled = true;
            }

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE2 && game.status === GAME_STATUS.PHASE2) {
                nextPhaseEnabled = true;
            }
        }

        if (game.status === GAME_STATUS.PHASE2 && game.gameInfo.roundNr > 2) {
            let unplayedCards = [];

            if (game.gameInfo.roundNr === 3) {
                unplayedCards = player.cards.filter(c => !c.played && c.number === 14);
            }

            const noCardsLeft = unplayedCards.length <= 0;

            if (player.id === game.gameInfo.activePlayer) {
                nextPlayerEnabled = noCardsLeft;
            }

            const client = gameConnections.get(game._id.toString())?.get(game.activePlayer);
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'turnInfoUpdate',
                    data: { drinksReceived, isGameMaster, isCurrentPlayer: true, nextPhaseEnabled, nextPlayerEnabled: noCardsLeft }
                }));
            }
        }

        const data = { drinksReceived, isGameMaster, isCurrentPlayer, nextPhaseEnabled, nextPlayerEnabled };

        const client = gameConnections.get(game._id.toString())?.get(player.id);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'turnInfoUpdate',
                data
            }));
        }
    }

    // Player Turn Info Phase 3
    if (keys.some((key) =>
        (key.startsWith('players') ||
            key.includes('activePlayer')) &&
        game.status === GAME_STATUS.PHASE3
    )) {

        gameConnections.get(game._id.toString()).forEach((client, pid) => {
            const player = game.players.find(p => p.id === pid);
            const isSpectator = game.spectators?.some((spectator) => spectator.id === pid);
            if (!player && !isSpectator) return;

            let data;

            if (isSpectator) {
                data = { isGameMaster: false, isCurrentPlayer: false };
            } else {
                let isCurrentPlayer = true;
                if (game.gameInfo.activePlayer !== null) {
                    isCurrentPlayer = game.gameInfo.activePlayer === pid;
                }

                data = { isGameMaster: player.role === PLAYER_ROLES.MASTER, isCurrentPlayer };
            }

            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'turnInfoUpdate',
                    data
                }));
            }
        });
    }

    // Game Info Phase 1 & 2
    if (keys.some((key) =>
        (key.startsWith('gameInfo') ||
            key.includes('status')) &&
        game.status !== GAME_STATUS.PHASE3
    )) {

        const playerRow = {
            name: "",
            info: ""
        }

        const drinkRow = {
            name: "",
            info: ""
        }

        let status = -1;

        switch (game.status) {
            case GAME_STATUS.PHASE1:
                status = 1;
                break;
            case GAME_STATUS.PHASE2:
                status = 2;
                break;
            case GAME_STATUS.PHASE3:
                status = 3;
                break;
            default:
                status = -1;
                break;
        }

        const activePlayer = game.players.find(p => p.id === game.gameInfo.activePlayer);
        if (!activePlayer) return;

        let nextPlayerEnabled = true;
        let nextPhaseEnabled = false;

        if (game.status === GAME_STATUS.PHASE1) {
            playerRow.name = activePlayer.name + " ";
            playerRow.info = "darf";
            drinkRow.name = game.gameInfo.drinksPerRound + " ";
            drinkRow.info = "Schlucke verteilen";

            if (!game.gameInfo.isRowFlipped && activePlayer.role === PLAYER_ROLES.MASTER) {
                playerRow.info = "muss die ";
                drinkRow.name = "Reihe ";
                drinkRow.info = "aufdecken";
            }

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE1) {
                playerRow.name = "Phase 2 ";
                playerRow.info = "kann";
                drinkRow.name = "gestartet ";
                drinkRow.info = "werden!";
            }
        }

        if (game.status === GAME_STATUS.PHASE2) {
            playerRow.name = activePlayer.name + " ";
            playerRow.info = "muss";
            drinkRow.name = game.gameInfo.drinksPerRound + " ";
            drinkRow.info = "Schlucke trinken";

            if (game.gameInfo.roundNr === 2) {
                gameConnections.get(game._id.toString()).forEach((client, pid) => {
                    const p = game.players.find(p => p.id === pid);
                    const isSpectator = game.spectators?.some((spectator) => spectator.id === pid);
                    if (!p && !isSpectator) return;

                    if (!isSpectator) {
                        playerRow.name = p.name + " ";
                        playerRow.info = "muss";
                        drinkRow.name = getPlayerDrinksPerGender(p.gender, game.gameInfo.drinksPerType) + " ";
                        drinkRow.info = "Schlucke trinken";
                    } else {
                        playerRow.name = "";
                        playerRow.info = "";
                        drinkRow.name = "";
                        drinkRow.info = "";
                    }

                    if (client && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'gameInfoUpdate',
                            data: { playerRow, drinkRow, phase: 2 }
                        }));
                    }
                });
            }

            if (game.gameInfo.roundNr === 3) {
                playerRow.info = "muss das Glas";
                drinkRow.name = game.gameInfo.hasToDown[activePlayer.id] > 0 ? "exen " : "nicht exen ";
                drinkRow.info = "";
            }

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE2) {
                playerRow.name = "Phase 3 ";
                playerRow.info = "kann";
                drinkRow.name = "gestartet ";
                drinkRow.info = "werden!";
            }
        }

        if (game.status === GAME_STATUS.PHASE1) {
            if (activePlayer.role === PLAYER_ROLES.MASTER && !game.gameInfo.isRowFlipped) {
                nextPlayerEnabled = false;
            }

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE1) {
                nextPhaseEnabled = true;
            }
        }

        if (game.status === GAME_STATUS.PHASE2) {
            let unplayedCards = activePlayer.cards.filter(c => !c.played);
            if (game.gameInfo.roundNr === 1) {
                unplayedCards = unplayedCards.filter(c => c.number >= 2 && c.number <= 10);
            }

            if (game.gameInfo.roundNr === 2) {
                unplayedCards = game.players
                    .flatMap(player => player.cards)
                    .filter(c => !c.played && c.number >= 11 && c.number <= 13);
            }

            if (game.gameInfo.roundNr === 3) {
                unplayedCards = unplayedCards.filter(c => c.number === 14);
            }

            nextPlayerEnabled = unplayedCards.length <= 0;

            if (game.gameInfo.roundNr === PHASE_ROUNDS.PHASE2) {
                nextPhaseEnabled = true;
            }

        }

        if (!(game.status === GAME_STATUS.PHASE2 && game.gameInfo.roundNr === 2)) {
            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'gameInfoUpdate',
                        data: { playerRow, drinkRow, phase: status }
                    }));
                }
            });
        }

        const client = gameConnections.get(game._id.toString())?.get(activePlayer.id);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'nextPlayerUpdate',
                data: { nextPhaseEnabled, nextPlayerEnabled, isCurrentPlayer: true }
            }));
        }

        let isCurrentPlayer = false;

        if (game.status === GAME_STATUS.PHASE2 && game.gameInfo.roundNr === 2) {
            isCurrentPlayer = true;
        }

        gameConnections.get(game._id.toString()).forEach((client, pid) => {
            if (String(pid) === String(game.gameInfo.activePlayer)) return;
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'nextPlayerUpdate',
                    data: { nextPhaseEnabled: false, nextPlayerEnabled: false, isCurrentPlayer }
                }));
            }
        });
    }

    // Game Info Phase 3
    if (keys.some((key) =>
        (key.startsWith('gameInfo') ||
            key.includes('status')) &&
        game.status === GAME_STATUS.PHASE3
    )) {

        const playerRow = {
            name: "",
            info: ""
        }

        const drinkRow = {
            name: "",
            info: ""
        }

        let status = -1;

        switch (game.status) {
            case GAME_STATUS.PHASE1:
                status = 1;
                break;
            case GAME_STATUS.PHASE2:
                status = 2;
                break;
            case GAME_STATUS.PHASE3:
                status = 3;
                break;
            default:
                status = -1;
                break;
        }

        if (game.gameInfo.activePlayer === null) {
            playerRow.info = "Ein Spieler muss die ";
            drinkRow.name = "erste ";
            drinkRow.info = "Karte aufdecken";
        } else {
            let player = game.players.find(p => p.id === game.gameInfo.activePlayer);
            if (!player) player = { name: "Player" };

            playerRow.name = player.name + " ";
            playerRow.info = "versucht eine Runde zu ";
            drinkRow.name = "überleben";

            if (game.gameInfo.tryOver) {
                playerRow.info = "muss ";
                drinkRow.name = game.gameInfo.drinksPerTry + " ";
                drinkRow.info = "Schlucke trinken";
            }

            if (game.gameInfo.gameOver) {
                playerRow.info = "hat das Spiel ";
                drinkRow.name = "überlebt";
                drinkRow.info = "";
            }
        }

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'phase3Update',
                    data: { currentRow: game.gameInfo.currentRow, tryOver: game.gameInfo.tryOver, gameOver: game.gameInfo.gameOver }
                }));
            }
        });

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'gameInfoUpdate',
                    data: { playerRow, drinkRow, phase: 3 }
                }));
            }
        });
    }

    // Busfahrer Info
    if (keys.some((key) =>
        (key.includes('busfahrer') ||
            key.includes('status')) &&
        game.status !== GAME_STATUS.PHASE1
    )) {

        if (game.status >= GAME_STATUS.PHASE2) {
            const busfahrerPlayers = game.gameInfo.busfahrer.map((id) => {
                const player = game.players.find((p) => p.id === id);
                if (!player) {
                    return "Player";
                }
                return player.name;
            });

            gameConnections.get(game._id.toString()).forEach((client, pid) => {
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'busfahrerUpdate',
                        data: { busfahrerName: busfahrerPlayers.join(" & ") }
                    }));
                }
            });
        }
    }
}

export {
    getGameSettings,
    checkIsSpectator,

    getGamePlayers,
    getPlayerCards,
    getGameCards,

    getDrinkInfo,
    getGameInfo,
    getPlayerInfo,
    getBusfahrer,

    giveDrinkToPlayer,

    flipRow,
    layCard,
    checkCardAction,

    nextPlayer,
    retryPhase3,
    openNewGame,

    leaveGame,

    checkGameUpdate,
}