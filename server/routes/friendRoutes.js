/**
 * @fileoverview Friend Routes - Defines API endpoints for managing friend-related functionalities.
 * <br><br>
 * This module sets up Express routes to handle friend functionalities including:
 * <br><br>
 * - Retrieving friend requests and friends list<br>
 * - Sending, accepting, and declining friend requests<br>
 * - Removing friends<br>
 * - Sending messages to friends and marking messages as read<br>
 * <br><br>
 * Each route is protected by JWT authentication middleware to ensure that only authenticated users can access these endpoints.
 */

import express from 'express';

// Services
import {
    getFriendRequests,
    getFriends,

    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,

    sendFriendMessage,
    markMessagesAsRead,

    removeFriend
} from '../services/friendService.js';

// Middleware
import { authenticateToken } from '../middleware/authenticator.js';

// Utilities
import { logError } from '../utils/logger.js';

// Router instance
const router = express.Router();

// #region GET Routes

/**
 * @swagger
 * /get-friend-requests:
 *   get:
 *     summary: Retrieve pending friend requests for the authenticated user.
 *     description: |
 *       Fetches the list of pending friend requests for the user associated with the provided JWT token.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     responses:
 *       200:
 *         description: Successfully retrieved friend requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "60d0fe4f5311236168a109ca"
 *                       username:
 *                         type: string
 *                         example: "Jane Doe"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-friend-requests', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getFriendRequests(userId);

        if (result.success) {
            return res.json({ requests: result.pending });
        }
    } catch (error) {
        logError(`Error fetching friend requests: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Friend Request Error' });
    }
});

/**
 * @swagger
 * /get-friends:
 *   get:
 *     summary: Retrieve friends list for the authenticated user.
 *     description: |
 *       Fetches the list of friends for the user associated with the provided JWT token.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     responses:
 *       200:
 *         description: Successfully retrieved friends list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "60d0fe4f5311236168a109ca"
 *                       username:
 *                         type: string
 *                         example: "Jane Doe"
 *                       avatar:
 *                         type: string
 *                         example: "64df1f91a4b2de4c785b3d12_1760782507774.jpg"
 *                       messages:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             senderId:
 *                               type: string
 *                               example: "60d0fe4f5311236168a109ca"
 *                             name:
 *                               type: string
 *                               example: "John Doe"
 *                             message:
 *                               type: string
 *                               example: "Hello, how are you?"
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                               example: "2023-03-15T12:34:56Z"
 *                       unreadCount:
 *                         type: integer
 *                         example: 5
 *                 friendCode:
 *                   type: string
 *                   example: "ABC123"
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: Friend Collection not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get('/get-friends', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await getFriends(userId);

        if (result.success) {
            return res.json({ friends: result.friends, friendCode: result.friendCode });
        }
    } catch (error) {
        logError(`Error fetching friends: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Friend Fetch Error' });
    }
});

// #endregion

// #region POST Routes

/**
 * @swagger
 * /send-friend-request:
 *   post:
 *     summary: Send a friend request to another user.
 *     description: |
 *       Sends a friend request to the user identified by the provided friend code. 
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendCode:
 *                 type: string
 *                 example: "#ABC123"
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Friend request sent."
 *       400:
 *         description: |
 *           Friend code is required.
 *           You cannot send a friend request to yourself. <br>
 *           You are already friends with this user. <br>
 *           Friend request already sent. <br>
 *           Friend request already pending.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           User not found. <br>
 *           User profile not found. <br>
 *           Friend not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/send-friend-request', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendCode } = req.body;

    try {
        const result = await sendFriendRequest(userId, friendCode);

        if (result.success) {
            return res.json({ success: true, message: result.message });
        }
    } catch (error) {
        logError(`Error sending friend request: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, tile: 'Friend Request Error' });
    }
});

/**
 * @swagger
 * /accept-friend-request:
 *   post:
 *     summary: Accept a friend request from another user.
 *     description: |
 *       Accepts a friend request from the user identified by the provided friend ID.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Friend request accepted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           User not found. <br>
 *           Friend not found. <br>
 *           Friend profile not found. <br>
 *           User profile not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/accept-friend-request', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId } = req.body;

    try {
        const result = await acceptFriendRequest(userId, friendId);

        if (result.success) {
            return res.json({ success: true });
        }
    } catch (error) {
        logError(`Error accepting friend request: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Friend Request Error' });
    }
});

/**
 * @swagger
 * /decline-friend-request:
 *   post:
 *     summary: Decline a friend request from another user.
 *     description: |
 *       Declines a friend request from the user identified by the provided friend ID.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Friend request declined successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           User not found. <br>
 *           Friend not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/decline-friend-request', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId } = req.body;

    try {
        const result = await rejectFriendRequest(userId, friendId);

        if (result.success) {
            return res.json({ success: true });
        }
    } catch (error) {
        logError(`Error rejecting friend request: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Friend Request Error' });
    }
});

/**
 * @swagger
 * /remove-friend:
 *   post:
 *     summary: Remove a friend from the authenticated user's friends list.
 *     description: |
 *       Removes a friend from the user's friends list.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Friend removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: You are not friends with this user.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           User not found. <br>
 *           Friend not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/remove-friend', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId } = req.body;

    try {
        const result = await removeFriend(userId, friendId);

        if (result.success) {
            return res.json({ success: true });
        }
    } catch (error) {
        logError(`Error removing friend: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Remove Friend Error' });
    }
});

/**
 * @swagger
 * /mark-friend-messages-read:
 *   post:
 *     summary: Mark all messages from a specific friend as read.
 *     description: |
 *       Marks all messages from a specific friend as read for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Messages marked as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/mark-friend-messages-read', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId } = req.body;

    try {
        const result = await markMessagesAsRead(userId, friendId);

        if (result.success) {
            return res.json({ success: true });
        }
    } catch (error) {
        logError(`Error marking messages as read: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Message Read Error' });
    }
});

/**
 * @swagger
 * /send-friend-message:
 *   post:
 *     summary: Send a message to a friend.
 *     description: |
 *       Sends a message to a specific friend for the authenticated user.
 *       Requires a valid JWT token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Friends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "60d0fe4f5311236168a109ca"
 *               message:
 *                 type: string
 *                 example: "Hello, how are you?"
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: You are not friends with this user.
 *       401:
 *         description: No Token was provided.
 *       403:
 *         description: Invalid Token.
 *       404:
 *         description: |
 *           User not found. <br>
 *           Friend not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post('/send-friend-message', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { friendId, message } = req.body;

    try {
        const result = await sendFriendMessage(userId, friendId, message);

        if (result.success) {
            return res.json({ success: true });
        }
    } catch (error) {
        logError(`Error sending chat message: ${error.stack || error.message}`);
        return res.status(500).json({ error: error.message, title: 'Chat Message Error' });
    }
});

// #endregion

export default router;