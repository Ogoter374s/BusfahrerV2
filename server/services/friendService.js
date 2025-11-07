/**
 * @fileoverview Service functions for managing friend relationships and interactions.
 * <br><br>
 * This module provides functions to handle operations such as retrieving friend requests,
 * friends list, sending/accepting/rejecting friend requests, removing friends,
 * marking messages as read, and sending messages between friends.
 * <br><br>
 * It interacts with the MongoDB database to perform CRUD operations on friend data.
 * <br><br>
 * Each function is designed to handle specific aspects of friend management,
 * ensuring data integrity and proper error handling throughout the process.
 * <br><br>
 * It also includes a function to check for updates in friend data and notify connected clients via WebSocket.
 */

import WebSocket from 'ws';
import { ObjectId } from 'mongodb';

// Database
import { db, updateStatistics } from '../database/mongoClient.js';

// Constants
import { USER_KEYS } from '../constants/defaultKeys.js';

// Utilities
import { logTrace } from '../utils/logger.js';

/**
 * Get pending friend requests for a user. 
 * This function retrieves the list of pending friend requests from the database for the specified user ID.
 * <br> <br>
 * 
 * @function getFriendRequests
 * @param {string} userId - The ID of the user.
 * @returns {Object} - An object containing success status and pending requests.
 */
async function getFriendRequests(userId) {
    const friendsCollection = db.collection('friends');

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
        {
            projection: {
                pendingRequests: 1
            }
        }
    );

    if (!friend) {
        throw { status: 404, message: 'User not found' };
    }

    return { success: true, pending: friend.pendingRequests || [] };
};

/**
 * Get friends list and friend code for a user. <br>
 * This function retrieves the friends list and friend code from the database for the specified user ID.
 * <br> <br>
 * 
 * @function getFriends
 * @param {string} id - The ID of the user.
 * @returns {Object} - An object containing success status, friends list, and friend code.
 */
async function getFriends(id) {
    const friendsCollection = db.collection('friends');

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(id) },
        {
            projection: {
                friends: 1,
                friendCode: 1,
            }
        }
    );

    if (!friend) {
        throw { status: 404, message: 'Friend Collection not found' };
    }

    const friends = friend.friends.map((f) => ({
        userId: f.userId,
        username: f.username,
        avatar: f.avatar,
        messages: (f.messages || []).splice(-13),
        unreadCount: f.unreadCount || 0,
    }));

    return { success: true, friends, friendCode: friend.friendCode };
}

/**
 * Sends a friend request from one user to another using a friend code. <br>
 * It checks for various conditions such as self-request, existing friendship, and pending requests before sending the request. <br>
 * Updates both users' statistics to reflect the sent and received friend requests.
 * <br> <br>
 * 
 * @function sendFriendRequest
 * @param {string} userId - The ID of the user sending the friend request.
 * @param {string} friendCode - The friend code of the user to whom the request is being sent.
 * @returns {Object} - An object containing success status and a message.
 */
async function sendFriendRequest(userId, friendCode) {
    const friendsCollection = db.collection('friends');
    const usersCollection = db.collection('users');

    if (!friendCode) {
        throw { status: 400, message: 'Friend code is required' };
    }

    const user = await friendsCollection.findOne(
        { userId: new ObjectId(userId) }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const profile = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { username: 1 } }
    );

    if (!profile) {
        throw { status: 404, message: 'User profile not found' };
    }

    const friend = await friendsCollection.findOne(
        { friendCode: friendCode }
    );

    if (!friend) {
        throw { status: 404, message: 'Friend not found' };
    }

    if (user.userId.equals(friend.userId)) {
        throw { status: 400, message: 'You cannot send a friend request to yourself' };
    }

    // Check if they are already friends
    const alreadyFriends = user.friends.some(f => f.userId.equals(friend.userId));
    if (alreadyFriends) {
        throw { status: 400, message: 'You are already friends with this user' };
    }

    // Check if a request has already been sent
    const alreadySent = user.sentRequests.some(r => r.userId.equals(friend.userId));
    if (alreadySent) {
        throw { status: 400, message: 'Friend request already sent' };
    }

    // Check if there is a pending request from the other user
    const hasPendingRequest = user.pendingRequests.some(r => r.userId.equals(friend.userId));
    if (hasPendingRequest) {
        throw { status: 400, message: 'Friend request already pending' };
    }

    await friendsCollection.updateOne(
        { _id: user._id },
        {
            $push: {
                sentRequests: {
                    userId: friend.userId,
                }
            }
        }
    );

    await friendsCollection.updateOne(
        { _id: friend._id },
        {
            $push: {
                pendingRequests: {
                    userId: user.userId,
                    username: profile.username,
                }
            }
        }
    );

    await updateStatistics(user.userId.toString(), {
        [USER_KEYS.FRIENDS_REQUESTS_SENT]: { inc: 1 },
    });

    await updateStatistics(friend.userId.toString(), {
        [USER_KEYS.FRIENDS_REQUESTS_RECEIVED]: { inc: 1 },
    });

    return { success: true, message: 'Friend request sent' };
};

/**
 * Accepts a friend request between two users. <br>
 * It removes the pending request from the user's list and the sent request from the friend's list. <br>
 * Adds each user to the other's friends list with initial values for messages and unread count. <br>
 * Updates both users' statistics to reflect the new friendship.
 * <br><br>
 * 
 * @function acceptFriendRequest
 * @param {string} userId - The ID of the user accepting the friend request.
 * @param {string} friendId - The ID of the user whose friend request is being accepted.
 * @returns {Object} - An object containing success status and a message.
 */
async function acceptFriendRequest(userId, friendId) {
    const friendsCollection = db.collection('friends');
    const usersCollection = db.collection('users');

    const user = await friendsCollection.findOne(
        { userId: new ObjectId(userId) }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(friendId) }
    );

    if (!friend) {
        throw { status: 404, message: 'Friend not found' };
    }

    const profileUser = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { username: 1, avatar: 1 } }
    );

    if (!profileUser) {
        throw { status: 404, message: 'Friend profile not found' };
    }

    const profileFriend = await usersCollection.findOne(
        { _id: new ObjectId(friendId) },
        { projection: { username: 1, avatar: 1 } }
    );

    if (!profileFriend) {
        throw { status: 404, message: 'User profile not found' };
    }

    // Remove the friend from pending requests and add to friends list
    await friendsCollection.updateOne(
        { _id: user._id },
        {
            $pull: { pendingRequests: { userId: friend.userId } },
            $push: {
                friends: {
                    userId: friend.userId,
                    username: profileFriend.username,
                    avatar: profileFriend.avatar,
                    messages: [],
                    unreadCount: 0
                },
            },
        },
    );

    // Remove the user from the friend's sent requests and add to their friends list
    await friendsCollection.updateOne(
        { _id: friend._id },
        {
            $pull: { sentRequests: { userId: user.userId } },
            $push: {
                friends: {
                    userId: user.userId,
                    username: profileUser.username,
                    avatar: profileUser.avatar,
                    messages: [],
                    unreadCount: 0
                },
            },
        },
    );

    await updateStatistics(friend.userId.toString(), {
        [USER_KEYS.FRIENDS]: { inc: 1 },
        [USER_KEYS.FRIENDS_ADDED]: { inc: 1 },
    });

    await updateStatistics(user.userId.toString(), {
        [USER_KEYS.FRIENDS]: { inc: 1 },
        [USER_KEYS.FRIENDS_ADDED]: { inc: 1 },
        [USER_KEYS.FRIENDS_REQUEST_ACCEPTED]: { inc: 1 },
    });

    return { success: true };
};

/**
 * Rejects a friend request between two users. <br>
 * It removes the pending request from the user's list and the sent request from the friend's list. <br>
 * Updates the user's statistics to reflect the declined friend request.
 * <br><br>
 * 
 * @function rejectFriendRequest
 * @param {string} userId - The ID of the user rejecting the friend request.
 * @param {string} friendId - The ID of the user whose friend request is being rejected.
 * @returns {Object} - An object containing success status and the ID of the user whose request was rejected.
 */
async function rejectFriendRequest(userId, friendId) {
    const friendsCollection = db.collection('friends');

    const user = await friendsCollection.findOne(
        { userId: new ObjectId(userId) }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(friendId) }
    );

    if (!friend) {
        throw { status: 404, message: 'Friend not found' };
    }

    // Remove from pending requests
    await friendsCollection.updateOne(
        { _id: user._id },
        {
            $pull: {
                pendingRequests: { userId: friend.userId },
            },
        },
    );

    // Remove from sent requests on the sender's side
    await friendsCollection.updateOne(
        { _id: friend._id },
        {
            $pull: {
                sentRequests: { userId: user.userId }
            }
        },
    );

    await updateStatistics(user.userId.toString(), {
        [USER_KEYS.FRIENDS_REQUEST_DECLINED]: { inc: 1 },
    });

    return { success: true };
};

/**
 * Removes a friend relationship between two users. <br>
 * It removes each user from the other's friends list. <br>
 * Updates both users' statistics to reflect the removal of the friendship.
 * <br><br>
 * 
 * @function removeFriend
 * @param {string} userId - The ID of the user removing the friend.
 * @param {string} friendId - The ID of the friend being removed.
 * @return {Object} - An object containing success status and a message.
 */
async function removeFriend(userId, friendId) {
    const friendsCollection = db.collection('friends');

    const user = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
        { projection: { friends: 1, userId: 1 } }
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(friendId) },
        { projection: { friends: 1, userId: 1 } }
    );

    if (!friend) {
        throw { status: 404, message: 'Friend not found' };
    }

    const isFriend = user.friends.some(f => f.userId.equals(friend.userId));
    if (!isFriend) {
        throw { status: 400, message: 'You are not friends with this user' };
    }

    // Remove each other from friends list
    await friendsCollection.updateOne(
        { _id: user._id },
        {
            $pull: { friends: { userId: friend.userId } },
        }
    );

    await friendsCollection.updateOne(
        { _id: friend._id },
        {
            $pull: { friends: { userId: user.userId } },
        }
    );

    await updateStatistics(friend.userId.toString(), {
        [USER_KEYS.FRIENDS]: { inc: -1 },
    });

    await updateStatistics(user.userId.toString(), {
        [USER_KEYS.FRIENDS]: { inc: -1 },
        [USER_KEYS.FRIENDS_REMOVED]: { inc: 1 },
    });

    return { success: true };
};

/**
 * Marks all messages from a specific friend as read for a user. <br>
 * It sets the unread message count to zero for the specified friend in the user's friends list.
 * <br><br>
 * 
 * @function markMessagesAsRead
 * @param {string} userId - The ID of the user marking messages as read.
 * @param {string} friendId - The ID of the friend whose messages are being marked as read.
 * @returns {Object} - An object containing success status and a message.
 */
async function markMessagesAsRead(userId, friendId) {
    const friendsCollection = db.collection('friends');

    const user = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    await friendsCollection.updateOne(
        { userId: user.userId, 'friends.userId': new ObjectId(friendId) },
        { $set: { 'friends.$.unreadCount': 0 } }
    );

    return { success: true };
};

/**
 * Sends a chat message from one user to another. <br>
 * It checks if the users are friends before sending the message. <br>
 * The message is added to both users' message histories, and the unread count is incremented for the recipient. <br>
 * Updates both users' statistics to reflect the sent and received messages.
 * <br><br>
 * 
 * @function sendChatMessage
 * @param {string} userId - The ID of the user sending the message.
 * @param {string} friendId - The ID of the friend receiving the message.
 * @param {string} message - The content of the message being sent.
 * @returns {Object} - An object containing success status and a message.
 */
async function sendFriendMessage(userId, friendId, message) {
    const friendsCollection = db.collection('friends');
    const usersCollection = db.collection('users');

    const user = await friendsCollection.findOne(
        { userId: new ObjectId(userId) },
    );

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const friend = await friendsCollection.findOne(
        { userId: new ObjectId(friendId) },
    );

    if (!friend) {
        throw { status: 404, message: 'Friend not found' };
    }

    const profile = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { username: 1 } }
    );

    const isFriend = user.friends.some(f => f.userId.equals(friend.userId));
    if (!isFriend) {
        throw { status: 400, message: 'You are not friends with this user' };
    }

    // Create message objects
    const userMessage = {
        senderId: user._id,
        name: 'You',
        message,
        timestamp: new Date(),
    };

    const friendMessage = {
        senderId: user._id,
        name: profile.username,
        message,
        timestamp: new Date(),
    };

    await friendsCollection.updateOne(
        { _id: user._id, 'friends.userId': friend.userId },
        {
            $push: { 'friends.$.messages': userMessage },
        }
    );

    await friendsCollection.updateOne(
        { _id: friend._id, 'friends.userId': user.userId },
        {
            $push: { 'friends.$.messages': friendMessage },
            $inc: { 'friends.$.unreadCount': 1 },
        }
    );

    await updateStatistics(user.userId.toString(), {
        [USER_KEYS.FRIENDS_MESSAGES_SENT]: { inc: 1 },
    });

    await updateStatistics(friend.userId.toString(), {
        [USER_KEYS.FRIENDS_MESSAGES_RECEIVED]: { inc: 1 },
    });

    return { success: true };
};

/**
 * Checks for updates in the friend data and notifies connected clients. <br>
 * It looks for changes in pending requests, friends list, and invitations to send real-time updates via WebSocket.
 * <br><br>
 * 
 * @function checkFriendUpdate
 * @param {Array} keys - The keys that have been updated.
 * @param {Object} user - The user object containing friend data.
 * @param {Array} clients - The list of connected WebSocket clients.
 * @returns {void}
 */
function checkFriendUpdate(keys, user, clients) {
    logTrace(`checkFriendUpdate called with keys: ${keys.join(', ')}`);

    if (keys.some((key) =>
        key.startsWith('pendingRequests') ||
        key.startsWith('friends')
    )) {
        const data = {
            requests: user.pendingRequests || [],
            friends: user.friends.map((f) => ({
                userId: f.userId,
                username: f.username,
                avatar: f.avatar,
                messages: (f.messages || []).splice(-13),
                unreadCount: f.unreadCount || 0
            })),
        };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'friendUpdate',
                    data,
                }));
            }
        });
    }

    if (keys.some((key) =>
        key.startsWith('invitations')
    )) {
        const data = {
            invitations: user.invitations || [],
        };

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'invitationUpdate',
                    data,
                }));
            }
        });
    }
}

export {
    getFriendRequests,
    getFriends,

    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,

    sendFriendMessage,
    markMessagesAsRead,

    removeFriend,

    checkFriendUpdate
}