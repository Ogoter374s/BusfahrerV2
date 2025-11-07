/**
 * @fileoverview Server entry point
 * <br><br>
 * This file initializes and configures the Express server,
 * sets up middleware, connects to the MongoDB database,
 * and starts the WebSocket server.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http2Express from 'http2-express-bridge';

// Utilities
import { swaggerUi, swaggerSpec } from './utils/swagger.js';
import { logInfo, logError } from './utils/logger.js';

// Database
import { connectToMongoDB } from './database/mongoClient.js';

// WebSockets
import startWebSocketServer from './websockets/index.js';

// Middleware
import { uploadDir } from './middleware/uploadAvatar.js';

// Routes
import allRoutes from './routes/index.js';

dotenv.config();

const app = http2Express(express);
const port = process.env.BASE_PORT;

const allowedOrigins = process.env.FRONT_URL.split(',');

app.use(
    cors({
        origin: (origin, callback) => {
            if(!origin) return callback(null, true);

            if(allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('CORS blocked for origin: ${origin}'));
        },
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/avatars', express.static(uploadDir));
app.use('/', allRoutes);

app.use(
    express.static('public', {
        maxAge: '1y',
    }),
);

await connectToMongoDB();

const apiServer = startWebSocketServer(app);

apiServer.listen(port, () => {
    logInfo(`Server running on ${process.env.BASE_URL}`);
});

apiServer.on('error', (err) => {
    logError(`Server error: ${err.message}`);
});