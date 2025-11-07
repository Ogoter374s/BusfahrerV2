/**
 * @fileoverview User Routes - Defines the API endpoints for user-related operations.
 * <br><br>
 * This module sets up the Express router for handling user registration, login, and logout. <br>
 * It includes input validation, authentication middleware, and error handling.
 */

import express from 'express';

// Services
import {
    registerUser,

    loginUser,
    logoutUser,
} from '../services/userService.js';

// Middleware
import { authenticateToken } from '../middleware/authenticator.js';

// Validators
import { validateRegistrationInput } from '../validators/userValidator.js';

// Utilities
import { logError, logInfo } from '../utils/logger.js';

// Router instance
const router = express.Router();

// #region POST Routes

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user with a username and password.
 *     security:
 *       - cookieAuth: []
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: newuser
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad Request - Username already exists or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Username already exists
 *                 title:
 *                   type: string
 *                   example: Registration Error
 *       500:
 *         description: Internal Server Error
 */
router.post('/register', async (req, res) => {
    logInfo('Received registration request', { body: req.body });
    if (req.cookies?.token) {
        return res.status(400).json({ error: 'Already authenticated', title: 'Registration Error' });
    }

    // Check input validity
    const { error } = validateRegistrationInput(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message, title: 'Registration Error' });
    }

    try {
        const { token } = await registerUser(
            req.body.username,
            req.body.password,
        );
        
        // Create Token Cookie for User
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 12 * 60 * 60 * 1000,
        });

        res.json({ success: true });
    } catch (err) {
        logError(`Error registering user: ${err.stack || err.message}`);
        res.status(err.status || 500).json({ error: err.message || 'Registration failed', title: 'Registration Error' });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user with their username and password.
 *     security:
 *       - cookieAuth: []
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: existinguser
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad Request - User not found or wrong password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 *                 title:
 *                   type: string
 *                   example: Login Error
 *       500:
 *         description: Internal Server Error
 */
router.post('/login', async (req, res) => {
    logInfo('Received login request', { body: req.body });
    if (req.cookies?.token) {
        return res.status(400).json({ error: 'Already authenticated', title: 'Registration Error' });
    }

    const { username, password } = req.body;

    try {
        const { token } = await loginUser(username, password);

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 12 * 60 * 60 * 1000,
        });

        res.json({ success: true });
    } catch (error) {
        logError(`Error logging in: ${error.stack || error.message}`);
        res.status(error.status || 500).json({ error: error.message || 'Login failed', title: 'Login Error' });
    }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user
 *     description: Logs out the authenticated user by clearing the authentication cookie.
 *     security:
 *       - cookieAuth: []
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal Server Error
 */
router.post('/logout', authenticateToken, async (req, res) => {
    logInfo('Received logout request', { user: req.user });

    try {
        await logoutUser(res);
        res.status(200).json({ success: true });
    } catch (error) {
        logError(`Error logging out: ${error.stack || error.message}`);
        res.status(error.status || 500).json({ error: error.message || 'Logout failed', title: 'Logout Error' });
    }
});

// #endregion

export default router;
