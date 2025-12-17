const speech = require('@google-cloud/speech');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AudioProcessingError } = require('../utils/errorHandler');

class SpeechToTextService {
    constructor() {
        this.client = new speech.SpeechClient({
            projectId: config.googleCloud.projectId,
            keyFilename: config.googleCloud.credentials,
        });
    }

    /**
     * Transcribe audio file to text
     * @param {Buffer} audioBuffer - Audio file buffer
     * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
     * @returns {Promise<string>} Transcribed text
     */
    async transcribe(audioBuffer, languageCode = 'en-US') {
        try {
            logger.info('Starting audio transcription', {
                languageCode,
                audioSize: audioBuffer.length,
            });

            const audioBytes = audioBuffer.toString('base64');

            const request = {
                audio: {
                    content: audioBytes,
                },
                config: {
                    encoding: 'OGG_OPUS', // WhatsApp uses OGG OPUS format
                    sampleRateHertz: 16000,
                    languageCode,
                    alternativeLanguageCodes: ['es-ES', 'en-US'], // Support Spanish and English
                    enableAutomaticPunctuation: true,
                    model: 'default',
                },
            };

            const [response] = await this.client.recognize(request);

            if (!response.results || response.results.length === 0) {
                logger.warn('No transcription results returned');
                throw new AudioProcessingError('Could not transcribe audio. Please speak clearly and try again.');
            }

            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            // Detect language from response
            const detectedLanguage = response.results[0]?.languageCode || languageCode;

            logger.info('Transcription completed', {
                text: transcription,
                detectedLanguage,
            });

            return {
                text: transcription,
                language: detectedLanguage,
                confidence: response.results[0]?.alternatives[0]?.confidence || 0,
            };
        } catch (error) {
            logger.error('Transcription failed', { error: error.message });

            if (error instanceof AudioProcessingError) {
                throw error;
            }

            throw new AudioProcessingError(
                `Failed to transcribe audio: ${error.message}`
            );
        }
    }

    /**
     * Transcribe with automatic language detection
     * @param {Buffer} audioBuffer - Audio file buffer
     * @returns {Promise<object>} Transcription result with detected language
     */
    async transcribeWithLanguageDetection(audioBuffer) {
        try {
            // Try English first
            const result = await this.transcribe(audioBuffer, config.speech.sttLanguage);

            // If confidence is low, might be Spanish
            if (result.confidence < 0.7) {
                logger.info('Low confidence, trying alternative language');
                const alternativeResult = await this.transcribe(audioBuffer, 'es-ES');

                if (alternativeResult.confidence > result.confidence) {
                    return alternativeResult;
                }
            }

            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new SpeechToTextService();
