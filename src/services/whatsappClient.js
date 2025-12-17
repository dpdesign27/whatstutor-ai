const twilio = require('twilio');
const config = require('../config/config');
const logger = require('../utils/logger');
const { WhatsAppError } = require('../utils/errorHandler');

class WhatsAppClient {
    constructor() {
        this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
        this.fromNumber = config.twilio.whatsappNumber;
    }

    /**
     * Send a text message via WhatsApp
     * @param {string} to - Recipient WhatsApp number (format: whatsapp:+1234567890)
     * @param {string} message - Text message to send
     * @returns {Promise<object>} Twilio message response
     */
    async sendTextMessage(to, message) {
        try {
            logger.info('Sending text message', { to, messageLength: message.length });

            const response = await this.client.messages.create({
                from: this.fromNumber,
                to,
                body: message,
            });

            logger.info('Message sent successfully', { sid: response.sid, to });
            return response;
        } catch (error) {
            logger.error('Failed to send text message', { error: error.message, to });
            throw new WhatsAppError(`Failed to send message: ${error.message}`);
        }
    }

    /**
     * Send an audio message via WhatsApp
     * @param {string} to - Recipient WhatsApp number
     * @param {string} audioUrl - Public URL of the audio file
     * @returns {Promise<object>} Twilio message response
     */
    async sendAudioMessage(to, audioUrl) {
        try {
            logger.info('Sending audio message', { to, audioUrl });

            const response = await this.client.messages.create({
                from: this.fromNumber,
                to,
                mediaUrl: [audioUrl],
            });

            logger.info('Audio message sent successfully', { sid: response.sid, to });
            return response;
        } catch (error) {
            logger.error('Failed to send audio message', { error: error.message, to });
            throw new WhatsAppError(`Failed to send audio: ${error.message}`);
        }
    }

    /**
     * Send a message with error handling and retry logic
     * @param {string} to - Recipient number
     * @param {string} message - Message text
     * @param {number} retries - Number of retry attempts
     */
    async sendMessageWithRetry(to, message, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await this.sendTextMessage(to, message);
            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                logger.warn(`Retry attempt ${attempt}/${retries} for message to ${to}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    /**
     * Format WhatsApp number
     * @param {string} number - Phone number
     * @returns {string} Formatted WhatsApp number
     */
    static formatWhatsAppNumber(number) {
        // If already formatted, return as is
        if (number.startsWith('whatsapp:')) {
            return number;
        }

        // Add whatsapp: prefix
        return `whatsapp:${number}`;
    }
}

module.exports = new WhatsAppClient();
