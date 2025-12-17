// Importar cliente de Google Cloud Text-to-Speech
const textToSpeech = require('@google-cloud/text-to-speech');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AudioProcessingError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

/**
 * Servicio de Text-to-Speech (Texto a Voz)
 * 
 * Convierte texto en audio de voz natural usando Google Cloud Text-to-Speech
 * Soporta múltiples idiomas y voces neurales de alta calidad
 */
class TextToSpeechService {
    /**
     * Constructor
     * Inicializa el cliente de Text-to-Speech con credenciales de Google Cloud
     */
    constructor() {
        this.client = new textToSpeech.TextToSpeechClient({
            projectId: config.googleCloud.projectId,
            keyFilename: config.googleCloud.credentials,
        });
    }

    /**
     * Convertir texto a archivo de audio
     * @param {string} text - Texto a convertir
     * @param {string} languageCode - Código de idioma (ej: 'en-US', 'es-ES')
     * @returns {Promise<Buffer>} Buffer del archivo de audio
     * 
     * Genera audio de voz natural a partir de texto usando voces neurales
     */
    async synthesize(text, languageCode = 'en-US') {
        try {
            logger.info('Iniciando síntesis de voz', {
                languageCode,
                textLength: text.length,
            });

            // Determinar voz basada en el idioma
            const voiceConfig = this.getVoiceConfig(languageCode);

            // Configurar petición de síntesis
            const request = {
                input: { text },  // Texto a convertir
                voice: voiceConfig,  // Configuración de voz
                audioConfig: {
                    audioEncoding: 'OGG_OPUS',  // Formato compatible con WhatsApp
                    speakingRate: 1.0,  // Velocidad de habla (0.25 - 4.0, 1.0 es normal)
                    pitch: 0.0,  // Tono de voz (-20.0 a 20.0, 0.0 es normal)
                },
            };

            // Enviar petición y esperar respuesta
            const [response] = await this.client.synthesizeSpeech(request);

            logger.info('Síntesis de voz completada', {
                audioSize: response.audioContent.length,
            });

            // Retornar buffer de audio
            return response.audioContent;
        } catch (error) {
            logger.error('Síntesis de voz falló', { error: error.message });
            throw new AudioProcessingError(
                `Error al generar voz: ${error.message}`
            );
        }
    }

    /**
     * Obtener configuración de voz basada en el idioma
     * @param {string} languageCode - Código de idioma
     * @returns {object} Configuración de voz
     * 
     * Diferentes idiomas usan diferentes voces neurales para sonar natural
     */
    getVoiceConfig(languageCode) {
        // Mapeo de idiomas a configuraciones de voz
        const voiceMap = {
            'en-US': {
                languageCode: 'en-US',
                name: 'en-US-Neural2-F',  // Voz femenina neural en inglés americano
                ssmlGender: 'FEMALE',
            },
            'es-ES': {
                languageCode: 'es-ES',
                name: 'es-ES-Neural2-A',  // Voz femenina neural en español de España
                ssmlGender: 'FEMALE',
            },
            'es-US': {
                languageCode: 'es-US',
                name: 'es-US-Neural2-A',  // Voz femenina neural en español latinoamericano
                ssmlGender: 'FEMALE',
            },
        };

        // Usar configuración del idioma o por defecto inglés
        return voiceMap[languageCode] || voiceMap['en-US'];
    }

    /**
     * Guardar audio en archivo temporal
     * @param {Buffer} audioBuffer - Buffer de audio
     * @param {string} filename - Nombre del archivo (sin extensión)
     * @returns {Promise<string>} Ruta del archivo guardado
     * 
     * Guarda el audio en el directorio temporal para su posterior uso
     */
    async saveAudioFile(audioBuffer, filename) {
        try {
            // Construir ruta completa del archivo
            const filepath = path.join(__dirname, '../../temp', `${filename}.ogg`);

            // Escribir buffer a archivo
            await fs.writeFile(filepath, audioBuffer);

            logger.info('Archivo de audio guardado', { filepath });
            return filepath;
        } catch (error) {
            logger.error('Error al guardar archivo de audio', { error: error.message });
            throw new AudioProcessingError('Error al guardar archivo de audio');
        }
    }

    /**
     * Sintetizar y guardar en archivo
     * @param {string} text - Texto a convertir
     * @param {string} languageCode - Código de idioma
     * @param {string} filename - Nombre del archivo de salida
     * @returns {Promise<string>} Ruta del archivo guardado
     * 
     * Proceso completo: texto → audio → archivo
     * Útil para generar respuestas de voz que se enviarán por WhatsApp
     */
    async synthesizeToFile(text, languageCode, filename) {
        // Generar audio
        const audioBuffer = await this.synthesize(text, languageCode);

        // Guardar a archivo
        return await this.saveAudioFile(audioBuffer, filename);
    }
}

// Exportar una instancia única (singleton)
module.exports = new TextToSpeechService();
