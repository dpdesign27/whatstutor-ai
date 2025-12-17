// Importar Express Router para definir rutas
const express = require('express');
const router = express.Router();
const messageHandler = require('../services/messageHandler');
const logger = require('../utils/logger');
const { asyncHandler } = require('../utils/errorHandler');

/**
 * RUTAS DEL WEBHOOK DE WHATSAPP
 * 
 * Estas rutas reciben mensajes de WhatsApp a través de Twilio
 * Twilio llama a estos endpoints cuando el bot recibe mensajes
 */

/**
 * POST /webhook
 * Recibe mensajes entrantes de WhatsApp desde Twilio
 * 
 * Flujo:
 * 1. Twilio envía el mensaje a este endpoint
 * 2. Registramos la petición
 * 3. Procesamos el mensaje de forma asíncrona
 * 4. Respondemos inmediatamente con 200 OK a Twilio
 * 
 * ¿Por qué responder inmediatamente?
 * - Twilio tiene un timeout de 10 segundos
 * - El procesamiento puede tardar más (transcripción, IA, etc.)
 * - Procesamos en segundo plano para no bloquear
 */
router.post(
    '/',
    asyncHandler(async (req, res) => {
        logger.info('Webhook recibido', {
            from: req.body.From,  // Número de WhatsApp del remitente
            body: req.body.Body?.substring(0, 50),  // Primeros 50 caracteres del mensaje
            hasMedia: req.body.NumMedia > 0,  // ¿Tiene archivos adjuntos?
        });

        // Procesar mensaje de forma asíncrona (no bloqueante)
        // Si hay error, solo se registra, no afecta la respuesta a Twilio
        messageHandler.handleIncomingMessage(req.body).catch(error => {
            logger.error('Manejo de mensaje asíncrono falló', {
                error: error.message,
            });
        });

        // Responder inmediatamente a Twilio con 200 OK
        // Esto confirma que recibimos el mensaje exitosamente
        res.status(200).send('OK');
    })
);

/**
 * GET /webhook
 * Endpoint de verificación del webhook de Twilio
 * 
 * Twilio puede llamar a este endpoint para verificar
 * que el webhook está activo y respondiendo
 */
router.get('/', (req, res) => {
    logger.info('Solicitud de verificación de webhook');
    res.status(200).send('Webhook de Whatstutor AI Activo');
});

// Exportar el router para usarlo en el servidor principal
module.exports = router;
