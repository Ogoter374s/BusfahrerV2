import { UserSchema, FriendSchema, PerkSchema } from './dataModels.js';

// Deep-clones default schema values to avoid shared references (arrays/objects)
function cloneDefault(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

// Migrate userObj to match schemaObj
// - Adds missing fields from schema defaults
// - Recursively migrates nested objects
// - Keeps existing valid fields
function migrateToSchema(schemaObj, userObj) {
    const schemaIsPlainObject =
        typeof schemaObj === 'object' &&
        schemaObj !== null &&
        !Array.isArray(schemaObj);

    if (!schemaIsPlainObject) {
        return userObj === undefined ? cloneDefault(schemaObj) : userObj;
    }

    const result = {};

    const safeUserObj =
        typeof userObj === 'object' &&
        userObj !== null &&
        !Array.isArray(userObj)
            ? userObj
            : {};

    for (const key of Object.keys(schemaObj)) {
        if (safeUserObj[key] === undefined) {
            result[key] = cloneDefault(schemaObj[key]);
            continue;
        }

        const schemaVal = schemaObj[key];
        const userVal = safeUserObj[key];

        const schemaValIsPlainObject =
            typeof schemaVal === 'object' &&
            schemaVal !== null &&
            !Array.isArray(schemaVal);

        result[key] = schemaValIsPlainObject
            ? migrateToSchema(schemaVal, userVal)
            : userVal;
    }

    return result;
}

// Removes keys that don't exist in schemaObj
function removeUnknownDeep(schemaObj, userObj) {
    const schemaIsPlainObject =
        typeof schemaObj === 'object' &&
        schemaObj !== null &&
        !Array.isArray(schemaObj);

    if (!schemaIsPlainObject) return userObj;

    const cleaned = {};
    const safeUserObj =
        typeof userObj === 'object' &&
        userObj !== null &&
        !Array.isArray(userObj)
            ? userObj
            : {};

    for (const key of Object.keys(safeUserObj)) {
        if (!Object.prototype.hasOwnProperty.call(schemaObj, key)) continue;

        const schemaVal = schemaObj[key];
        const userVal = safeUserObj[key];

        const schemaValIsPlainObject =
            typeof schemaVal === 'object' &&
            schemaVal !== null &&
            !Array.isArray(schemaVal);

        cleaned[key] = schemaValIsPlainObject
            ? removeUnknownDeep(schemaVal, userVal)
            : userVal;
    }

    return cleaned;
}

// Normalizes a document to a schema:
// - migrate missing fields
// - remove unknown fields
// - preserves selected keys (like _id, userId)
function normalizeDocToSchema(schemaObj, doc, preserveKeys = ['_id']) {
    const migrated = migrateToSchema(schemaObj, doc);
    const cleaned = removeUnknownDeep(schemaObj, migrated);

    for (const k of preserveKeys) {
        if (doc && doc[k] !== undefined) cleaned[k] = doc[k];
    }

    return cleaned;
}

// #region Schema validation functions

export function checkUserData(userDoc) {
    return normalizeDocToSchema(UserSchema, userDoc, ['_id']);
}

export function checkFriendData(friendDoc) {
    // friend docs are linked, so preserve both _id and userId
    return normalizeDocToSchema(FriendSchema, friendDoc, ['_id', 'userId']);
}

export function checkPerkData(perkDoc) {
    return normalizeDocToSchema(PerkSchema, perkDoc, ['_id', 'userId']);
}

// #endregion

export async function loadOrCreateLinkedDoc(collection, userId, checker) {
    const doc = await collection.findOne({ userId });

    // Base always contains the correct userId if doc is missing
    const fixed = checker(doc || { userId });

    fixed.userId = userId;

    await collection.updateOne({ userId }, { $set: fixed }, { upsert: true });

    return fixed;
}
