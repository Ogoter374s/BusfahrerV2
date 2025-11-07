/**
 * @fileoverview MongoDB client setup and statistics update functions.
 */

import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Services
import { checkAchievements } from '../services/achievementService.js';

// Constants
import { defaultStatistics } from '../constants/defaultData.js';

// Utilities
import { logInfo, logError, logTrace } from '../utils/logger.js';

dotenv.config();

// MongoDB Client Setup
const client = new MongoClient(process.env.MONGO_URI, {
    maxPoolSize: 10,
});

const db = client.db(process.env.DATABASE);

/**
 * Connect to MongoDB and handle connection errors.
 * @function connectToMongoDB
 * @returns {Promise<void>}
 */
async function connectToMongoDB() {
    try {
        await client.connect();
        logInfo('Connected to MongoDB');
    } catch (error) {
        logError(`MongoDB connection error: ${error.stack || error.message}`);
    }
}

/**
 * Update user statistics with various operations.
 * @function updateStatistics
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updates - The statistics updates to apply.
 * @returns {Promise<void>}
 */
async function updateStatistics(userId, updates) {
    const $inc = {};
    const $set = {};
    const $max = {};
    const $min = {};
    const affectedFields = [];

    await updateUserStatistics(userId);

    for (const [key, op] of Object.entries(updates)) {
        if (typeof op === 'object') {

            // Handle numeric increment
            if ('inc' in op) {
                $inc[`statistics.${key}`] = op.inc;
                affectedFields.push(key);
            }

            // Handle set operations
            if ('set' in op) {
                $set[`statistics.${key}`] = op.set;
                affectedFields.push(key);
            }

            // Handle max operations
            if ('max' in op) {
                $max[`statistics.${key}`] = op.max;
                affectedFields.push(key);
            }

            // Handle min operations
            if ('min' in op) {
                $min[`statistics.${key}`] = op.min;
                affectedFields.push(key);
            }
        }
    }

    const mUpdate = {};
    if (Object.keys($inc).length) mUpdate.$inc = $inc;
    if (Object.keys($set).length) mUpdate.$set = $set;
    if (Object.keys($max).length) mUpdate.$max = $max;
    if (Object.keys($min).length) mUpdate.$min = $min;

    // Update user document if there are any changes
    if (Object.keys(mUpdate).length > 0) {
        const updateUser = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(userId) },
            mUpdate,
            { returnDocument: 'after' },
        );

        // Update achievements if user was modified
        if (updateUser) {
            await checkAchievements(updateUser);
        }
    }
}

/**
 * Ensure user statistics document has all default fields.
 * @function updateUserStatistics
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<void>}
 */
async function updateUserStatistics(userId) {
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const existingStats = user.statistics || {};

    // Identify missing fields
    const missingFields = Object.entries(defaultStatistics)
        .filter(([key]) => !(key in existingStats))
        .reduce((acc, [key, value]) => {
            acc[`statistics.${key}`] = value;
            return acc;
        },
            {});

    // Update user document with missing fields
    if (Object.keys(missingFields).length > 0) {
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: missingFields },
        );
    }
}

export {
    db,
    connectToMongoDB,
    
    updateStatistics,
};
