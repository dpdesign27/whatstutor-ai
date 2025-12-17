// Importar cliente de Dialogflow CX para inteligencia conversacional
const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const config = require('../config/config');
const logger = require('../utils/logger');
const { DialogflowError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Servicio de Dialogflow CX
 * 
 * Maneja la interacción con Google Dialogflow CX para procesamiento de lenguaje natural
 * Gestiona sesiones de usuario y detecta intenciones conversacionales
 */
class DialogflowService {
    /**
     * Constructor
     * Inicializa el cliente de Dialogflow con las credenciales de Google Cloud
     */
    constructor() {
        // Crear cliente de sesiones de Dialogflow
        this.client = new SessionsClient({
            projectId: config.googleCloud.projectId,
            keyFilename: config.googleCloud.credentials,
        });

        // Guardar configuración del proyecto
        this.projectId = config.googleCloud.projectId;
        this.location = config.googleCloud.dialogflow.location;
        this.agentId = config.googleCloud.dialogflow.agentId;

        // Almacenar sesiones activas en memoria
        // Clave: número de WhatsApp del usuario, Valor: ID de sesión
        this.sessions = new Map();
    }

    /**
     * Obtener o crear ID de sesión para un usuario
     * @param {string} userId - Identificador del usuario (número de WhatsApp)
     * @returns {string} ID de sesión
     * 
     * Cada usuario tiene una sesión única que mantiene el contexto de la conversación
     */
    getSessionId(userId) {
        if (!this.sessions.has(userId)) {
            // Crear nuevo ID de sesión usando UUID
            const sessionId = uuidv4();
            this.sessions.set(userId, sessionId);
            logger.info('Nueva sesión creada', { userId, sessionId });
        }
        return this.sessions.get(userId);
    }

    /**
     * Construir ruta de sesión completa
     * @param {string} sessionId - ID de sesión
     * @returns {string} Ruta completa de sesión
     * 
     * Formato: projects/{project}/locations/{location}/agents/{agent}/sessions/{session}
     */
    getSessionPath(sessionId) {
        return `projects/${this.projectId}/locations/${this.location}/agents/${this.agentId}/sessions/${sessionId}`;
    }

    /**
     * Enviar consulta de texto a Dialogflow
     * @param {string} text - Texto de entrada del usuario
     * @param {string} userId - Identificador del usuario
     * @param {string} languageCode - Código de idioma ('en' o 'es')
     * @returns {Promise<object>} Respuesta de Dialogflow
     * 
     * Este es el método principal que envía el texto del usuario a la IA
     * y recibe una respuesta contextualizada
     */
    async detectIntent(text, userId, languageCode = 'en') {
        try {
            // Obtener ID de sesión para mantener el contexto
            const sessionId = this.getSessionId(userId);
            const sessionPath = this.getSessionPath(sessionId);

            logger.info('Enviando consulta a Dialogflow', {
                text,
                userId,
                sessionId,
                languageCode,
            });

            // Construir petición para Dialogflow
            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text,  // Texto del usuario
                    },
                    languageCode,  // Idioma de la consulta
                },
            };

            // Enviar petición y esperar respuesta
            const [response] = await this.client.detectIntent(request);
            const queryResult = response.queryResult;

            logger.info('Respuesta de Dialogflow recibida', {
                intent: queryResult.intent?.displayName,
                confidence: queryResult.intentDetectionConfidence,
                responseMessages: queryResult.responseMessages?.length,
            });

            // Retornar respuesta estructurada
            return {
                text: this.extractResponseText(queryResult),
                intent: queryResult.intent?.displayName || 'Desconocido',
                confidence: queryResult.intentDetectionConfidence || 0,
                parameters: queryResult.parameters,
                languageCode: queryResult.languageCode,
            };
        } catch (error) {
            logger.error('Detección de intención de Dialogflow falló', {
                error: error.message,
                userId,
            });
            throw new DialogflowError(
                `Error al procesar con IA: ${error.message}`
            );
        }
    }

    /**
     * Extraer texto de respuesta de los mensajes de Dialogflow
     * @param {object} queryResult - Resultado de la consulta de Dialogflow
     * @returns {string} Texto de respuesta
     * 
     * Dialogflow puede devolver múltiples mensajes de respuesta,
     * esta función los combina en un solo texto
     */
    extractResponseText(queryResult) {
        if (!queryResult.responseMessages || queryResult.responseMessages.length === 0) {
            return "Lo siento, no entendí eso. ¿Podrías reformularlo?";
        }

        // Combinar todas las respuestas de texto
        const textResponses = queryResult.responseMessages
            .filter(msg => msg.text)  // Filtrar solo mensajes de texto
            .map(msg => msg.text.text)  // Extraer el texto
            .flat();  // Aplanar arrays anidados

        return textResponses.join('\n') || "¡Estoy aquí para ayudarte a practicar inglés!";
    }

    /**
     * Limpiar sesión de usuario
     * @param {string} userId - Identificador del usuario
     * 
     * Útil para reiniciar una conversación o limpiar memoria
     */
    clearSession(userId) {
        if (this.sessions.has(userId)) {
            this.sessions.delete(userId);
            logger.info('Sesión limpiada', { userId });
        }
    }

    /**
     * Obtener contador de sesiones activas
     * @returns {number} Número de sesiones activas
     * 
     * Útil para monitoreo y estadísticas
     */
    getActiveSessionCount() {
        return this.sessions.size;
    }

    /**
     * Limpiar sesiones antiguas (llamado periódicamente)
     * @param {number} maxAge - Edad máxima en milisegundos
     * 
     * En producción, deberías implementar un seguimiento de timestamps
     * y eliminar sesiones que hayan estado inactivas por mucho tiempo
     */
    cleanupSessions(maxAge = config.app.sessionTimeout) {
        // Para producción, necesitarías rastrear timestamps de sesión
        // Por ahora, solo registrar la limpieza
        logger.info('Limpieza de sesiones activada', {
            activeSessions: this.sessions.size,
        });
    }
}

// Exportar una instancia única (singleton)
module.exports = new DialogflowService();
