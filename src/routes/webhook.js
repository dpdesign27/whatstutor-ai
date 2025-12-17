const express = require('express');
const router = express.Router();
const messageHandler = require('../services/messageHandler');
const logger = require('../utils/logger');
const { asyncHandler } = require('../utils/errorHandler');

/**
 * POST /webhook
 * Receives incoming WhatsApp messages from Twilio
 */
router.post(
    '/',
    asyncHandler(async (req, res) => {
        logger.info('Webhook received', {
            from: req.body.From,
            body: req.body.Body?.substring(0, 50),
            hasMedia: req.body.NumMedia > 0,
        });

        // Process message asynchronously
        messageHandler.handleIncomingMessage(req.body).catch(error => {
            logger.error('Async message handling failed', {
                error: error.message,
            });
        });

        // Respond immediately to Twilio (200 OK)
        res.status(200).send('OK');
    })
);

/**
 * GET /webhook
 * Twilio webhook verification endpoint
 */
router.get('/', (req, res) => {
    logger.info('Webhook verification requested');
    res.status(200).send('Whatstutor AI Webhook Active');
});

module.exports = router;
