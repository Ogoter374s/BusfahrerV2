
import { UserSchema } from "./dataModels.js";

function migrateUserData(userDoc) {
    const migrate = (schemaObj, userObj) => {
        const result = {};

        // Add missing fields & keep vaild fields
        for(const key in schemaObj) {
            if(userObj[key] === undefined) {
                result[key] = schemaObj[key];
            } else if(
                typeof schemaObj[key] === 'object' &&
                !Array.isArray(schemaObj[key]) &&
                schemaObj[key] !== null
            ) {
                result[key] = migrate(schemaObj[key], userObj[key] || {});
            } else {
                result[key] = userObj[key];
            }
        }

        return result;
    };

    return migrate(UserSchema, userDoc);
}

function removeUnknownFields(schemaObj, userObj) {
    const cleaned = {};

    for(const key in userObj) {
        if(schemaObj.hasOwnProperty(key)) {
            cleaned[key] = userObj[key];
        }
    }
    return cleaned;
}

export function checkUserData(userDoc) {
    const migratedData = migrateUserData(userDoc);
    const cleaned = removeUnknownFields(UserSchema, migratedData);

    cleaned._id = userDoc._id; // Preserve original _id

    return cleaned;
}

export function getUnknownFields(schemaObj, userObj) { 
    return Object.keys(userObj).filter(k => 
        !schemaObj.hasOwnProperty(k) && k !== "_id"
    );
}