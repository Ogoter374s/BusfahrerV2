/**
 * @fileoverview Utility functions for managing friend codes.
 */

// Database
import { db } from '../database/mongoClient.js';

// Utilities
import { generateCode } from './helperUtils.js';

/**
 * Generates a unique friend code that does not already exist in the database.
 * @function generateUniqueFriendCode
 * @returns {Promise<string>} - A promise that resolves to a unique friend code.
 */
export async function generateUniqueFriendCode() {
    const users = db.collection('users');

    let code;
    let exists = true;

    while (exists) {
        code = generateCode(6);
        exists = await users.findOne({ friendCode: code });
    }

    return code;
}
