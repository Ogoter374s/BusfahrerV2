/**
 * @fileoverview Service functions for managing game lobbies. 
 * <br><br>
 * This module provides functions to create, join, leave, and manage lobbies. <br>
 * It interacts with the database and WebSocket connections to handle real-time updates. <br>
 * The functions include lobby creation, player management, game starting, and invitation handling. <br>
 * Each function is documented with its purpose, parameters, and return values. <br>
 * This service is essential for the multiplayer functionality of the game.
 */

import WebSocket from 'ws';
import { ObjectId } from "mongodb";

// Database
import { db, updateStatistics } from "../database/mongoClient.js";

// WebSocket
import { lobbyConnections } from "../websockets/connectionMaps.js";

// Constants
import { USER_KEYS, GAME_KEYS, GAME_STATUS, PLAYER_ROLES, LOBBY_STATUS } from '../constants/defaultKeys.js';
import { defaultGameStatistics } from "../constants/defaultData.js";

// Utilities
import { createDeck } from "../utils/deckUtils.js";
import { generateUniqueGameCode } from "../utils/gameUtils.js";
import { logError, logTrace } from "../utils/logger.js";

/**
 * Checks if a user is a spectator in a lobby.
 * <br><br>
 * 
 * @function checkIsSpectator
 * @param {string} lobbyId - ID of the lobby.
 * @param {string} userId - ID of the user.
 * @returns {Object} Object containing isSpectator boolean.
 */
async function checkIsSpectator(lobbyId, userId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { spectators: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const isSpectator = lobby.spectators?.some((spectator) => spectator.id === userId);

    return { isSpectator };
}

/**
 * Retrieves a list of public lobbies that are open for joining.
 * <br><br>
 * 
 * @function getLobbies
 * @returns {Object} Object containing success status and array of lobbies.
 */
async function getLobbies() {
    const lobbyCollection = db.collection('lobbies');

    const lobbies = await lobbyCollection.find({ status: LOBBY_STATUS.WAITING, private: false }).toArray();

    const format = await Promise.all(
        lobbies.filter(
            (lobby) => lobby.settings && lobby.players?.length + lobby.isJoining?.length < lobby.settings.playerLimit
        ).map(async (lobby) => {
            const avatars = await Promise.all(
                lobby.players.map(async (player) => {
                    return {
                        name: player?.name || 'Player',
                        avatar: player?.avatar || 'default.svg',
                    };
                })
            );

            return {
                code: lobby.lobbyCode,
                name: lobby.name || 'Untitled Lobby',
                playerCount: lobby.players.length || 0,
                settings: lobby.settings || {},
                avatars,
                createdAt: lobby.createdAt || new Date(),
                spectators: lobby.spectators
            };
        })
    );

    return { success: true, data: format };
}

/**
 * Retrieves basic information about a lobby. <br>
 * This function fetches the name and code of the specified lobby.
 * <br><br>
 * 
 * @function getLobbyInfo
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object containing lobby information.
 */
async function getLobbyInfo(lobbyId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { name: 1, lobbyCode: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const info = {
        name: lobby.name,
        code: lobby.lobbyCode,
    }

    return { info };
}

/**
 * Checks if a user is the game master in a lobby. <br>
 * This function checks if the specified user is the master of the given lobby.
 * <br><br>
 * 
 * @function getLobbyMaster
 * @param {string} lobbyId - ID of the lobby.
 * @param {string} userId - ID of the user.
 * @returns {Object} Object containing isMaster boolean.
 */
async function getLobbyMaster(lobbyId, userId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { players: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const isMaster = lobby.players.some((player) => player.id === userId && player.role === PLAYER_ROLES.MASTER);

    return { isMaster };
}

/**
 * Retrieves the list of players in a lobby. <br>
 * This function fetches the players' details from the specified lobby.
 * <br><br>
 * 
 * @function getPlayers
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object containing array of players.
 */
async function getPlayers(lobbyId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { players: 1, spectators: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const players = lobby.players.map((player) => ({
        id: player.id,
        name: player.name,
        role: player.role,
        avatar: player.avatar,
        title: player.title
    }));

    return { players };
}

/**
 * Retrieves the list of spectators in a lobby. <br>
 * This function fetches the spectators' details from the specified lobby.
 * <br><br>
 * 
 * @function getSpectators
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object containing array of spectators.
 */
async function getSpectators(lobbyId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { spectators: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const spectators = lobby.spectators.map((spectator) => ({
        id: spectator.id,
        name: spectator.name,
        avatar: spectator.avatar,
        title: spectator.title
    }));

    return { spectators };
}

/**
 * Retrieves lobby invitations for a user. <br>
 * This function fetches the invitations from the user's friends list.
 * <br><br>
 * 
 * @function getLobbyInvitations
 * @param {string} userId - ID of the user.
 * @returns {Object} Object containing array of invitations.
 */
async function getLobbyInvitations(userId) {
    const friendsCollection = db.collection('friends');

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
        { projection: { invitations: 1 } }
    );

    if (!friend) {
        throw { status: 400, message: 'User not found' };
    }

    return { success: true, invitations: friend.invitations || [] };
}

/**
 * Creates a new lobby. <br>
 * This function creates a lobby with the specified parameters and initializes its chat.
 * <br><br>
 * 
 * @function createLobby
 * @param {string} userId - ID of the user creating the lobby.
 * @param {string} gameName - Name of the game/lobby.
 * @param {string} playerName - Name of the player creating the lobby.
 * @param {boolean} isPrivate - Indicates if the lobby is private.
 * @param {string} gender - Gender of the player.
 * @param {Object} settings - Settings for the lobby.
 * @return {Object} Object containing the ID of the created lobby.
 */
async function createLobby(userId, gameName, playerName, isPrivate, gender, settings) {
    const usersCollection = db.collection('users');
    const lobbyCollection = db.collection('lobbies');
    const chatsCollection = db.collection('chats');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { username: 1, titles: 1, avatar: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const activeTitle = user.titles?.find(title => title.active) || null;

    const code = await generateUniqueGameCode();

    const newLobby = {
        name: gameName,
        players: [
            {
                id: userId,
                name: playerName,
                role: PLAYER_ROLES.MASTER,
                gender,
                avatar: user.avatar,
                title: activeTitle,
                joinedAt: new Date()
            }
        ],
        spectators: [],
        isJoining: [],
        status: LOBBY_STATUS.WAITING,
        private: isPrivate,
        lobbyCode: code,
        settings,
        createdAt: new Date()
    }

    const result = await lobbyCollection.insertOne(newLobby);

    const newChat = {
        _id: result.insertedId,
        name: gameName,
        chatCode: code,
        messages: [],
    }

    await chatsCollection.insertOne(newChat);

    await updateStatistics(user._id.toString(), {
        [USER_KEYS.LOBBY_CREATED]: { inc: 1 }
    });

    return { lobbyId: result.insertedId };
}

/**
 * Authenticates a user to join a lobby. <br>
 * This function checks if the user can join the lobby and adds them to the joining list.
 * <br><br>
 * 
 * @function authenticateLobby
 * @param {string} userId - ID of the user.
 * @param {string} lobbyCode - Code of the lobby.
 * @return {Object} Object containing the ID of the lobby.
 */
async function authenticateLobby(userId, lobbyCode) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { lobbyCode: lobbyCode },
        { projection: { _id: 1, players: 1, isJoining: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const isPlayerInGame = lobby.players.some(
        (player) => player.id === userId
    );

    if (isPlayerInGame) {
        throw { status: 400, message: 'You are already in this lobby' };
    }

    await lobbyCollection.updateOne(
        { _id: lobby._id },
        {
            $push: {
                isJoining: {
                    id: userId
                }
            }
        }
    );

    return { lobby: lobby._id };
}

/**
 * Removes a user from the joining list of a lobby. <br>
 * This function removes the specified user from the joining list of the given lobby.
 * <br><br>
 * 
 * @function leaveJoinLobby
 * @param {string} userId - ID of the user.
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object indicating success status.
 */
async function leaveJoinLobby(userId, lobbyId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { isJoining: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const isUserJoining = lobby.isJoining.some(user => user.id === userId);
    if (!isUserJoining) {
        throw { status: 400, message: 'User is not in the joining list' };
    }

    await lobbyCollection.updateOne(
        { _id: new ObjectId(lobbyId) },
        { $pull: { isJoining: { id: userId } } }
    );

    return { success: true };
}

/**
 * Joins a user to a lobby as a player or spectator. <br>
 * This function adds the specified user to the players or spectators list of the given lobby. 
 * <br><br>
 * 
 * @function joinLobby
 * @param {string} userId - ID of the user.
 * @param {string} lobbyId - ID of the lobby.
 * @param {string} playerName - Name of the player.
 * @param {string} gender - Gender of the player.
 * @param {boolean} isSpectator - Whether the user is joining as a spectator.
 * @return {Object} Object containing the ID of the lobby.
 */
async function joinLobby(userId, lobbyId, playerName, gender, isSpectator) {
    const usersCollection = db.collection('users');
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { players: 1, status: 1, settings: 1, spectators: 1, isJoining: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    if (lobby.status !== LOBBY_STATUS.WAITING) {
        throw { status: 400, message: 'Lobby is not open for joining' };
    }

    const isPlayerInGame = lobby.players.some((player) => player.id === userId);
    if (isPlayerInGame) {
        throw { status: 400, message: 'You are already in this lobby' };
    }

    const isUserJoining = lobby.isJoining.some((player) => player.id === userId);
    if (!isUserJoining) {
        throw { status: 400, message: 'User is not in the joining list' };
    }

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { username: 1, titles: 1, avatar: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const activeTitle = user.titles?.find(title => title.active) || null;

    if (isSpectator) {
        const result = await lobbyCollection.updateOne(
            { _id: new ObjectId(lobbyId) },
            {
                $push: {
                    spectators: {
                        id: userId,
                        name: playerName,
                        role: PLAYER_ROLES.SPECTATOR,
                        avatar: user.avatar,
                        title: activeTitle,
                        joinedAt: new Date()
                    }
                },
                $pull: {
                    isJoining: { id: userId }
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw { status: 500, message: 'Failed to join lobby as spectator' };
        }

        await updateStatistics(user._id.toString(), {
            [USER_KEYS.SPECTATOR_JOINED]: { inc: 1 }
        });

        return { lobbyId };
    } else {
        const result = await lobbyCollection.updateOne(
            { _id: new ObjectId(lobbyId) },
            {
                $push: {
                    players: {
                        id: userId,
                        name: playerName,
                        role: PLAYER_ROLES.PLAYER,
                        gender,
                        avatar: user.avatar,
                        title: activeTitle,
                        joinedAt: new Date()
                    }
                },
                $pull: {
                    isJoining: { id: userId }
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw { status: 500, message: 'Failed to join lobby as player' };
        }

        await updateStatistics(user._id.toString(), {
            [USER_KEYS.LOBBY_JOINED]: { inc: 1 }
        });

        return { lobbyId };
    }
}

/**
 * Removes a user from a lobby. <br>
 * This function handles the logic for a user leaving a lobby, including special cases for game masters and lobby deletion.
 * <br><br>
 * 
 * @function leaveLobby
 * @param {string} userId - ID of the user.
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object indicating success status.
 */
async function leaveLobby(userId, lobbyId) {
    const lobbyCollection = db.collection('lobbies');
    const gameCollection = db.collection('games');
    const chatCollection = db.collection('chats');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { players: 1, spectators: 1, settings: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const game = await gameCollection.findOne(
        { _id: new ObjectId(lobbyId) },
    );

    if (game) {
        throw { status: 400, message: 'Cannot leave lobby, game has already started' };
    }

    const isPlayerInGame = lobby.players.some((player) => player.id === userId);
    const isSpectatorInGame = lobby.spectators.some((spectator) => spectator.id === userId);

    if (!(isPlayerInGame || isSpectatorInGame)) {
        throw { status: 400, message: 'You are not in this lobby' };
    }

    if (isPlayerInGame) {
        const playerCount = lobby.players.length;
        const leavingPlayer = lobby.players.find(player => player.id === userId);

        if (playerCount === 1) {
            const clients = lobbyConnections.get(lobbyId.toString());
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

            await lobbyCollection.deleteOne(
                { _id: new ObjectId(lobbyId) }
            );

            await chatCollection.deleteOne(
                { _id: new ObjectId(lobbyId) }
            );
        } else {
            if (leavingPlayer.role === PLAYER_ROLES.MASTER) {
                if (lobby.settings.canInherit) {
                    const otherPlayers = lobby.players.filter(player => player.id !== userId);
                    otherPlayers.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

                    const newGameMaster = otherPlayers[0];

                    await lobbyCollection.updateOne(
                        { _id: new ObjectId(lobbyId), 'players.id': newGameMaster.id },
                        { $set: { 'players.$.role': PLAYER_ROLES.MASTER } }
                    );

                    await updateStatistics(newGameMaster.id, {
                        [USER_KEYS.MASTER_INHERITED]: { inc: 1 }
                    });

                    const client = lobbyConnections.get(lobbyId.toString())?.get(newGameMaster.id);
                    if (client && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'roleUpdate',
                            data: { isGameMaster: true }
                        }));
                    }
                } else {
                    const clients = lobbyConnections.get(lobbyId.toString());
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

                    await lobbyCollection.deleteOne(
                        { _id: new ObjectId(lobbyId) }
                    );

                    await chatCollection.deleteOne(
                        { _id: new ObjectId(lobbyId) }
                    );
                }
            }

            await lobbyCollection.updateOne(
                { _id: new ObjectId(lobbyId) },
                { $pull: { players: { id: userId }, isJoining: { id: userId } } }
            );
        }
    }

    if (isSpectatorInGame) {
        await lobbyCollection.updateOne(
            { _id: new ObjectId(lobbyId) },
            { $pull: { spectators: { id: userId }, isJoining: { id: userId } } }
        );
    }

    await updateStatistics(userId, {
        [USER_KEYS.LOBBY_LEFT]: { inc: 1 }
    });

    return { success: true };
}

/**
 * Kicks a player from a lobby. <br>
 * This function removes the specified player from the given lobby and notifies them via WebSocket.
 * <br><br>
 * 
 * @function kickPlayer
 * @param {string} lobbyId - ID of the lobby.
 * @param {string} userId - ID of the user performing the kick.
 * @param {string} playerId - ID of the player to be kicked.
 * @returns {Object} Object indicating success status.
 */
async function kickPlayer(lobbyId, userId, playerId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { players: 1, spectators: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const isPlayerInGame = lobby.players.some((player) => player.id === playerId);
    const isSpectatorInGame = lobby.spectators.some((spectator) => spectator.id === playerId);

    if (!(isPlayerInGame || isSpectatorInGame)) {
        throw { status: 400, message: 'Player is not in this lobby' };
    }

    if (isPlayerInGame) {
        await lobbyCollection.updateOne(
            { _id: new ObjectId(lobbyId) },
            { $pull: { players: { id: playerId } } }
        );
    }

    if (isSpectatorInGame) {
        await lobbyCollection.updateOne(
            { _id: new ObjectId(lobbyId) },
            { $pull: { spectators: { id: playerId } } }
        );
    }

    await updateStatistics(userId, {
        [USER_KEYS.PLAYERS_KICKED]: { inc: 1 }
    });

    await updateStatistics(playerId, {
        [USER_KEYS.GOT_KICKED]: { inc: 1 }
    });

    const client = lobbyConnections.get(lobbyId.toString())?.get(playerId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
            type: 'kickUpdate'
        }));
    }

    return { success: true };
}

/**
 * Starts a game from a lobby. <br>
 * This function initializes the game state and transitions the lobby to a started game. <br>
 * It also notifies all connected clients about the game start.
 * <br><br>
 * 
 * @function startGame
 * @param {string} lobbyId - ID of the lobby.
 * @param {string} userId - ID of the user starting the game.
 * @returns {Object} Object containing the ID of the started game.
 */
async function startGame(lobbyId, userId) {
    const lobbyCollection = db.collection('lobbies');
    const gameCollection = db.collection('games');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    if (lobby.status !== LOBBY_STATUS.WAITING) {
        throw { status: 400, message: 'Game has already started' };
    }

    const isGameMaster = lobby.players.some((player) => player.id === userId && player.role === PLAYER_ROLES.MASTER);
    if (!isGameMaster) {
        throw { status: 403, message: 'Only the Game Master can start the game' };
    }

    const statistics = JSON.parse(JSON.stringify(defaultGameStatistics));
    for (const player of lobby.players) {
        statistics[GAME_KEYS.DRINKS_PER_PLAYER].push({ id: player.id, drinks: 0 });
        statistics[GAME_KEYS.ROUNDS_PER_PLAYER].push({ id: player.id, rounds: 0 });
    }

    let deck = createDeck(lobby.settings.shuffling);

    const players = lobby.players.map((player) => {
        const cards = deck.splice(0, 10).map((card) => ({
            ...card,
            flipped: true,
            played: false
        }));
        return {
            id: player.id,
            name: player.name,
            role: player.role,
            gender: player.gender,
            avatar: player.avatar,
            title: player.title,
            cards,
            turnInfo: {
                drinksPerPlayer: 0,
                hadTurn: false
            },
            joinedAt: player.joinedAt
        };
    });

    const cards = [];
    for (let row = 1; row <= 5; row++) {
        cards.push(
            deck.splice(0, row).map((card) => ({
                ...card,
                flipped: false,
            }))
        );
    }

    const turnOrder = players.map((player) => player.id);

    const newGame = {
        _id: lobby._id,
        name: lobby.name,
        status: GAME_STATUS.PHASE1,
        private: lobby.private,
        players,
        spectators: lobby.spectators || [],
        cards,
        gameInfo: {
            turnOrder,
            activePlayer: lobby.players[0]?.id || null,
            drinksPerRound: 0,
            roundNr: 1,
            isRowFlipped: false,
        },
        settings: lobby.settings,
        statistics,
        startedAt: new Date()
    }

    const result = await gameCollection.insertOne(newGame);

    await lobbyCollection.updateOne(
        { _id: new ObjectId(lobbyId) },
        { $set: { status: LOBBY_STATUS.STARTED } }
    );

    await updateStatistics(userId, {
        [USER_KEYS.GAMES_HOSTED]: { inc: 1 }
    });

    for (const player of lobby.players) {
        if (player.id !== userId) {
            await updateStatistics(player.id, {
                [USER_KEYS.GAMES_JOINED]: { inc: 1 }
            });
        }
    }

    const clients = lobbyConnections.get(lobbyId.toString());
    if (clients) {
        for (const [id, client] of clients.entries()) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'startUpdate',
                    data: { gameId: result.insertedId.toString() }
                }));
            }
        }
    }

    return { gameId: result.insertedId };
}

/**
 * Sends a lobby invitation to a friend. <br>
 * This function handles the logic for inviting a friend to join a lobby.
 * <br><br>
 * 
 * @function sendLobbyInvitation
 * @param {string} userId - ID of the user sending the invitation.
 * @param {string} friendId - ID of the friend to invite.
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object indicating success status.
 */
async function sendLobbyInvitation(userId, friendId, lobbyId) {
    const usersCollection = db.collection('users');
    const friendsCollection = db.collection('friends');
    const lobbyCollection = db.collection('lobbies');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
    );

    if (!user) {
        throw { status: 400, message: 'User not found' };
    }

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(friendId) },
    );

    if (!friend) {
        throw { status: 400, message: 'Friend not found' };
    }

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) }
    );

    if (!lobby) {
        throw { status: 400, message: 'Lobby not found' };
    }

    const isPlayer = lobby.players.some((player) => player.id === userId);
    const isSpectator = lobby.spectators.some((spectator) => spectator.id === userId);

    if (!(isPlayer || isSpectator)) {
        throw { status: 400, message: 'You are not in this lobby' };
    }

    if (lobby.status !== LOBBY_STATUS.WAITING) {
        throw { status: 400, message: 'Lobby is not open for joining' };
    }

    const isAllreadyInGame = lobby.players.some((player) => player.id === friendId) ||
        lobby.spectators.some((spectator) => spectator.id === friendId);

    if (isAllreadyInGame) {
        throw { status: 400, message: 'Friend is already in the lobby' };
    }

    const isAllreadyInvited = friend.invitations?.some((invitation) => invitation.lobbyId === lobbyId);

    if (isAllreadyInvited) {
        throw { status: 400, message: 'Friend is already invited to this lobby' };
    }

    const isJoining = lobby.isJoining.some((player) => player.id === friendId);

    if (isJoining) {
        throw { status: 400, message: 'Friend is already joining this lobby' };
    }

    await friendsCollection.updateOne(
        { _id: friend._id },
        { $push: { invitations: { lobbyId, player: user.username } } }
    );
    return { success: true, message: 'Lobby invitation sent' };
}

/**
 * Accepts a lobby invitation. <br>
 * This function handles the logic for accepting a lobby invitation and joining the lobby.
 * <br><br>
 * 
 * @function acceptLobbyInvitation
 * @param {string} userId - ID of the user accepting the invitation.
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object indicating success status and lobby ID.
 */
async function acceptLobbyInvitation(userId, lobbyId) {
    const friendsCollection = db.collection('friends');
    const lobbyCollection = db.collection('lobbies');

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
    );

    if (!friend) {
        throw { status: 400, message: 'User not found' };
    }

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) }
    );

    if (!lobby) {
        throw { status: 400, message: 'Lobby not found' };
    }

    const result = await authenticateLobby(userId, lobby.lobbyCode);

    await friendsCollection.updateOne(
        { _id: friend._id },
        { $pull: { invitations: { lobbyId } } }
    );

    return { success: true, lobby: result.lobby };
}

/**
 * Declines a lobby invitation. <br>
 * This function handles the logic for declining a lobby invitation.
 * <br><br>
 * 
 * @function declineLobbyInvitation
 * @param {string} userId - ID of the user declining the invitation.
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Object indicating success status.
 */
async function declineLobbyInvitation(userId, lobbyId) {
    const friendsCollection = db.collection('friends');

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
    );

    if (!friend) {
        throw { status: 400, message: 'User not found' };
    }

    await friendsCollection.updateOne(
        { _id: friend._id },
        { $pull: { invitations: { lobbyId } } }
    );

    return { success: true };
}

/**
 * Checks for lobby updates and notifies connected clients. <br>
 * This function retrieves the latest lobby information and sends updates to all connected clients. <br>
 * It handles both lobby updates and deletions based on the action specified.
 * <br><br>
 * 
 * @function checkLobbiesUpdate
 * @param {string} lobbyId - ID of the lobby.
 * @param {Array} clients - Array of WebSocket clients connected to the lobby.
 * @param {string} action - Action type (e.g., "update", "delete").
 * @returns {void}
 */
async function checkLobbiesUpdate(lobbyId, clients, action) {
    logTrace(`Checking lobby update for lobby ID: ${lobbyId.toString()} with action: ${action}`);

    let data;
    const collection = db.collection('lobbies');

    if (action === "delete") {
        data = { action, lobbyId: lobbyId };
    } else {
        const lobby = await collection.findOne(
            { _id: new ObjectId(lobbyId) },
        );

        if (!lobby) {
            logError(`Lobby with ID ${lobbyId.toString()} not found during update check`);
            return;
        }

        const playerCount = (lobby.players?.length || 0) + (lobby.isJoining?.length || 0);
        const playerLimit = lobby.settings?.playerLimit || 10;

        if (playerCount >= playerLimit || lobby.status !== LOBBY_STATUS.WAITING) {
            data = { action: 'delete', lobbyId: lobbyId };
        } else {
            const avatars = await Promise.all(
                (lobby.players || []).map(async (player) => ({
                    name: player?.name || 'Player',
                    avatar: player?.avatar || 'default.svg'
                }))
            );

            const format = {
                code: lobby.lobbyCode,
                name: lobby.name || 'Untitled Lobby',
                playerCount: lobby.players?.length || 0,
                settings: lobby.settings || {},
                avatars,
                createdAt: lobby.createdAt || new Date(),
                spectators: lobby.spectators || []
            };

            data = { action, lobby: format };
        }
    }

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'lobbiesUpdate',
                data: data
            }));
        }
    });
}

/**
 * Checks for specific lobby updates and notifies connected clients. <br>
 * This function checks for changes in players or spectators and sends the updated information to all connected clients. <br>
 * It ensures that clients are kept informed about the current state of the lobby. <br>
 * <br><br>
 * 
 * @function checkLobbyUpdate
 * @param {Array} keys - Array of keys that have been updated.
 * @param {Object} lobby - The current state of the lobby.
 * @param {Array} clients - Array of WebSocket clients connected to the lobby.
 * @returns {void}
 */
async function checkLobbyUpdate(keys, lobby, clients) {
    if (keys.some((key) =>
        key.startsWith('players') ||
        key.startsWith('spectators')
    )) {
        const players = lobby.players.map((player) => ({
            id: player.id,
            name: player.name,
            role: player.role,
            avatar: player.avatar,
            title: player.title
        }));

        const spectators = lobby.spectators.map((spectator) => ({
            id: spectator.id,
            name: spectator.name,
            avatar: spectator.avatar,
            title: spectator.title
        }));

        const data = { players, spectators };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'lobbyUpdate',
                    data
                }));
            }
        });
    }
}

export {
    checkIsSpectator,

    getLobbies,

    getPlayers,
    getSpectators,

    getLobbyMaster,
    getLobbyInfo,

    getLobbyInvitations,

    createLobby,
    authenticateLobby,

    leaveJoinLobby,
    joinLobby,

    kickPlayer,
    startGame,

    sendLobbyInvitation,
    acceptLobbyInvitation,
    declineLobbyInvitation,

    leaveLobby,

    checkLobbiesUpdate,
    checkLobbyUpdate,
}