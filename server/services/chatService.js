/**
 * @fileoverview Chat Service - Handles chat-related operations such as fetching chat info, messages, sending messages, and checking for updates.
 * <br><br>
 * This module provides functions to interact with the chat data stored in the database. <br>
 * It includes functionalities to retrieve chat information, fetch messages, send new messages,
 * and check for updates to notify connected clients.
 * <br><br>
 * It interacts with the MongoDB database to perform CRUD operations on chat data.
 */

import WebSocket from "ws";
import { ObjectId } from "mongodb";

// Database
import { db, updateStatistics } from "../database/mongoClient.js";

// Constants
import { USER_KEYS } from "../constants/defaultKeys.js";

// Utilities
import { logTrace } from "../utils/logger.js";

/**
 * Fetches chat information by chatId.
 * <br><br>
 * This function retrieves the chat's name and chat code from the database.
 * <br><br>
 * 
 * @function getChatInfo
 * @param {string} chatId - The ID of the chat to retrieve information for.
 * @returns {Object} An object containing the chat's name and code.
 * @throws Will throw an error if the chat is not found or if a database error occurs.
 */
async function getChatInfo(chatId) {
    const chatsCollection = db.collection('chats');

    const chat = await chatsCollection.findOne(
        { _id: new ObjectId(chatId) },
        { projection: { name: 1, chatCode: 1 } }
    );

    if (!chat) {
        throw { status: 404, message: 'Chat not found' };
    }

    return { name: chat.name, code: chat.chatCode };
}

/**
 * Fetches the last 15 messages from a chat by chatId.
 * <br><br>
 * This function retrieves the last 15 messages from the specified chat in the database.
 * <br><br>
 * 
 * @function getChatMessages
 * @param {string} chatId - The ID of the chat to retrieve messages from.
 * @returns {Object} An object containing the last 15 messages of the chat.
 * @throws Will throw an error if the chat is not found or if a database error occurs.
 */
async function getChatMessages(chatId) {
    const chatsCollection = db.collection('chats');

    const chat = await chatsCollection.findOne(
        { _id: new ObjectId(chatId) },
        { projection: { messages: 1 } }
    );

    if (!chat) {
        throw { status: 404, message: 'Chat not found' };
    }

    const lastMessages = chat.messages.slice(-15);

    return { messages: lastMessages };
}

/**
 * Sends a new chat message to a specified chat.
 * <br><br>
 * This function adds a new message to the chat's message list in the database.
 * <br><br>
 * 
 * @function sendChatMessage
 * @param {string} userId - The ID of the user sending the message.
 * @param {string} chatId - The ID of the chat to send the message to.
 * @param {string} message - The content of the message to be sent.
 * @returns {Object} An object indicating the success of the operation.
 * @throws Will throw an error if the chat is not found, if the user is not part of the chat, or if a database error occurs.
 */
async function sendChatMessage(userId, chatId, message) {
    const chatsCollection = db.collection('chats');
    const lobbyCollection = db.collection('lobbies');

    const chat = await chatsCollection.findOne(
        { _id: new ObjectId(chatId) },
        { projection: { players: 1, spectators: 1, messages: 1 } }
    );

    if (!chat) {
        throw { status: 404, message: 'Chat not found' };
    }

    const lobby = await lobbyCollection.findOne(
        { _id: new ObjectId(chatId) },
        { projection: { players: 1, spectators: 1 } }
    );

    if (!lobby) {
        throw { status: 404, message: 'Lobby not found' };
    }

    const isPlayerInGame = lobby.players.some((player) => player.id === userId);
    const isSpectatorInGame = lobby.spectators.some((spectator) => spectator.id === userId);

    if (!(isPlayerInGame || isSpectatorInGame)) {
        throw { status: 400, message: 'You are not in this lobby' };
    }

    const profile = isPlayerInGame ? lobby.players.find((player) => player.id === userId) : lobby.spectators.find((spectator) => spectator.id === userId);

    const newMessage = {
        id: new ObjectId().toString(),
        userId: userId,
        name: profile.name,
        message,
        timestamp: new Date()
    };

    await chatsCollection.updateOne(
        { _id: new ObjectId(chatId) },
        { $push: { messages: newMessage } }
    );

    await updateStatistics(userId, {
        [USER_KEYS.CHAT_MESSAGES_SENT]: { inc: 1 }
    });

    return { success: true };
}

/**
 * Checks for updates in the chat and notifies connected clients.
 * <br><br>
 * This function checks if there are new messages in the chat and sends updates to all connected clients.
 * <br><br>
 * 
 * @function checkChatUpdate
 * @param {Array} keys - The keys that have been updated.
 * @param {Object} chat - The chat object containing messages.
 * @param {Array} clients - The list of connected WebSocket clients.
 * @returns {void}
 * @throws Will throw an error if a database operation fails.
 */
async function checkChatUpdate(keys, chat, clients) {
    logTrace(`Checking chat updates for keys: ${keys.join(", ")}`);

    if (keys.some((key) =>
        key.startsWith("messages")
    )) {
        const latestMessage = chat.messages.splice(-15);

        const data = { messages: latestMessage }

        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'chatUpdate',
                    data
                }));
            }
        });
    }
}

export {
    getChatInfo,
    getChatMessages,

    sendChatMessage,

    checkChatUpdate
}