// Importar biblioteca de Twilio para WhatsApp
const twilio = require('twilio');
const config = require('../config/config');
const logger = require('../utils/logger');
const { WhatsAppError } = require('../utils/errorHandler');

/**
 * Cliente de WhatsApp usando la API de Twilio
 * 
 * Esta clase maneja toda la comunicación con WhatsApp a través de Twilio
 * Incluye funcionalidades para enviar mensajes de texto y audio
 */
class WhatsAppClient {
    /**
     * Constructor
     * Inicializa el cliente de Twilio con las credenciales de configuración
     */
    constructor() {
        // Crear cliente de Twilio con credenciales
        this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
        // Número de WhatsApp desde el que se enviarán los mensajes
        this.fromNumber = config.twilio.whatsappNumber;
    }

    /**
     * Enviar un mensaje de texto vía WhatsApp
     * @param {string} to - Número de WhatsApp del destinatario (formato: whatsapp:+1234567890)
     * @param {string} message - Texto del mensaje a enviar
     * @returns {Promise<object>} Respuesta del mensaje de Twilio
     */
    async sendTextMessage(to, message) {
        try {
            logger.info('Enviando mensaje de texto', { to, messageLength: message.length });

            // Crear y enviar el mensaje usando la API de Twilio
            const response = await this.client.messages.create({
                from: this.fromNumber,      // Número de WhatsApp del bot
                to,                          // Número del destinatario
                body: message,               // Contenido del mensaje
            });

            logger.info('Mensaje enviado exitosamente', { sid: response.sid, to });
            return response;
        } catch (error) {
            logger.error('Error al enviar mensaje de texto', { error: error.message, to });
            throw new WhatsAppError(`Error al enviar mensaje: ${error.message}`);
        }
    }

    /**
     * Enviar un mensaje de audio vía WhatsApp  
     * @param {string} to - Número de WhatsApp del destinatario
     * @param {string} audioUrl - URL pública del archivo de audio
     * @returns {Promise<object>} Respuesta del mensaje de Twilio
     * 
     * Nota: El archivo de audio debe estar alojado en una URL pública accesible
     */
    async sendAudioMessage(to, audioUrl) {
        try {
            logger.info('Enviando mensaje de audio', { to, audioUrl });

            // Crear mensaje con archivo de medios (audio)
            const response = await this.client.messages.create({
                from: this.fromNumber,
                to,
                mediaUrl: [audioUrl],        // Array de URLs de medios
            });

            logger.info('Mensaje de audio enviado exitosamente', { sid: response.sid, to });
            return response;
        } catch (error) {
            logger.error('Error al enviar mensaje de audio', { error: error.message, to });
            throw new WhatsAppError(`Error al enviar audio: ${error.message}`);
        }
    }

    /**
     * Enviar mensaje con lógica de reintento
     * @param {string} to - Número del destinatario
     * @param {string} message - Texto del mensaje
     * @param {number} retries - Número de intentos de reintento (por defecto 3)
     * 
     * Reintenta automáticamente si falla el envío, útil para problemas temporales de red
     */
    async sendMessageWithRetry(to, message, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await this.sendTextMessage(to, message);
            } catch (error) {
                // Si es el último intento, lanzar el error
                if (attempt === retries) {
                    throw error;
                }
                // Esperar antes de reintentar (tiempo de espera incremental)
                logger.warn(`Intento de reintento ${attempt}/${retries} para mensaje a ${to}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    /**
     * Formatear número de WhatsApp
     * @param {string} number - Número de teléfono
     * @returns {string} Número de WhatsApp formateado
     * 
     * Asegura que el número tenga el prefijo 'whatsapp:' requerido por Twilio
     */
    static formatWhatsAppNumber(number) {
        // Si ya está formateado, devolver tal cual
        if (number.startsWith('whatsapp:')) {
            return number;
        }

        // Agregar prefijo whatsapp:
        return `whatsapp:${number}`;
    }
}

// Exportar una instancia única del cliente (singleton)
module.exports = new WhatsAppClient();
