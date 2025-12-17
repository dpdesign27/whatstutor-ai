// Importar servicios y utilidades necesarias
const whatsappClient = require('./whatsappClient');
const speechToText = require('./speechToText');
const textToSpeech = require('./textToSpeech');
const dialogflow = require('./dialogflow');
const audioProcessor = require('./audioProcessor');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errorHandler');

/**
 * Clase para manejar mensajes entrantes de WhatsApp
 * Orquesta el flujo de procesamiento de mensajes de texto y voz
 */
class MessageHandler {
    /**
     * Procesar mensaje entrante desde WhatsApp
     * @param {object} message - Objeto del mensaje de Twilio
     * 
     * Este es el punto de entrada principal para todos los mensajes
     * Determina si es texto o voz y lo enruta apropiadamente
     */
    async handleIncomingMessage(message) {
        try {
            const { From, Body, NumMedia, MessageSid } = message;

            logger.info('Procesando mensaje entrante', {
                from: From,
                hasMedia: NumMedia > 0,
                messageSid: MessageSid,
            });

            // Verificar si es un mensaje de audio (nota de voz)
            if (NumMedia && parseInt(NumMedia) > 0) {
                await this.handleVoiceMessage(message);
            } else if (Body) {
                // Es un mensaje de texto
                await this.handleTextMessage(message);
            } else {
                // Formato de mensaje inválido
                throw new ValidationError('Formato de mensaje inválido');
            }
        } catch (error) {
            logger.error('Manejo de mensaje falló', {
                error: error.message,
                from: message.From,
            });

            // Enviar mensaje de error al usuario
            await this.sendErrorMessage(message.From, error);
        }
    }

    /**
     * Manejar mensaje de texto
     * @param {object} message - Objeto del mensaje
     * 
     * Flujo: Detectar idioma → Enviar a Dialogflow → Responder
     */
    async handleTextMessage(message) {
        const { From, Body } = message;

        logger.info('Manejando mensaje de texto', { from: From, text: Body });

        try {
            // Detectar el idioma del texto (heurística simple)
            const languageCode = this.detectLanguage(Body);

            // Enviar a Dialogflow para procesamiento de IA
            const response = await dialogflow.detectIntent(Body, From, languageCode);

            // Enviar respuesta de vuelta al usuario
            await whatsappClient.sendTextMessage(From, response.text);

            logger.info('Mensaje de texto manejado exitosamente', {
                from: From,
                intent: response.intent,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Manejar mensaje de voz (nota de voz)
     * @param {object} message - Objeto del mensaje
     * 
     * Flujo: Descargar audio → Transcribir → Confirmar → Dialogflow → Responder
     */
    async handleVoiceMessage(message) {
        const { From, MediaUrl0, MessageSid } = message;

        logger.info('Manejando mensaje de voz', {
            from: From,
            mediaUrl: MediaUrl0,
        });

        try {
            // Paso 1: Descargar y procesar el archivo de audio
            const audioBuffer = await audioProcessor.processVoiceNote(
                MediaUrl0,
                MessageSid
            );

            // Paso 2: Transcribir audio a texto usando Google Cloud
            const transcription = await speechToText.transcribeWithLanguageDetection(
                audioBuffer
            );

            logger.info('Voz transcrita', {
                text: transcription.text,
                language: transcription.language,
                confidence: transcription.confidence,
            });

            // Paso 3: Enviar confirmación de transcripción al usuario
            const confirmationMessage = `🎤 Escuché: "${transcription.text}"\n\nDéjame responderte...`;
            await whatsappClient.sendTextMessage(From, confirmationMessage);

            // Paso 4: Obtener respuesta de IA de Dialogflow
            const response = await dialogflow.detectIntent(
                transcription.text,
                From,
                transcription.language
            );

            // Paso 5: Generar respuesta de voz (opcional)
            // Nota: Para enviar audio real por WhatsApp, necesitas alojar el archivo públicamente
            const voiceLanguage = this.mapLanguageCode(transcription.language);
            const audioFilePath = await textToSpeech.synthesizeToFile(
                response.text,
                voiceLanguage,
                `response_${MessageSid}`
            );

            // Por ahora, enviar respuesta de texto
            // En producción, podrías subir el audio a un servidor y enviar la URL
            await whatsappClient.sendTextMessage(From, response.text);

            logger.info('Mensaje de voz manejado exitosamente', {
                from: From,
                intent: response.intent,
            });

            // Paso 6: Limpiar archivos temporales
            await audioProcessor.cleanupTempFile(`${MessageSid}.ogg`);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Detectar idioma del texto (heurística simple)
     * @param {string} text - Texto de entrada
     * @returns {string} Código de idioma ('en' o 'es')
     * 
     * Busca palabras comunes en español para determinar el idioma
     * Método mejorable: podría usar una biblioteca de detección de idioma
     */
    detectLanguage(text) {
        // Patrones comunes de palabras en español
        const spanishPatterns = /\b(hola|gracias|por favor|buenos|días|cómo|está|qué|sí|no)\b/i;

        if (spanishPatterns.test(text)) {
            return 'es';
        }

        // Por defecto, asumir inglés
        return 'en';
    }

    /**
     * Mapear código de idioma de Dialogflow a código de idioma TTS
     * @param {string} languageCode - Código de idioma de Dialogflow
     * @returns {string} Código de idioma para TTS
     * 
     * Convierte códigos de idioma cortos a formato completo para Text-to-Speech
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
     * Enviar mensaje de error al usuario
     * @param {string} to - Número del destinatario
     * @param {Error} error - Objeto de error
     * 
     * Envía mensajes de error amigables, ocultando detalles técnicos
     */
    async sendErrorMessage(to, error) {
        const errorMessage = error.isOperational
            ? `❌ ${error.message}`
            : "❌ Tengo problemas para procesar tu mensaje. Por favor, intenta de nuevo más tarde.";

        try {
            await whatsappClient.sendTextMessage(to, errorMessage);
        } catch (sendError) {
            logger.error('Error al enviar mensaje de error', {
                error: sendError.message,
                to,
            });
        }
    }

    /**
     * Enviar mensaje de bienvenida a nuevos usuarios
     * @param {string} to - Número del destinatario
     * 
     * Mensaje inicial que explica cómo usar el bot
     */
    async sendWelcomeMessage(to) {
        const welcomeMessage =
            '👋 ¡Bienvenido a Whatstutor AI!\n\n' +
            "Soy tu tutor personal de inglés. Puedes:\n" +
            '✅ Enviarme mensajes de texto\n' +
            '✅ Enviarme notas de voz\n' +
            '✅ Practicar conversación en inglés\n\n' +
            "¡Comencemos a practicar! Di hola o cuéntame sobre tu día.";

        await whatsappClient.sendTextMessage(to, welcomeMessage);
    }
}

// Exportar una instancia única (singleton)
module.exports = new MessageHandler();
