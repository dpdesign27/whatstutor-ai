// Importar biblioteca Winston para logging avanzado
const winston = require('winston');
const config = require('../config/config');

/**
 * SISTEMA DE LOGGING CON WINSTON
 * 
 * Winston es una biblioteca de logging flexible y poderosa
 * Permite registrar mensajes en múltiples formatos y destinos
 * 
 * Niveles de log (de mayor a menor prioridad):
 * - error: Errores que requieren atención inmediata
 * - warn: Advertencias sobre situaciones potencialmente problemáticas
 * - info: Información general sobre el flu jo de la aplicación
 * - debug: Información de depuración detallada
 */

// Formato de log estructurado (JSON) para archivos
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // Añadir timestamp
    winston.format.errors({ stack: true }),  // Incluir stack traces de errores
    winston.format.splat(),  // Soportar interpolación de strings (%s, %d, etc.)
    winston.format.json()  // Formatear como JSON para fácil parsing
);

// Formato de log legible para consola (desarrollo)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),  // Colorear niveles de log
    winston.format.timestamp({ format: 'HH:mm:ss' }),  // Timestamp corto
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        // Si hay metadatos adicionales, agregarlos
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

/**
 * Crear instancia del logger
 * 
 * Configuración:
 * - Nivel de log desde configuración (por defecto 'info')
 * - Múltiples destinos (transports): consola y archivos
 */
const logger = winston.createLogger({
    level: config.app.logLevel,  // Nivel mínimo de logs a registrar
    format: logFormat,  // Formato para archivos
    transports: [
        // Transport 1: Consola (para desarrollo)
        // Usa formato colorizado y legible
        new winston.transports.Console({
            format: consoleFormat,
        }),

        // Transport 2: Archivo de errores
        // Solo registra mensajes de nivel 'error'
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),

        // Transport 3: Archivo combinado
        // Registra todos los niveles de log
        new winston.transports.File({
            filename: 'logs/combined.log',
        }),
    ],
});

/**
 * Stream para integración con Morgan (HTTP logger)
 * 
 * Morgan es un middleware de Express para logging de peticiones HTTP
 * Este stream permite que Morgan use nuestro logger Winston
 */
logger.stream = {
    write: (message) => {
        logger.info(message.trim());  // Registrar mensajes HTTP como 'info'
    },
};

// Exportar el logger para uso en toda la aplicación
module.exports = logger;
