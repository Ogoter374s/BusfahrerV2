/**
 * @fileoverview Chat Routes - Defines API endpoints for chat-related operations such as retrieving chat info, messages, and sending messages.
 * <br><br>
 * This module sets up Express routes to handle chat functionalities including:
 * <br><br>
 * - Retrieving chat information (name and code)<br>
 * - Fetching the last 15 messages from a chat<br>
 * - Sending new messages to a chat<br>
 * <br><br>
 * Each route is protected by JWT authentication middleware to ensure that only authenticated users can access these endpoints.
 */

import express from 'express';

// Services
import { getChatInfo, getChatMessages, sendChatMessage } from '../services/chatService.js';

// Middleware
import { authenticateToken } from "../middleware/authenticator.js";

// Utilities
import { logError } from '../utils/logger.js';

// Router instance
const router = express.Router();

// #region GET Routes

/**
 * @swagger
 * /get-chat-info/{chatId}:
 *   get:
 *     summary: Retrieve chat information by chat ID.
 *     description: |
 *       Fetches the name and chat code for the specified chat.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Chat
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         description: The ID of the chat to retrieve information for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved chat information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Game Chat"
 *                 code:
 *                   type: string
 *                   example: "#NWUZO"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Chat not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-chat-info/:chatId', authenticateToken, async (req, res) => {
    const { chatId } = req.params;

    try {
        const result = await getChatInfo(chatId);

        return res.json({ name: result.name, code: result.code });
    } catch (error) {
        logError('Error fetching chat name:', error);
        return res.status(500).json({ error: error.message, title: 'Chat Name Fetch Error' });
    }
});

/**
 * @swagger
 * /get-chat-messages/{chatId}:
 *   get:
 *     summary: Retrieve the last 15 messages from a chat by chat ID.
 *     description: |
 *       Fetches the most recent 15 messages for the specified chat.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Chat
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         description: The ID of the chat to retrieve messages for.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     responses:
 *       200:
 *         description: Successfully retrieved chat messages.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "60d0fe4f5311236168a109ca"
 *                       message:
 *                         type: string
 *                         example: "Hello, world!"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-03-15T12:34:56Z"
 *                       userId:     
 *                         type: string
 *                         example: "60d0fe4f5311236168a109cb"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Chat not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-chat-messages/:chatId', authenticateToken, async (req, res) => {
    const { chatId } = req.params;

    try {
        const result = await getChatMessages(chatId);

        return res.json({ messages: result.messages });
    } catch (error) {
        logError('Error fetching chat messages:', error);
        return res.status(500).json({ error: error.message, title: 'Chat Messages Fetch Error' });
    }
});

// #endregion

// #region POST Routes

/**
 * @swagger
 * /send-chat-message/{chatId}:
 *   post:
 *     summary: Send a message to a chat by chat ID.
 *     description: |
 *       Sends a message to the specified chat.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Chat
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         description: The ID of the chat to send a message to.
 *         schema:
 *           type: string
 *           example: "64a7b2f5c9e77b001f2d3e4a"
 *     requestBody:
 *       description: Message content to be sent.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Hello, world!"
 *     responses:
 *       200:
 *         description: Successfully sent chat message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: You are not in this lobby.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           Chat not found. <br>
 *           Lobby not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/send-chat-message/:chatId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { chatId } = req.params;
    const { message } = req.body;

    try {
        const result = await sendChatMessage(userId, chatId, message);

        if (result.success) {
            return res.json({ success: true });
        }
    } catch (error) {
        logError(`Error sending chat message: ${error.message}`);
        return res.status(500).json({ error: error.message, title: 'Send Chat Message Error' });
    }
});

// #endregion

export default router;