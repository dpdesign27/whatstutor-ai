// Importar dependencias necesarias
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');
const webhookRoutes = require('./routes/webhook');

// Inicializar la aplicación Express
const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// Parsear datos de formularios URL-encoded y JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware para registrar todas las peticiones entrantes
app.use((req, res, next) => {
    logger.info('Petición entrante', {
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    next();
});

// ========================================
// RUTAS
// ========================================

// Endpoint de verificación de salud
// GET /health - Retorna el estado del servidor
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(), // Tiempo que lleva el servidor ejecutándose
    });
});

// Rutas del webhook de WhatsApp
app.use('/webhook', webhookRoutes);

// Endpoint raíz - Información de la API
app.get('/', (req, res) => {
    res.json({
        name: 'Whatstutor AI',
        version: '1.0.0',
        description: 'Tutor conversacional de IA bilingüe para WhatsApp',
        endpoints: {
            health: '/health',
            webhook: '/webhook',
        },
    });
});

// Manejador 404 - Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
    });
});

// Manejador de errores global
app.use(errorHandler);

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = config.port;

/**
 * Función para iniciar el servidor
 * Valida la configuración antes de comenzar
 */
const startServer = async () => {
    try {
        // Validar la configuración del entorno
        if (!config.validate()) {
            logger.warn('Validación de configuración falló. El servidor se iniciará pero puede no funcionar correctamente.');
        }

        // Iniciar el servidor en el puerto especificado
        app.listen(PORT, () => {
            logger.info('🚀 Servidor Whatstutor AI Iniciado', {
                port: PORT,
                environment: config.nodeEnv,
                endpoints: {
                    health: `http://localhost:${PORT}/health`,
                    webhook: `http://localhost:${PORT}/webhook`,
                },
            });

            logger.info('📱 ¡Listo para recibir mensajes de WhatsApp!');
        });
    } catch (error) {
        logger.error('Error al iniciar el servidor', { error: error.message });
        process.exit(1);
    }
};

// ========================================
// MANEJADORES DE EVENTOS DEL PROCESO
// ========================================

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
    logger.error('Excepción No Capturada', { error: error.message, stack: error.stack });
    process.exit(1);
});

// Manejar promesas rechazadas no manejadas
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Rechazo No Manejado', { reason, promise });
    process.exit(1);
});

// Apagado gracioso con SIGTERM
process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido, apagando graciosamente');
    process.exit(0);
});

// Apagado gracioso con SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    logger.info('SIGINT recibido, apagando graciosamente');
    process.exit(0);
});

// Iniciar el servidor
startServer();

// Exportar la aplicación para pruebas
module.exports = app;
