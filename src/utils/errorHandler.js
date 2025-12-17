// Importar logger para registrar errores
const logger = require('./logger');

/**
 * SISTEMA DE MANEJO DE ERRORES
 * 
 * Define clases de error personalizadas y manejadores globales
 * Permite distinguir entre diferentes tipos de errores y manejarlos apropiadamente
 */

// ========================================
// CLASES DE ERROR PERSONALIZADAS
// ========================================

/**
 * Error base de la aplicación
 * 
 * Todos los errores personalizados heredan de esta clase
 * Incluye código de estado HTTP y flag de error operacional
 */
class AppError extends Error {
    /**
     * @param {string} message - Mensaje de error
     * @param {number} statusCode - Código de estado HTTP (por defecto 500)
     */
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;  // Flag para distinguir errores operacionales de bugs
        Error.captureStackTrace(this, this.constructor);  // Capturar stack trace limpio
    }
}

/**
 * Error de validación (400 Bad Request)
 * Usado cuando los datos del usuario son inválidos
 */
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

/**
 * Error de procesamiento de audio (422 Unprocessable Entity)
 * Usado cuando hay problemas con archivos de audio
 */
class AudioProcessingError extends AppError {
    constructor(message) {
        super(message, 422);
    }
}

/**
 * Error de WhatsApp (502 Bad Gateway)
 * Usado cuando falla la comunicación con Twilio/WhatsApp
 */
class WhatsAppError extends AppError {
    constructor(message) {
        super(message, 502);
    }
}

/**
 * Error de Dialogflow (503 Service Unavailable)
 * Usado cuando falla la comunicación con Dialogflow
 */
class DialogflowError extends AppError {
    constructor(message) {
        super(message, 503);
    }
}

// ========================================
// MANEJADOR DE ERRORES GLOBAL
// ========================================

/**
 * Middleware de manejo de errores de Express
 * 
 * Este es el último middleware en la cadena
 * Captura todos los errores y envía una respuesta apropiada
 * 
 * @param {Error} err - Objeto de error
 * @param {object} req - Objeto de petición de Express
 * @param {object} res - Objeto de respuesta de Express
 * @param {function} next - Función next (no usada pero requerida por Express)
 */
const errorHandler = (err, req, res, next) => {
    const { statusCode = 500, message, stack } = err;

    // Registrar el error con contexto
    logger.error('Error ocurrió:', {
        statusCode,
        message,
        stack,
        url: req?.originalUrl,  // URL que causó el error
        method: req?.method,    // Método HTTP (GET, POST, etc.)
    });

    // Preparar respuesta de error
    const response = {
        success: false,
        message: err.isOperational ? message : 'Error Interno del Servidor',
    };

    // En desarrollo, incluir stack trace para depuración
    if (process.env.NODE_ENV === 'development') {
        response.stack = stack;
    }

    // Enviar respuesta de error al cliente
    res.status(statusCode).json(response);
};

// ========================================
// WRAPPER PARA FUNCIONES ASÍNCRONAS
// ========================================

/**
 * Wrapper para manejar errores en funciones asíncronas
 * 
 * Express no maneja errores de promesas rechazadas automáticamente
 * Este wrapper captura errores y los pasa al manejador de errores
 * 
 * Uso:
 * router.get('/ruta', asyncHandler(async (req, res) => {
 *   // código asíncrono aquí
 * }));
 * 
 * @param {function} fn - Función asíncrona a envolver
 * @returns {function} Función envuelta que maneja errores
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// ========================================
// EXPORTAR MÓDULOS
// ========================================

module.exports = {
    // Clases de error
    AppError,
    ValidationError,
    AudioProcessingError,
    WhatsAppError,
    DialogflowError,
    // Utilidades
    errorHandler,
    asyncHandler,
};
