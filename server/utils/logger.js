/**
 * @fileoverview Logger utility for logging messages with log rotation. <br>
 * Logs are rotated when they exceed a specified size, and old backups are cleaned up.
 */

import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cleans up old log backup files, keeping only a specified number of the most recent ones.
 * @function cleanOldLogs
 * @param {string} fileName - The base name of the log file.
 * @param {number} maxFiles - The maximum number of backup files to keep.
 * @returns {void}
 */
const cleanOldLogs = (fileName, maxFiles) => {
    const logDir = '.';
    fs.readdir(logDir, (err, files) => {
        if (err) {
            console.error('Failed to read log directory:', err);
            return;
        }

        const logBackups = files
            .filter(
                (file) => file.startsWith(fileName) && file.endsWith('.bak'),
            )
            .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);

        while (logBackups.length > maxFiles) {
            const oldestFile = logBackups.shift();
            fs.unlink(oldestFile, (unlinkErr) => {
                if (unlinkErr)
                    console.error(`Failed to delete ${oldestFile}:`, unlinkErr);
                else console.log(`Deleted old backup: ${oldestFile}`);
            });
        }
    });
};

/**
 * Rotates the log file if it exceeds the specified maximum size.
 * @function rotateLogs
 * @param {string} fileName - The name of the log file to rotate.
 * @param {number} [maxSize=5*1024*1024] - The maximum size in bytes before rotation occurs.
 * @param {number} [maxFiles=10] - The maximum number of backup files to keep.
 * @returns {void}
 */
const rotateLogs = (fileName, maxSize = 5 * 1024 * 1024, maxFiles = 10) => {
    const logFilePath = fileName;

    fs.stat(logFilePath, (err, stats) => {
        if (!err && stats.size >= maxSize) {
            const backupFile = `${fileName}.${Date.now()}.bak`;

            fs.rename(logFilePath, backupFile, (renameErr) => {
                if (renameErr) {
                    console.error(`Failed to rotate ${fileName}:`, renameErr);
                } else {
                    console.log(`Rotated ${fileName} → ${backupFile}`);
                    cleanOldLogs(fileName, maxFiles);
                }
            });
        }
    });
};

/**
 * Logs a message to the specified log file with a timestamp and log level.
 * @function logMessage
 * @param {string} level - The log level (e.g., 'ERROR', 'TRACE', 'INFO').
 * @param {string} message - The message to log.
 * @param {string} [fileName='app.log'] - The name of the log file.
 * @returns {void}
 */
const logMessage = (level, message, fileName = 'app.log') => {
    const dir = process.env.LOG_DIR || "./trace/"
    const logPath = path.join(dir, fileName);

    rotateLogs(logPath);

    const logFilePath = path.join(__dirname, logPath);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) console.error(`Failed to write to ${logPath}:`, err);
    });
};

/**
 * Logs an error message.
 * @function logError
 * @param {string} message - The error message to log.
 * @returns {void}
 */
const logError = (message) => logMessage('ERROR', message, 'error.log');

/**
 * Logs a trace message.
 * @function logTrace
 * @param {string} message - The trace message to log.
 * @returns {void}
 */
const logTrace = (message) => logMessage('TRACE', message, 'trace.log');

/**
 * Logs an info message.
 * @function logInfo
 * @param {string} message - The info message to log.
 * @returns {void}
 */
const logInfo = (message) => logMessage('INFO', message, 'info.log');

export { 
    logError, 
    logTrace, 
    logInfo 
};
