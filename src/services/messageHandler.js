const whatsappClient = require('./whatsappClient');
const speechToText = require('./speechToText');
const textToSpeech = require('./textToSpeech');
const dialogflow = require('./dialogflow');
const audioProcessor = require('./audioProcessor');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errorHandler');

class MessageHandler {
    /**
     * Process incoming message from WhatsApp
     * @param {object} message - Twilio message object
     */
    async handleIncomingMessage(message) {
        try {
            const { From, Body, NumMedia, MessageSid } = message;

            logger.info('Processing incoming message', {
                from: From,
                hasMedia: NumMedia > 0,
                messageSid: MessageSid,
            });

            // Check if it's an audio message
            if (NumMedia && parseInt(NumMedia) > 0) {
                await this.handleVoiceMessage(message);
            } else if (Body) {
                await this.handleTextMessage(message);
            } else {
                throw new ValidationError('Invalid message format');
            }
        } catch (error) {
            logger.error('Message handling failed', {
                error: error.message,
                from: message.From,
            });

            // Send error message to user
            await this.sendErrorMessage(message.From, error);
        }
    }

    /**
     * Handle text message
     * @param {object} message - Message object
     */
    async handleTextMessage(message) {
        const { From, Body } = message;

        logger.info('Handling text message', { from: From, text: Body });

        try {
            // Detect language (simple heuristic - could be improved)
            const languageCode = this.detectLanguage(Body);

            // Send to Dialogflow
            const response = await dialogflow.detectIntent(Body, From, languageCode);

            // Send response back to user
            await whatsappClient.sendTextMessage(From, response.text);

            logger.info('Text message handled successfully', {
                from: From,
                intent: response.intent,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle voice message (voice note)
     * @param {object} message - Message object
     */
    async handleVoiceMessage(message) {
        const { From, MediaUrl0, MessageSid } = message;

        logger.info('Handling voice message', {
            from: From,
            mediaUrl: MediaUrl0,
        });

        try {
            // Download and process audio
            const audioBuffer = await audioProcessor.processVoiceNote(
                MediaUrl0,
                MessageSid
            );

            // Transcribe audio to text
            const transcription = await speechToText.transcribeWithLanguageDetection(
                audioBuffer
            );

            logger.info('Voice transcribed', {
                text: transcription.text,
                language: transcription.language,
                confidence: transcription.confidence,
            });

            // Send transcription to user for confirmation
            const confirmationMessage = `🎤 I heard: "${transcription.text}"\n\nLet me respond...`;
            await whatsappClient.sendTextMessage(From, confirmationMessage);

            // Get AI response
            const response = await dialogflow.detectIntent(
                transcription.text,
                From,
                transcription.language
            );

            // Generate voice response
            const voiceLanguage = this.mapLanguageCode(transcription.language);
            const audioFilePath = await textToSpeech.synthesizeToFile(
                response.text,
                voiceLanguage,
                `response_${MessageSid}`
            );

            // Send voice response (would need to host the file publicly)
            // For now, send text response
            await whatsappClient.sendTextMessage(From, response.text);

            logger.info('Voice message handled successfully', {
                from: From,
                intent: response.intent,
            });

            // Cleanup
            await audioProcessor.cleanupTempFile(`${MessageSid}.ogg`);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Detect language from text (simple heuristic)
     * @param {string} text - Input text
     * @returns {string} Language code
     */
    detectLanguage(text) {
        // Simple detection based on common Spanish words
        const spanishPatterns = /\b(hola|gracias|por favor|buenos|días|cómo|está|qué|sí|no)\b/i;

        if (spanishPatterns.test(text)) {
            return 'es';
        }

        return 'en';
    }

    /**
     * Map Dialogflow language code to TTS language code
     * @param {string} languageCode - Dialogflow language code
     * @returns {string} TTS language code
     */
    mapLanguageCode(languageCode) {
        const mapping = {
            'en': 'en-US',
            'en-US': 'en-US',
            'es': 'es-ES',
            'es-ES': 'es-ES',
            'es-US': 'es-US',
        };

        return mapping[languageCode] || 'en-US';
    }

    /**
     * Send error message to user
     * @param {string} to - Recipient number
     * @param {Error} error - Error object
     */
    async sendErrorMessage(to, error) {
        const errorMessage = error.isOperational
            ? `❌ ${error.message}`
            : "❌ I'm having trouble processing your message. Please try again later.";

        try {
            await whatsappClient.sendTextMessage(to, errorMessage);
        } catch (sendError) {
            logger.error('Failed to send error message', {
                error: sendError.message,
                to,
            });
        }
    }

    /**
     * Send welcome message to new users
     * @param {string} to - Recipient number
     */
    async sendWelcomeMessage(to) {
        const welcomeMessage =
            '👋 Welcome to Whatstutor AI!\n\n' +
            "I'm your personal English tutor. You can:\n" +
            '✅ Send me text messages\n' +
            '✅ Send me voice notes\n' +
            '✅ Practice English conversation\n\n' +
            "Let's start practicing! Say hello or tell me about your day.";

        await whatsappClient.sendTextMessage(to, welcomeMessage);
    }
}

module.exports = new MessageHandler();
