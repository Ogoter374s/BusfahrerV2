
import { defaultStatistics, userSounds, userUploadSounds } from "../constants/defaultData.js";

export const UserSchema = {
    // Basic info
    username: "",                           // Unique username
    password: "",                           // Hashed password
    createdAt: null,                        // Account creation date
    lastLogin: null,                        // Last login date

    // Profile & customization
    avatar: {                               // Avatar Object
        avatarName: "default_avatar.svg",   // Avatar file name
        uploadedAvatar: "",                 // Uploaded avatar file name
        frame: "none.svg",                  // Frame file name
    },                         
    sound: {                                // Sound Object
        soundEnabled: true,                 // Whether sound is enabled
        eventSoundEnabled: true,            // Whether event sounds are enabled
        sounds: userSounds,                 // Array of sound file names
        uploadedSounds: userUploadSounds,   // Array of uploaded sound file names
    },                          
    cardTheme: {                            // Card theme Object
        themeName: "default.svg",           // Theme file name
        color1: "#ffffff",                  // Primary color
        color2: "#ff4538",                  // Secondary color
    },                      
    level: {                                // Level Object
        levelNr: 1,                         // Current level number
        xpCurrent: 0,                       // Current XP points
        xpPoints: 0,                        // Total XP points
    },                          

    // Statistics
    statistics: defaultStatistics,          // Statistics Object

    // Titles & achievements
    titles: [],                             // Array of title objects
    achievements: [],                       // Array of achievement objects
};

export const FriendSchema = {
    userId: null,                           // Reference to User _id
    friendCode: "",                         // Unique friend code

    friends: [],                            // Array of friend userIds
    blockedUsers: [],                       // Array of blocked userIds
    sentRequests: [],                       // Array of sent friend request userIds
    pendingRequests: [],                    // Array of pending friend request userIds
    invitations: [],                        // Array of invitation objects
};