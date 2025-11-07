/**
 * @fileoverview Achievement service for managing user achievements.
 * <br><br>
 * This module provides functions to fetch user achievements from the database,
 * check and update achievements based on user statistics, and handle related logic.
 * <br><br>
 * It interacts with the MongoDB database to retrieve and update user achievement data.
 */

import { ObjectId } from 'mongodb';

// Database
import { db } from '../database/mongoClient.js';

// Utilities
import { logTrace, logInfo } from '../utils/logger.js';

/**
 * Fetches the achievements of a user by their userId.
 * <br><br>
 * This function retrieves the user's achievements from the database,
 * compares them with the master list of achievements, and returns
 * the relevant achievement data.
 * <br><br>
 * 
 * @function getUserAchievements
 * @param {string} userId - The ID of the user whose achievements are to be fetched.
 * @returns {Object} An object containing a success flag and the list of achievements.
 * @throws Will throw an error if the user is not found or if a database error occurs.
 */
async function getUserAchievements(userId) {
    const usersCollection = db.collection('users');
    const achievementsCollection = db.collection('achievements');

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { achievements: 1, statistics: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const achievementList = await achievementsCollection.find({}).toArray();
    const achievements = [];

    for (const achievement of achievementList) {
        const unlocked = user.achievements.some((a) =>
            a.id.toString() === achievement._id.toString(),
        );

        achievements.push({
            id: achievement._id,
            icon: achievement.icon,
            name: achievement.name,
            title: achievement.titleUnlocked,
            unlocked,
            description: achievement.description,
            conditions: Object.entries(achievement.conditions).map(
                ([key, required]) => ({
                    key,
                    required,
                    current: unlocked
                        ? required
                        : user.statistics?.[key] || 0,
                }),
            ),
        });
    }

    return { success: true, achievements: achievements || [] };
}

/**
 * Checks and updates user achievements based on their statistics.
 * <br><br>
 * This function compares the user's statistics against the conditions defined in each achievement. <br>
 * If the user meets all conditions for an achievement they haven't unlocked yet,
 * the achievement is marked as unlocked and added to their profile.
 * <br><br>
 * 
 * @function checkAchievements
 * @param {Object} user - The user object containing statistics and achievements.
 * @returns {void}
 * @throws Will throw an error if a database operation fails.
 */
async function checkAchievements(user) {
    const allAchievements = await db.collection("achievements").find({}).toArray();

    const unlocked = new Set(user.achievements.map(a => a.name));
    const update = [];

    logTrace(`Checking achievements for user ${user._id}. Currently unlocked: ${[...unlocked].join(', ')}`);

    for (const achievement of allAchievements) {
        if (unlocked.has(achievement.name)) continue;

        const meetsAll = Object.entries(achievement.conditions).every(([key, value]) => {
            return user.statistics?.[key] >= value;
        });

        if (meetsAll) {
            logInfo(`User ${user._id} unlocked achievement: ${achievement.name}`);

            update.push({
                id: achievement._id,
                name: achievement.name,
                unlockedAt: new Date(),
            });

            user.titles.push(achievement.titleUnlocked);
        }
    }

    if (update.length > 0) {
        await db.collection('users').updateOne(
            { _id: new ObjectId(user._id) },
            {
                $push: { achievements: { $each: update } },
                $set: { titles: user.titles },
            }
        );
    }
}

export {
    getUserAchievements,

    checkAchievements,
}