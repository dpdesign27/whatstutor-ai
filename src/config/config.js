// Cargar variables de entorno desde el archivo .env
require('dotenv').config();

/**
 * Módulo de Configuración Central
 * 
 * Este archivo gestiona todas las configuraciones de la aplicación
 * Lee las variables de entorno y proporciona valores por defecto
 */
module.exports = {
    // ========================================
    // CONFIGURACIÓN DEL SERVIDOR
    // ========================================
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // ========================================
    // CONFIGURACIÓN DE TWILIO
    // ========================================
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,        // SID de la cuenta de Twilio
        authToken: process.env.TWILIO_AUTH_TOKEN,          // Token de autenticación
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER, // Número de WhatsApp del bot
        adminNumber: process.env.ADMIN_WHATSAPP_NUMBER,    // Número del administrador
    },

    // ========================================
    // CONFIGURACIÓN DE GOOGLE CLOUD
    // ========================================
    googleCloud: {
        projectId: process.env.GOOGLE_PROJECT_ID,           // ID del proyecto de Google Cloud
        credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Ruta al archivo de credenciales JSON
        dialogflow: {
            location: process.env.DIALOGFLOW_LOCATION || 'global', // Ubicación del agente (normalmente 'global')
            agentId: process.env.DIALOGFLOW_AGENT_ID,        // ID del agente de Dialogflow CX
        },
    },

    // ========================================
    // CONFIGURACIÓN DE VOZ (SPEECH)
    // ========================================
    speech: {
        // Idioma para Speech-to-Text (reconocimiento de voz)
        sttLanguage: process.env.SPEECH_TO_TEXT_LANGUAGE || 'en-US',
        // Idioma para Text-to-Speech (síntesis de voz)
        ttsLanguage: process.env.TEXT_TO_SPEECH_LANGUAGE || 'en-US',
        // Voz específica para TTS (formato: idioma-región-Neural2-género)
        ttsVoice: process.env.TEXT_TO_SPEECH_VOICE || 'en-US-Neural2-F',
        // Idiomas soportados por la aplicación
        supportedLanguages: process.env.SUPPORTED_LANGUAGES?.split(',') || ['en', 'es'],
    },

    // ========================================
    // CONFIGURACIÓN DE LA APLICACIÓN
    // ========================================
    app: {
        // Tiempo de espera de sesión en milisegundos (1 hora por defecto)
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000,
        // Tamaño máximo de archivo de audio en bytes (16 MB por defecto)
        maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE) || 16777216,
        // Nivel de registro (info, warn, error, debug)
        logLevel: process.env.LOG_LEVEL || 'info',
    },

    /**
     * Validar la configuración
     * 
     * Verifica que todas las variables de entorno requeridas estén configuradas
     * @returns {boolean} true si la configuración es válida, false en caso contrario
     */
    validate() {
        // Lista de variables de entorno requeridas
        const required = [
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_WHATSAPP_NUMBER',
            'GOOGLE_PROJECT_ID',
            'DIALOGFLOW_AGENT_ID',
        ];

        // Buscar variables faltantes
        const missing = required.filter(key => !process.env[key]);

        // Si faltan variables, mostrar advertencia
        if (missing.length > 0) {
            console.warn(`⚠️  Variables de entorno faltantes: ${missing.join(', ')}`);
            console.warn('⚠️  Por favor copia .env.example a .env y completa los valores requeridos.');
            return false;
        }

        return true;
    },
};
