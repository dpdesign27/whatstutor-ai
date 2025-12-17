// Importar cliente de Google Cloud Speech-to-Text
const speech = require('@google-cloud/speech');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AudioProcessingError } = require('../utils/errorHandler');

/**
 * Servicio de Speech-to-Text (Voz a Texto)
 * 
 * Convierte notas de voz de WhatsApp en texto usando Google Cloud Speech-to-Text
 * Soporta detección automática de idioma y múltiples idiomas
 */
class SpeechToTextService {
    /**
     * Constructor
     * Inicializa el cliente de Speech-to-Text con credenciales de Google Cloud
     */
    constructor() {
        this.client = new speech.SpeechClient({
            projectId: config.googleCloud.projectId,
            keyFilename: config.googleCloud.credentials,
        });
    }

    /**
     * Transcribir archivo de audio a texto
     * @param {Buffer} audioBuffer - Buffer del archivo de audio
     * @param {string} languageCode - Código de idioma (ej: 'en-US', 'es-ES')
     * @returns {Promise<object>} Objeto con texto transcrito, idioma y confianza
     * 
     * Proceso:
     * 1. Convertir audio a base64
     * 2. Configurar parámetros de reconocimiento
     * 3. Enviar a Google Cloud
     * 4. Retornar transcripción con metadatos
     */
    async transcribe(audioBuffer, languageCode = 'en-US') {
        try {
            logger.info('Iniciando transcripción de audio', {
                languageCode,
                audioSize: audioBuffer.length,
            });

            // Convertir buffer de audio a base64 (formato requerido por Google Cloud)
            const audioBytes = audioBuffer.toString('base64');

            // Configurar petición de reconocimiento
            const request = {
                audio: {
                    content: audioBytes,  // Audio en base64
                },
                config: {
                    encoding: 'OGG_OPUS',  // WhatsApp usa formato OGG OPUS
                    sampleRateHertz: 16000,  // Frecuencia de muestreo estándar para voz
                    languageCode,  // Idioma principal esperado
                    alternativeLanguageCodes: ['es-ES', 'en-US'],  // Idiomas alternativos para detección
                    enableAutomaticPunctuation: true,  // Agregar puntuación automáticamente
                    model: 'default',  // Modelo de reconocimiento (default, phone_call, video, etc.)
                },
            };

            // Enviar petición a Google Cloud y esperar respuesta
            const [response] = await this.client.recognize(request);

            // Verificar si hay resultados
            if (!response.results || response.results.length === 0) {
                logger.warn('No se retornaron resultados de transcripción');
                throw new AudioProcessingError('No se pudo transcribir el audio. Por favor habla claramente e intenta de nuevo.');
            }

            // Extraer la transcripción de los resultados
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            // Detectar idioma real de la respuesta
            const detectedLanguage = response.results[0]?.languageCode || languageCode;

            logger.info('Transcripción completada', {
                text: transcription,
                detectedLanguage,
            });

            // Retornar objeto con toda la información
            return {
                text: transcription,  // Texto transcrito
                language: detectedLanguage,  // Idioma detectado
                confidence: response.results[0]?.alternatives[0]?.confidence || 0,  // Nivel de confianza (0-1)
            };
        } catch (error) {
            logger.error('Transcripción falló', { error: error.message });

            // Si ya es un error de procesamiento de audio, relanzarlo
            if (error instanceof AudioProcessingError) {
                throw error;
            }

            // En caso contrario, crear nuevo error de procesamiento
            throw new AudioProcessingError(
                `Error al transcribir audio: ${error.message}`
            );
        }
    }

    /**
     * Transcribir con detección automática de idioma
     * @param {Buffer} audioBuffer - Buffer del archivo de audio
     * @returns {Promise<object>} Resultado de transcripción con idioma detectado
     * 
     * Intenta primero con el idioma configurado, si la confianza es baja,
     * reintenta con idioma alternativo
     */
    async transcribeWithLanguageDetection(audioBuffer) {
        try {
            // Intentar primero con idioma configurado (normalmente inglés)
            const result = await this.transcribe(audioBuffer, config.speech.sttLanguage);

            // Si la confianza es baja, podría ser otro idioma
            if (result.confidence < 0.7) {
                logger.info('Confianza baja, intentando idioma alternativo');
                const alternativeResult = await this.transcribe(audioBuffer, 'es-ES');

                // Si el resultado alternativo tiene mejor confianza, usarlo
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

// Exportar una instancia única (singleton)
module.exports = new SpeechToTextService();
