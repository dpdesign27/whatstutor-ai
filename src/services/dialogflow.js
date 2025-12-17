const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const config = require('../config/config');
const logger = require('../utils/logger');
const { DialogflowError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

class DialogflowService {
    constructor() {
        this.client = new SessionsClient({
            projectId: config.googleCloud.projectId,
            keyFilename: config.googleCloud.credentials,
        });

        this.projectId = config.googleCloud.projectId;
        this.location = config.googleCloud.dialogflow.location;
        this.agentId = config.googleCloud.dialogflow.agentId;

        // Store active sessions
        this.sessions = new Map();
    }

    /**
     * Get or create session ID for a user
     * @param {string} userId - User identifier (WhatsApp number)
     * @returns {string} Session ID
     */
    getSessionId(userId) {
        if (!this.sessions.has(userId)) {
            const sessionId = uuidv4();
            this.sessions.set(userId, sessionId);
            logger.info('Created new session', { userId, sessionId });
        }
        return this.sessions.get(userId);
    }

    /**
     * Build session path
     * @param {string} sessionId - Session ID
     * @returns {string} Full session path
     */
    getSessionPath(sessionId) {
        return `projects/${this.projectId}/locations/${this.location}/agents/${this.agentId}/sessions/${sessionId}`;
    }

    /**
     * Send text query to Dialogflow
     * @param {string} text - User text input
     * @param {string} userId - User identifier
     * @param {string} languageCode - Language code
     * @returns {Promise<object>} Dialogflow response
     */
    async detectIntent(text, userId, languageCode = 'en') {
        try {
            const sessionId = this.getSessionId(userId);
            const sessionPath = this.getSessionPath(sessionId);

            logger.info('Sending query to Dialogflow', {
                text,
                userId,
                sessionId,
                languageCode,
            });

            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text,
                    },
                    languageCode,
                },
            };

            const [response] = await this.client.detectIntent(request);
            const queryResult = response.queryResult;

            logger.info('Dialogflow response received', {
                intent: queryResult.intent?.displayName,
                confidence: queryResult.intentDetectionConfidence,
                responseMessages: queryResult.responseMessages?.length,
            });

            return {
                text: this.extractResponseText(queryResult),
                intent: queryResult.intent?.displayName || 'Unknown',
                confidence: queryResult.intentDetectionConfidence || 0,
                parameters: queryResult.parameters,
                languageCode: queryResult.languageCode,
            };
        } catch (error) {
            logger.error('Dialogflow intent detection failed', {
                error: error.message,
                userId,
            });
            throw new DialogflowError(
                `Failed to process with AI: ${error.message}`
            );
        }
    }

    /**
     * Extract text response from Dialogflow response messages
     * @param {object} queryResult - Dialogflow query result
     * @returns {string} Response text
     */
    extractResponseText(queryResult) {
        if (!queryResult.responseMessages || queryResult.responseMessages.length === 0) {
            return "I'm sorry, I didn't understand that. Could you rephrase?";
        }

        // Combine all text responses
        const textResponses = queryResult.responseMessages
            .filter(msg => msg.text)
            .map(msg => msg.text.text)
            .flat();

        return textResponses.join('\n') || "I'm here to help you practice English!";
    }

    /**
     * Clear user session
     * @param {string} userId - User identifier
     */
    clearSession(userId) {
        if (this.sessions.has(userId)) {
            this.sessions.delete(userId);
            logger.info('Session cleared', { userId });
        }
    }

    /**
     * Get active session count
     * @returns {number} Number of active sessions
     */
    getActiveSessionCount() {
        return this.sessions.size;
    }

    /**
     * Clean up old sessions (called periodically)
     * @param {number} maxAge - Max age in milliseconds
     */
    cleanupSessions(maxAge = config.app.sessionTimeout) {
        // In production, you'd track session timestamps
        // For now, just log the cleanup
        logger.info('Session cleanup triggered', {
            activeSessions: this.sessions.size,
        });
    }
}

module.exports = new DialogflowService();
