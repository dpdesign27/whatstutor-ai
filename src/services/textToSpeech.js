const textToSpeech = require('@google-cloud/text-to-speech');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AudioProcessingError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

class TextToSpeechService {
    constructor() {
        this.client = new textToSpeech.TextToSpeechClient({
            projectId: config.googleCloud.projectId,
            keyFilename: config.googleCloud.credentials,
        });
    }

    /**
     * Convert text to speech audio file
     * @param {string} text - Text to convert
     * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
     * @returns {Promise<Buffer>} Audio file buffer
     */
    async synthesize(text, languageCode = 'en-US') {
        try {
            logger.info('Starting text-to-speech synthesis', {
                languageCode,
                textLength: text.length,
            });

            // Determine voice based on language
            const voiceConfig = this.getVoiceConfig(languageCode);

            const request = {
                input: { text },
                voice: voiceConfig,
                audioConfig: {
                    audioEncoding: 'OGG_OPUS', // WhatsApp-compatible format
                    speakingRate: 1.0,
                    pitch: 0.0,
                },
            };

            const [response] = await this.client.synthesizeSpeech(request);

            logger.info('Speech synthesis completed', {
                audioSize: response.audioContent.length,
            });

            return response.audioContent;
        } catch (error) {
            logger.error('Speech synthesis failed', { error: error.message });
            throw new AudioProcessingError(
                `Failed to generate speech: ${error.message}`
            );
        }
    }

    /**
     * Get voice configuration based on language
     * @param {string} languageCode - Language code
     * @returns {object} Voice configuration
     */
    getVoiceConfig(languageCode) {
        const voiceMap = {
            'en-US': {
                languageCode: 'en-US',
                name: 'en-US-Neural2-F', // Female voice, natural sounding
                ssmlGender: 'FEMALE',
            },
            'es-ES': {
                languageCode: 'es-ES',
                name: 'es-ES-Neural2-A', // Female Spanish voice
                ssmlGender: 'FEMALE',
            },
            'es-US': {
                languageCode: 'es-US',
                name: 'es-US-Neural2-A', // Female Latin American Spanish
                ssmlGender: 'FEMALE',
            },
        };

        // Default to en-US if language not found
        return voiceMap[languageCode] || voiceMap['en-US'];
    }

    /**
     * Save audio to temporary file
     * @param {Buffer} audioBuffer - Audio buffer
     * @param {string} filename - Filename (without extension)
     * @returns {Promise<string>} File path
     */
    async saveAudioFile(audioBuffer, filename) {
        try {
            const filepath = path.join(__dirname, '../../temp', `${filename}.ogg`);
            await fs.writeFile(filepath, audioBuffer);
            logger.info('Audio file saved', { filepath });
            return filepath;
        } catch (error) {
            logger.error('Failed to save audio file', { error: error.message });
            throw new AudioProcessingError('Failed to save audio file');
        }
    }

    /**
     * Synthesize and save to file
     * @param {string} text - Text to convert
     * @param {string} languageCode - Language code
     * @param {string} filename - Output filename
     * @returns {Promise<string>} File path
     */
    async synthesizeToFile(text, languageCode, filename) {
        const audioBuffer = await this.synthesize(text, languageCode);
        return await this.saveAudioFile(audioBuffer, filename);
    }
}

module.exports = new TextToSpeechService();
