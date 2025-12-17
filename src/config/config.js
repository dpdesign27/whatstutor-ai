require('dotenv').config();

module.exports = {
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Twilio
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
        adminNumber: process.env.ADMIN_WHATSAPP_NUMBER,
    },

    // Google Cloud
    googleCloud: {
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        dialogflow: {
            location: process.env.DIALOGFLOW_LOCATION || 'global',
            agentId: process.env.DIALOGFLOW_AGENT_ID,
        },
    },

    // Speech
    speech: {
        sttLanguage: process.env.SPEECH_TO_TEXT_LANGUAGE || 'en-US',
        ttsLanguage: process.env.TEXT_TO_SPEECH_LANGUAGE || 'en-US',
        ttsVoice: process.env.TEXT_TO_SPEECH_VOICE || 'en-US-Neural2-F',
        supportedLanguages: process.env.SUPPORTED_LANGUAGES?.split(',') || ['en', 'es'],
    },

    // Application
    app: {
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
        maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE) || 16777216, // 16 MB
        logLevel: process.env.LOG_LEVEL || 'info',
    },

    // Validate configuration
    validate() {
        const required = [
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_WHATSAPP_NUMBER',
            'GOOGLE_PROJECT_ID',
            'DIALOGFLOW_AGENT_ID',
        ];

        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
            console.warn('⚠️  Please copy .env.example to .env and fill in the required values.');
            return false;
        }

        return true;
    },
};
