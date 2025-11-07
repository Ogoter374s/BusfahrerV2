/**
 * @fileoverview Middleware for authenticating users using JWT tokens,
 * and verifying user access to lobbies and games.
 */

import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

// Database
import { db } from '../database/mongoClient.js';

// Constants
import { LOBBY_STATUS } from '../constants/defaultKeys.js';

// Utilities
import { logError } from '../utils/logger.js';

/**
 * Middleware to authenticate JWT token from cookies. <br>
 * Attaches decoded user information to req.user if valid. <br>
 * Sends 401 or 403 responses for missing or invalid tokens.
 * <br><br>
 * 
 * @function authenticateToken
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 * @returns {void}
 */
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    // Check if token is present
    if (!token) {
        logError('No token provided in request');
        return res
            .status(401)
            .json({ error: 'Unauthorized: No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            logError('Invalid or expired token');
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
};

/**
 * Checks if the user is authenticated based on the JWT token in cookies.
 * <br><br>
 * 
 * @function checkAuthentication
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response indicating authentication status.
 */
const checkAuthentication = (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.json({ isAuthenticated: false });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ isAuthenticated: true });
    } catch (error) {
        logError('Error verifying token:', error.message);
        return res.json({ isAuthenticated: false });
    }
}

/**
 * Extracts JWT token from request cookies.
 * <br><br>
 * 
 * @function extractTokenFromCookies
 * @param {Object} req - Express request object.
 * @returns {string|null} JWT token if present, otherwise null.
 */
const extractTokenFromCookies = (req) => {
    const cookies = req.headers.cookie;
    if (!cookies) return null;

    // Parse cookies to find the token
    const parsedCookies = cookies.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.split('=').map((c) => c.trim());
        acc[name] = value;
        return acc;
    }, {});

    return parsedCookies.token || null;
};

/**
 * Authenticates if a user can join a lobby.
 * <br><br>
 * 
 * @function authenticateLobby
 * @param {string} userId - ID of the user.
 * @param {string} lobbyId - ID of the lobby.
 * @returns {Object} Result of authentication.
 * @throws {Object} Error object with status and message if authentication fails.
 */
async function authenticateLobby(userId, lobbyId) {
    const lobbyCollection = db.collection('lobbies');

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { players: 1, spectators: 1, isJoining: 1, status: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    if (lobby.players?.length + lobby.isJoining?.length >= 10) {
        throw { status: 400, message: 'Lobby is full' };
    }

    const isPlayerInGame = lobby.players.some(
        (player) => player.id === userId
    );

    const isSpectatorInGame = lobby.spectators.some(
        (spectator) => spectator.id === userId
    );

    // Check if user is already in the lobby or joining
    if (!(isPlayerInGame || isSpectatorInGame)) {
        if (lobby.status === LOBBY_STATUS.WAITING) {
            const isPlayerJoining = lobby.isJoining?.some(
                (player) => player.id === userId
            );

            if (!isPlayerJoining) {
                throw { status: 400, message: 'Player is not joining the lobby and is not in the lobby already' };
            }
        } else {
            throw { status: 400, message: 'Player is not in the lobby' };
        }
    }

    return { success: true };
}

/**
 * Authenticates if a user is part of a game.
 * <br><br>
 * 
 * @function authenticateGame
 * @param {string} userId - ID of the user.
 * @param {string} gameId - ID of the game.
 * @returns {Object} Result of authentication.
 * @throws {Object} Error object with status and message if authentication fails.
 */
async function authenticateGame(userId, gameId) {
    const gameCollection = db.collection('games');

    const game = await gameCollection.findOne(
        { _id: new ObjectId(gameId) },
        { projection: { players: 1, spectators: 1 } }
    );

    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }

    const isPlayerInGame = game.players.some(
        (player) => player.id === userId
    );

    const isSpectatorInGame = game.spectators.some(
        (spectator) => spectator.id === userId
    );

    if (!(isPlayerInGame || isSpectatorInGame)) {
        throw { status: 400, message: 'Player not in game' };
    }

    return { success: true };
}

export {
    authenticateToken,
    extractTokenFromCookies,
    checkAuthentication,

    authenticateLobby,
    authenticateGame
}