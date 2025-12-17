const winston = require('winston');
const config = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logger
const logger = winston.createLogger({
    level: config.app.logLevel,
    format: logFormat,
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: consoleFormat,
        }),
        // Write errors to error.log
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        // Write all logs to combined.log
        new winston.transports.File({
            filename: 'logs/combined.log',
        }),
    ],
});

// Create stream for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

module.exports = logger;
