const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');
const webhookRoutes = require('./routes/webhook');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Request logging
app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use('/webhook', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Whatstutor AI',
        version: '1.0.0',
        description: 'Bilingual conversational AI tutor for WhatsApp',
        endpoints: {
            health: '/health',
            webhook: '/webhook',
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
    });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

const startServer = async () => {
    try {
        // Validate configuration
        if (!config.validate()) {
            logger.warn('Configuration validation failed. Server starting but may not function correctly.');
        }

        app.listen(PORT, () => {
            logger.info('🚀 Whatstutor AI Server Started', {
                port: PORT,
                environment: config.nodeEnv,
                endpoints: {
                    health: `http://localhost:${PORT}/health`,
                    webhook: `http://localhost:${PORT}/webhook`,
                },
            });

            logger.info('📱 Ready to receive WhatsApp messages!');
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error.message });
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
