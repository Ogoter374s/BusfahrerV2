/**
 * @fileoverview Account service functions
 * <br><br>
 * This module provides functions to manage user account information,
 * including retrieving account details, uploading avatars, changing card themes,
 * and updating titles. <br>
 * It interacts with the MongoDB database to perform these operations. <br>
 */

import fs from 'fs';
import sharp from 'sharp';
import path from 'path';
import WebSocket from 'ws';
import { ObjectId } from 'mongodb';

// Database
import { db, updateStatistics } from '../database/mongoClient.js';

// Middleware
import { uploadDir } from '../middleware/uploadAvatar.js';

// Constants
import { USER_KEYS } from '../constants/defaultKeys.js';

// Utilities
import { logInfo, logTrace } from '../utils/logger.js';

/**
 * Get user account information
 * <br><br>
 * Retrieves the account information for the specified user. <br>
 * Fetches statistics, avatar, titles, and username.
 * <br><br>
 * 
 * @function getUserAccount
 * @param {string} userId - The ID of the user
 * @returns {Object} An object containing success status and account data
 */
async function getUserAccount(userId) {
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        {
            projection: {
                statistics: 1,
                avatar: 1,
                uploadedAvatar: 1,
                titles: 1,
                username: 1
            }
        }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const format = user.titles || [];
    const active = format.find((title) => title.active) || null;

    const account = {
        statistics: user.statistics || {},

        avatar: user.avatar || 'default.svg',
        uploadedAvatar: user.uploadedAvatar || '',

        titles: format || [],
        selectedTitle: active,

        username: user.username || 'Player'
    };

    return { success: true, data: account };
}

/**
 * Get card theme for a user
 * <br><br>
 * Returns the card theme and colors for the specified user.
 * <br><br>
 * 
 * @function getCardTheme
 * @param {string} userId - The ID of the user
 * @returns {Object} An object containing success status and card theme data
 */
async function getCardTheme(userId) {
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { cardTheme: 1, color1: 1, color2: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const data = {
        theme: user.cardTheme || 'default',
        color1: user.color1 || '#ffffff',
        color2: user.color2 || '#ff4538'
    };

    return { success: true, cardTheme: data };
}

/**
 * Upload a new avatar for the user
 * <br><br>
 * Handles uploading and cropping of a new avatar image for the user.
 * <br><br>
 * 
 * @function uploadAvatar
 * @param {string} userId - The ID of the user
 * @param {Object} file - The uploaded file object
 * @param {string} cropData - JSON string containing crop data
 * @returns {string} The URL of the new avatar
 */
async function uploadAvatar(userId, file, cropData) {
    const usersCollection = db.collection('users');
    const friendsCollection = db.collection('friends');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { avatar: 1, uploadedAvatar: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
    );

    if (!friend) {
        throw { status: 404, message: 'User not found' };
    }

    // Delete old uploaded avatar if exists
    if (user.uploadedAvatar && user.uploadedAvatar.trim() !== '') {
        const oldAvatarPath = path.join(uploadDir, user.uploadedAvatar);
        if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
        }
    }

    let newAvatarUrl = file.filename;
    const ext = path.extname(file.originalname).toLowerCase();

    // Handle cropping for GIF images
    if (ext === ".gif" && cropData) {
        const outFile = `${userId}_${Date.now()}.gif`;
        const outPath = path.join(uploadDir, outFile);

        let img = sharp(file.path, { animated: true });
        const { x, y, width, height } = JSON.parse(cropData);
        img = img.extract({
            left: Math.round(x),
            top: Math.round(y),
            width: Math.round(width),
            height: Math.round(height)
        });

        await img.gif({ reoptimise: true }).toFile(outPath);
        fs.unlinkSync(file.path);
        newAvatarUrl = outFile;
    }

    // Automatically set the uploaded avatar as the user's avatar
    user.uploadedAvatar = newAvatarUrl;
    user.avatar = newAvatarUrl;

    await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                avatar: user.avatar,
                uploadedAvatar: user.uploadedAvatar
            }
        }
    );

    // Update friend objects
    for (const f of friend.friends) {
        await friendsCollection.updateOne(
            { userId: f.userId, 'friends.userId': user._id },
            {
                $set: { 'friends.$.avatar': newAvatarUrl }
            }
        );
    }

    // Update lobby objects
    await db.collection('lobbies').updateMany(
        { 'players.id': user._id.toString() },
        {
            $set: { 'players.$[elem].avatar': newAvatarUrl },
        },
        {
            arrayFilters: [{ 'elem.id': user._id.toString() }],
        }
    );

    // Update game objects
    await db.collection('games').updateMany(
        { 'players.id': user._id.toString() },
        {
            $set: { 'players.$[elem].avatar': newAvatarUrl },
        },
        {
            arrayFilters: [{ 'elem.id': user._id.toString() }],
        }
    );

    await updateStatistics(user._id.toString(), {
        [USER_KEYS.UPLOADED_AVATAR]: { inc: 1 },
        [USER_KEYS.AVATAR_CHANGED]: { inc: 1 }
    });

    return newAvatarUrl;
}

/**
 * Save avatar for user
 * <br><br>
 * Saves the provided avatar URL for the user and updates related records.
 * <br><br>
 * 
 * @function saveAvatar
 * @param {string} userId - The ID of the user
 * @param {string} avatar - The URL of the new avatar
 * @returns {string} The URL of the saved avatar
 */
async function saveAvatar(userId, avatar) {
    const usersCollection = db.collection('users');
    const friendsCollection = db.collection('friends');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { avatar: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
    );

    if (!friend) {
        throw { status: 404, message: 'User not found' };
    }

    if (!avatar || avatar.trim() === '') {
        throw { status: 400, message: 'Invalid avatar' };
    }

    const avatarUrl = avatar;

    // Check if avatar has changed don't call update if not
    const changed = user.avatar === avatar;
    if (changed) {
        logInfo(`User ${userId} changed avatar to ${avatarUrl}`);

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { avatar: avatarUrl } }
        );

        // Update friend objects
        for (const f of friend.friends) {
            await friendsCollection.updateOne(
                { userId: f.userId, 'friends.userId': user._id },
                {
                    $set: { 'friends.$.avatar': avatarUrl }
                }
            );
        }

        // Update lobby objects
        await db.collection('lobbies').updateMany(
            { 'players.id': user._id.toString() },
            {
                $set: { 'players.$[elem].avatar': avatarUrl },
            },
            {
                arrayFilters: [{ 'elem.id': user._id.toString() }],
            }
        );

        // Update game objects
        await db.collection('games').updateMany(
            { 'players.id': user._id.toString() },
            {
                $set: { 'players.$[elem].avatar': avatarUrl },
            },
            {
                arrayFilters: [{ 'elem.id': user._id.toString() }],
            }
        );

        await updateStatistics(user._id.toString(), {
            [USER_KEYS.AVATAR_CHANGED]: { inc: 1 }
        });
    }

    return avatarUrl;
}

/**
 * Change card theme for user
 * <br><br>
 * Updates the card theme and colors for the specified user.
 * <br><br>
 * 
 * @function changeCardTheme
 * @param {string} userId - The ID of the user
 * @param {string} theme - The new card theme
 * @param {string} color1 - The first color for the card theme
 * @param {string} color2 - The second color for the card theme
 * @returns {boolean} True if the update was successful
 */
async function changeCardTheme(userId, theme, color1, color2) {
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { cardTheme: 1, color1: 1, color2: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    // Check if theme has changed, don't call update if not
    if (user.cardTheme !== theme) {

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { cardTheme: theme, color1, color2 } }
        );

        await updateStatistics(user._id.toString(), {
            [USER_KEYS.CHANGED_THEME]: { inc: 1 }
        });
    }

    return true;
}

/**
 * Change title for user
 * <br><br>
 * Updates the active title for the specified user.
 * <br><br>
 * 
 * @function changeTitle
 * @param {string} userId - The ID of the user
 * @param {string} title - The name of the title to set as active
 * @returns {boolean} True if the update was successful
 */
async function changeTitle(userId, title) {
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { titles: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const titleIdx = user.titles.findIndex((t) => t.name === title);

    if (titleIdx === -1) {
        throw { status: 404, message: 'Title not found' };
    }

    // Check if title has changed, don't call update if not
    if (!user.titles[titleIdx].active) {

        // Deactivate all other titles
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { 'titles.$[].active': false } }
        );

        await usersCollection.updateOne(
            { _id: user._id, "titles.name": title },
            { $set: { 'titles.$.active': true } },
        );

        await updateStatistics(user._id.toString(), {
            [USER_KEYS.TITLE_CHANGED]: { inc: 1 }
        });
    }

    return true;
}

/**
 * Check for account updates and notify clients
 * <br><br>
 * Checks if any relevant account fields have been updated and notifies connected clients via WebSocket.
 * <br><br>
 * 
 * @function checkAccountUpdate
 * @param {Array} keys - The list of updated keys
 * @param {Object} user - The user object containing updated data
 * @param {Array} clients - The list of connected WebSocket clients
 */
function checkAccountUpdate(keys, user, clients) {
    logTrace(`checkAccountUpdate called with keys: ${keys.join(', ')}`);

    if (keys.some((key) =>
        key.startsWith('statistics') ||
        key.startsWith('titles') ||
        key.startsWith('uploadedAvatar')
    )) {
        const data = {
            statistics: user.statistics || {},
            titles: user.titles || [],
            avatar: user.uploadedAvatar || '',
        };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'accountUpdate',
                    data
                }));
            }
        });
    };
}

export {
    getUserAccount,
    getCardTheme,

    uploadAvatar,
    saveAvatar,

    changeCardTheme,

    changeTitle,

    checkAccountUpdate
};
