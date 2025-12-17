// Importar bibliotecas necesarias para manejo de archivos y HTTP
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AudioProcessingError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

/**
 * Procesador de Audio
 * 
 * Maneja la descarga, validación y limpieza de archivos de audio de WhatsApp
 * Los archivos de audio vienen como URLs de Twilio que deben descargarse
 */
class AudioProcessor {
    /**
     * Descargar archivo de audio desde URL de Twilio
     * @param {string} mediaUrl - URL de medios de Twilio
     * @param {string} messageSid - SID del mensaje para nombre de archivo único
     * @returns {Promise<Buffer>} Buffer del audio descargado
     * 
     * Twilio aloja los archivos de medios temporalmente
     * Requiere autenticación usando credenciales de cuenta
     */
    async downloadAudio(mediaUrl, messageSid) {
        try {
            logger.info('Descargando archivo de audio', { mediaUrl, messageSid });

            // Twilio requiere autenticación HTTP Basic
            const auth = {
                username: config.twilio.accountSid,  // SID de la cuenta como usuario
                password: config.twilio.authToken,   // Token de autenticación como contraseña
            };

            // Hacer petición GET para descargar el archivo
            const response = await axios({
                method: 'GET',
                url: mediaUrl,
                auth,
                responseType: 'arraybuffer',  // Importante: obtener datos binarios
            });

            // Convertir respuesta a Buffer
            const audioBuffer = Buffer.from(response.data);

            logger.info('Audio descargado exitosamente', {
                size: audioBuffer.length,
                contentType: response.headers['content-type'],
            });

            // Guardar en directorio temporal para procesamiento
            const filename = `${messageSid}.ogg`;
            const filepath = path.join(__dirname, '../../temp', filename);
            await fs.writeFile(filepath, audioBuffer);

            return audioBuffer;
        } catch (error) {
            logger.error('Error al descargar audio', {
                error: error.message,
                mediaUrl,
            });
            throw new AudioProcessingError(
                `Error al descargar audio: ${error.message}`
            );
        }
    }

    /**
     * Validar tamaño del archivo de audio
     * @param {Buffer} audioBuffer - Buffer de audio
     * @returns {boolean} true si es válido
     * 
     * Verifica que el archivo no exceda el tamaño máximo permitido
     * Previene problemas de memoria y procesamiento
     */
    validateAudioSize(audioBuffer) {
        const size = audioBuffer.length;
        const maxSize = config.app.maxAudioSize;

        // Si excede el tamaño máximo, lanzar error
        if (size > maxSize) {
            throw new AudioProcessingError(
                `Archivo de audio demasiado grande. El tamaño máximo es ${maxSize / 1024 / 1024}MB`
            );
        }

        logger.info('Tamaño de audio validado', {
            size,
            maxSize,
        });

        return true;
    }

    /**
     * Limpiar archivos de audio temporales
     * @param {string} filename - Nombre del archivo a eliminar
     * 
     * Elimina archivos temporales después de procesarlos
     * para liberar espacio en disco
     */
    async cleanupTempFile(filename) {
        try {
            const filepath = path.join(__dirname, '../../temp', filename);
            await fs.unlink(filepath);  // Eliminar archivo
            logger.info('Archivo temporal limpiado', { filepath });
        } catch (error) {
            // No es crítico si falla la limpieza, solo advertir
            logger.warn('Error al limpiar archivo temporal', {
                error: error.message,
                filename,
            });
        }
    }

    /**
     * Procesar nota de voz: descargar, validar y preparar para transcripción
     * @param {string} mediaUrl - URL de medios de Twilio
     * @param {string} messageSid - SID del mensaje
     * @returns {Promise<Buffer>} Buffer de audio procesado
     * 
     * Proceso completo:
     * 1. Descargar audio desde Twilio
     * 2. Validar tamaño
     * 3. Retornar buffer listo para transcripción
     */
    async processVoiceNote(mediaUrl, messageSid) {
        try {
            // Paso 1: Descargar audio
            const audioBuffer = await this.downloadAudio(mediaUrl, messageSid);

            // Paso 2: Validar tamaño
            this.validateAudioSize(audioBuffer);

            // Retornar buffer para transcripción
            return audioBuffer;
        } catch (error) {
            logger.error('Procesamiento de nota de voz falló', {
                error: error.message,
                messageSid,
            });
            throw error;
        }
    }

    /**
     * Obtener información del archivo de audio
     * @param {Buffer} audioBuffer - Buffer de audio
     * @returns {object} Información del audio
     * 
     * Retorna metadatos útiles para logging y depuración
     */
    getAudioInfo(audioBuffer) {
        return {
            size: audioBuffer.length,  // Tamaño en bytes
            sizeInMB: (audioBuffer.length / 1024 / 1024).toFixed(2),  // Tamaño en MB
            format: 'OGG_OPUS',  // Formato por defecto de WhatsApp
        };
    }
}

// Exportar una instancia única (singleton)
module.exports = new AudioProcessor();
