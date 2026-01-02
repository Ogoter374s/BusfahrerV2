
import fs from 'fs';
import path from 'path';
import * as mm from "music-metadata";
import { ObjectId } from "mongodb";

// Database
import { db, updateStatistics } from "../database/mongoClient.js";

// Middleware
import { uploadDir } from '../middleware/uploadSound.js';

// Constants
import { USER_KEYS, SOUND_KEYS } from '../constants/defaultKeys.js';

async function getSounds(userId) {
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { sound: 1 } },
    );

    if (!user) {
        throw { status: 404, message: "User not found." };
    }

    return { sounds: user.sound.sounds };
}

async function getUploadedSounds(userId) {
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { sound: 1 } },
    );

    if (!user) {
        throw { status: 404, message: "User not found." };
    }

    return { sounds: user.sound.uploadedSounds };
}

async function setSound(userId, soundType, sound) {
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        throw { status: 404, message: "User not found." };
    }

    if(!Object.values(SOUND_KEYS).includes(soundType)) {
        throw { status: 400, message: "Invalid sound type." };
    }

    const updatedSounds = user.sound.sounds.map(s => 
        s.type === soundType
            ? { ...s, name: sound }
            : s
    );

    await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { "sound.sounds": updatedSounds } },
    );

    await updateStatistics(userId, {
        [USER_KEYS.CHANGED_SOUND]: { inc: 1 }
    });

    return { success: true };
}

async function uploadSound(userId, soundType, file) {
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        throw { status: 404, message: "User not found." };
    }

    if(!Object.values(SOUND_KEYS).includes(soundType)) {
        throw { status: 400, message: "Invalid sound type." };
    }

    // Delete old uploaded sound if exists
    const oldUpload = user.sound.uploadedSounds.find(s => s.type === soundType);
    if(oldUpload && oldUpload.name !== '') {
        const oldPath = path.join(uploadDir, oldUpload.name);
        if(fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
        }
    }

    const newSoundPath = path.join(uploadDir, file.filename);
    const meta = await mm.parseFile(file.path);

    if(meta.format.duration > process.env.MAX_AUDIO_DURATION_SEC) {
        fs.unlinkSync(newSoundPath);
        throw { status: 400, message: `Audio duration exceeds maximum of ${process.env.MAX_AUDIO_DURATION_SEC} seconds.` };
    }

    const updatedUploaded = [
        ...user.sound.uploadedSounds.filter(s => s.type !== soundType),
        { type: soundType, name: file.filename }
    ];

    const updatedDefaultSounds = user.sound.sounds.map(s =>
        s.type === soundType
            ? { ...s, name: file.filename }
            : s
    );

    await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
            $set: { 
                "sound.uploadedSounds": updatedUploaded,
                "sound.sounds": updatedDefaultSounds,
            } 
        },
    );

    return { success: true, soundUrl: file.filename };
}

export {
    getSounds,
    getUploadedSounds,
    setSound,
    uploadSound,
}