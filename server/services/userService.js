/**
 * @fileoverview User Service - Handles user registration, login, and logout functionalities.
 * <br><br>
 * This module provides functions to register new users, authenticate existing users,
 * and manage user sessions through JWT tokens.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Database
import { db, updateStatistics } from '../database/mongoClient.js';

// Constants
import { USER_KEYS } from '../constants/defaultKeys.js';
import { defaultStatistics, defaultTitle } from '../constants/defaultData.js';

// Utilities
import { generateUniqueFriendCode } from '../utils/friendUtils.js';

/**
 * Registers a new user in the system. <br>
 * Hashes the password, creates user and friend documents, and generates a JWT token. <br>
 * Throws an error if the username already exists.
 * <br><br>
 * 
 * @function registerUser
 * @param {string} username - The desired username for the new user.
 * @param {string} password - The plaintext password for the new user.
 * @returns {Object} An object containing the JWT token for the newly registered user.
 */
async function registerUser(username, password) {
    const usersCollection = db.collection('users');
    const friendsCollection = db.collection('friends');

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
        throw { status: 400, message: 'Username already exists' };
    }

    const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const friendCode = await generateUniqueFriendCode();

    const result = await usersCollection.insertOne({
        username,
        password: hashedPassword,
        createdAt: new Date(),
        lastLogin: new Date(),
        avatar: 'default.svg',
        uploadedAvatar: '',
        clickSound: 'ui-click.mp3',
        cardTheme: 'default.svg',
        color1: '#ffffff',
        color2: '#ff4538',
        statistics: defaultStatistics,
        titles: defaultTitle,
        achievements: [],
    });

    await friendsCollection.insertOne({
        userId: result.insertedId,
        friendCode,
        friends: [],
        blockedUsers: [],
        sentRequests: [],
        pendingRequests: [],
        invitations: [],
    });

    const token = jwt.sign(
        { userId: result.insertedId.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '18h' },
    );

    return { token };
}

/**
 * Logs in a user by verifying credentials and updating login statistics. <br>
 * Generates a JWT token upon successful authentication. <br>
 * Updates the user's daily login streak based on their last login date.
 * <br><br>
 * 
 * @function loginUser
 * @param {string} username - The username of the user attempting to log in.
 * @param {string} password - The plaintext password provided for authentication.
 * @returns {Object} An object containing the JWT token for the authenticated user.
 */
async function loginUser(username, password) {
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });
    if (!user) {
        throw { status: 400, message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw { status: 400, message: 'Wrong Password' };
    }

    const now = new Date();
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

    let newStreak = 1;
    if (lastLogin) {
        const diffInTime = now.getTime() - lastLogin.getTime();
        const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

        if (diffInDays === 1) {
            newStreak = (user.statistics?.dailyLoginStreak || 1) + 1;
        } else if (diffInDays === 0) {
            newStreak = user.statistics?.dailyLoginStreak || 1;
        }
    }

    await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: now } }
    );

    await updateStatistics(user._id.toString(), {
        [USER_KEYS.DAILY_LOGIN_STREAK]: { set: newStreak },
    });

    const token = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '12h' },
    );

    return { token };
}

/**
 * Logs out a user by clearing the authentication cookie. <br>
 * This function does not require any parameters other than the response object to clear the cookie.
 * <br><br>
 * 
 * @function logoutUser
 * @param {Object} res - The Express response object used to clear the authentication cookie.
 * @returns {void}
 */
async function logoutUser(res) {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
    });
}

export {
    registerUser,

    loginUser,
    logoutUser,
};