
import { userSounds, userUploadSounds, defaultStatistics} from "../constants/defaultData.js";

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
    },                         
    sound: {                                // Sound Object
        soundEnabled: true,                 // Whether sound is enabled
        eventSoundEnabled: true,            // Whether event sounds are enabled
        sounds: userSounds,                 // Array of sound file names
        uploadedSounds: userUploadSounds,   // Array of uploaded sound file names
    },                          
    cardTheme: {                            // Card theme Object
        themeName: "default.svg",           // Theme file name
        color1: "#ffffff",                // Primary color
        color2: "#ff4538",                // Secondary color
    },                      
    level: {                                // Level Object
        levelNr: 1,                         // Current level number
        maxLevelNr: 1,                      // Maximum level number the player has reached
        xpCurrent: 0,                       // Current XP points
        xpPoints: 0,                        // Total XP points
    },                          

    // Statistics
    statistics: defaultStatistics,        // Array of statistics objects

    // Titles & achievements
    titles: [],                             // Array of title objects
    achievements: [],                       // Array of achievement objects
    frames: [],                             // Array of frame objects
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

export const PerkSchema = {
    userId: null,                           // Reference to User _id

    levelPerks: {                           // Object containing perk arrays for each category
        "game": [],                         // Array of perk objects for game category
        "luck": [],                         // Array of perk objects for luck category
        "player": [],                       // Array of perk objects for player category
    },

    perkBuilds: [],                         // Array of perk build objects
    permantPerks: [],                       // Array of permanent perk objects
    unlockedPerks: [],                      // Array of unlocked perk objects
};

export const PerkBuildSchema = {
    buildName: "",                          // Name of the perk build
    perks: [],                              // Array of perk IDs included in the build
    active: false,                          // Whether this build is currently active
};