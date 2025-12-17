const logger = require('./logger');

// Custom error classes
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

class AudioProcessingError extends AppError {
    constructor(message) {
        super(message, 422);
    }
}

class WhatsAppError extends AppError {
    constructor(message) {
        super(message, 502);
    }
}

class DialogflowError extends AppError {
    constructor(message) {
        super(message, 503);
    }
}

// Global error handler
const errorHandler = (err, req, res, next) => {
    const { statusCode = 500, message, stack } = err;

    logger.error('Error occurred:', {
        statusCode,
        message,
        stack,
        url: req?.originalUrl,
        method: req?.method,
    });

    // Don't expose internal errors to client
    const response = {
        success: false,
        message: err.isOperational ? message : 'Internal Server Error',
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = stack;
    }

    res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    ValidationError,
    AudioProcessingError,
    WhatsAppError,
    DialogflowError,
    errorHandler,
    asyncHandler,
};
