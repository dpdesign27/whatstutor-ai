const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AudioProcessingError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

class AudioProcessor {
    /**
     * Download audio file from Twilio URL
     * @param {string} mediaUrl - Twilio media URL
     * @param {string} messageSid - Message SID for unique filename
     * @returns {Promise<Buffer>} Audio buffer
     */
    async downloadAudio(mediaUrl, messageSid) {
        try {
            logger.info('Downloading audio file', { mediaUrl, messageSid });

            // Twilio requires authentication
            const auth = {
                username: config.twilio.accountSid,
                password: config.twilio.authToken,
            };

            const response = await axios({
                method: 'GET',
                url: mediaUrl,
                auth,
                responseType: 'arraybuffer',
            });

            const audioBuffer = Buffer.from(response.data);

            logger.info('Audio downloaded successfully', {
                size: audioBuffer.length,
                contentType: response.headers['content-type'],
            });

            // Save to temp directory
            const filename = `${messageSid}.ogg`;
            const filepath = path.join(__dirname, '../../temp', filename);
            await fs.writeFile(filepath, audioBuffer);

            return audioBuffer;
        } catch (error) {
            logger.error('Failed to download audio', {
                error: error.message,
                mediaUrl,
            });
            throw new AudioProcessingError(
                `Failed to download audio: ${error.message}`
            );
        }
    }

    /**
     * Validate audio file size
     * @param {Buffer} audioBuffer - Audio buffer
     * @returns {boolean} True if valid
     */
    validateAudioSize(audioBuffer) {
        const size = audioBuffer.length;
        const maxSize = config.app.maxAudioSize;

        if (size > maxSize) {
            throw new AudioProcessingError(
                `Audio file too large. Maximum size is ${maxSize / 1024 / 1024}MB`
            );
        }

        logger.info('Audio size validated', {
            size,
            maxSize,
        });

        return true;
    }

    /**
     * Clean up temporary audio files
     * @param {string} filename - Filename to delete
     */
    async cleanupTempFile(filename) {
        try {
            const filepath = path.join(__dirname, '../../temp', filename);
            await fs.unlink(filepath);
            logger.info('Temp file cleaned up', { filepath });
        } catch (error) {
            logger.warn('Failed to cleanup temp file', {
                error: error.message,
                filename,
            });
        }
    }

    /**
     * Process voice note: download, validate, and prepare for transcription
     * @param {string} mediaUrl - Twilio media URL
     * @param {string} messageSid - Message SID
     * @returns {Promise<Buffer>} Processed audio buffer
     */
    async processVoiceNote(mediaUrl, messageSid) {
        try {
            // Download audio
            const audioBuffer = await this.downloadAudio(mediaUrl, messageSid);

            // Validate size
            this.validateAudioSize(audioBuffer);

            // Return buffer for transcription
            return audioBuffer;
        } catch (error) {
            logger.error('Voice note processing failed', {
                error: error.message,
                messageSid,
            });
            throw error;
        }
    }

    /**
     * Get audio file info
     * @param {Buffer} audioBuffer - Audio buffer
     * @returns {object} Audio info
     */
    getAudioInfo(audioBuffer) {
        return {
            size: audioBuffer.length,
            sizeInMB: (audioBuffer.length / 1024 / 1024).toFixed(2),
            format: 'OGG_OPUS', // WhatsApp default
        };
    }
}

module.exports = new AudioProcessor();
