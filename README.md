# Whatstutor AI 🎓

Un tutor conversacional de IA bilingüe integrado con WhatsApp, impulsado por los servicios de IA de Google Cloud. Practica inglés mediante conversaciones de texto y voz con un tutor inteligente disponible 24/7 en WhatsApp.

## ✨ Características

- 📱 **Integración con WhatsApp**: Interactúa mediante mensajes de texto o notas de voz
- 🗣️ **Soporte de Voz**: Envía notas de voz en inglés o español, recibe respuestas de voz
- 🤖 **Impulsado por IA**: Utiliza Google Dialogflow CX para conversaciones naturales
- 🌍 **Bilingüe**: Soporta inglés y español con detección automática de idioma
- 💬 **Consciente del Contexto**: Mantiene el contexto de la conversación a través de los mensajes
- 🎯 **Enfoque Tutorial**: Diseñado específicamente para el aprendizaje del idioma inglés

## 🏗️ Arquitectura

```
WhatsApp (Usuario) 
    ↓
API de WhatsApp de Twilio
    ↓
Servidor Webhook Express
    ↓
Manejador de Mensajes
    ├─→ Procesador de Audio (para notas de voz)
    ├─→ Speech-to-Text (Google Cloud)
    ├─→ Dialogflow CX (IA conversacional)
    ├─→ Text-to-Speech (Google Cloud)
    └─→ Cliente de WhatsApp (Twilio)
```

## 📋 Prerequisitos

- Node.js 18 o superior
- Cuenta de Google Cloud Platform con facturación habilitada
- Cuenta de Twilio (nivel gratuito disponible)
- Servicios de Google Cloud habilitados:
  - API de Dialogflow CX
  - API de Cloud Speech-to-Text
  - API de Cloud Text-to-Speech

## 🚀 Inicio Rápido

### 1. Clonar e Instalar

```bash
cd whatstutor-ai
npm install
```

### 2. Configurar Entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y completa tus credenciales:

```env
# Twilio
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Cloud
GOOGLE_PROJECT_ID=tu_project_id
DIALOGFLOW_AGENT_ID=tu_agent_id
```

### 3. Configurar Credenciales de Google Cloud

1. Crea una cuenta de servicio en la Consola de Google Cloud
2. Descarga el archivo de clave JSON
3. Guárdalo como `config/google-credentials.json`
4. Actualiza `GOOGLE_APPLICATION_CREDENTIALS` en `.env`

### 4. Iniciar el Servidor

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

### 5. Configurar Webhook de Twilio

1. Inicia sesión en [Consola de Twilio](https://console.twilio.com/)
2. Ve a la configuración de WhatsApp Sandbox
3. Establece la URL del webhook a tu punto final público: `https://tu-dominio.com/webhook`
   - Para desarrollo local, usa [ngrok](https://ngrok.com/): `ngrok http 3000`
4. Establece el método HTTP como `POST`

### 6. Probar la Integración

Envía un mensaje de WhatsApp a tu número sandbox de Twilio:

```
Hello!
```

¡Deberías recibir una respuesta de Whatstutor AI!

## 📚 Guías Detalladas de Configuración

- [Configurar Google Cloud](docs/GUIA_CONFIGURACION.md#configuración-google-cloud)
- [Configuración de Twilio](docs/GUIA_CONFIGURACION.md#configuración-twilio)
- [Crear Agente Dialogflow](docs/GUIA_CONFIGURACION.md#configuración-dialogflow)
- [Guía de Despliegue](docs/GUIA_CONFIGURACION.md#despliegue)

## 🗂️ Estructura del Proyecto

```
whatstutor-ai/
├── src/
│   ├── config/
│   │   └── config.js          # Gestión de configuración
│   ├── routes/
│   │   └── webhook.js         # Endpoints del webhook de WhatsApp
│   ├── services/
│   │   ├── audioProcessor.js  # Descarga y procesamiento de audio
│   │   ├── dialogflow.js      # Integración con Dialogflow CX
│   │   ├── messageHandler.js  # Orquestación principal de mensajes
│   │   ├── speechToText.js    # Google Speech-to-Text
│   │   ├── textToSpeech.js    # Google Text-to-Speech
│   │   └── whatsappClient.js  # Cliente de WhatsApp con Twilio
│   ├── utils/
│   │   ├── errorHandler.js    # Utilidades de manejo de errores
│   │   └── logger.js          # Logger Winston
│   └── server.js              # Punto de entrada del servidor Express
├── config/
│   └── google-credentials.json # Credenciales de Google Cloud (ignorado en git)
├── docs/
│   ├── GUIA_CONFIGURACION.md
│   └── ARQUITECTURA.md
├── temp/                       # Archivos de audio temporales
├── logs/                       # Registros de la aplicación
├── .env                        # Variables de entorno (ignorado en git)
├── .env.example               # Plantilla de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🎯 Ejemplos de Uso

### Conversación de Texto

```
Usuario: "¡Hola! Quiero practicar inglés."
Bot: "¡Hola! Me encantaría ayudarte a practicar inglés. ¿De qué quieres hablar hoy?"

Usuario: "Hablemos de pasatiempos."
Bot: "¡Excelente elección! ¿Cuáles son algunos de tus pasatiempos favoritos?"
```

### Conversación de Voz

1. Graba una nota de voz: "Hola, ¿cómo estás hoy?"
2. Envíala a WhatsApp
3. Recibe confirmación de la transcripción
4. Obtén respuesta de IA en texto (y voz si está configurada)

### Cambio de Idioma

```
User: "Hola, ¿cómo estás?"
Bot: "¡Hola! Estoy aquí para ayudarte a practicar inglés. ¿Quieres que continuemos en inglés?"
```

## 🔧 Desarrollo

### Instalar Dependencias

```bash
npm install
```

### Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

### Ejecutar Servidor de Producción

```bash
npm start
```

### Linting

```bash
npm run lint
```

## 📊 Monitoreo

Verificar estado del servidor:

```bash
curl http://localhost:3000/health
```

Ver registros:

```bash
tail -f logs/combined.log
tail -f logs/error.log
```

## 🌐 Despliegue

Consulta [docs/GUIA_CONFIGURACION.md](docs/GUIA_CONFIGURACION.md#despliegue) para instrucciones detalladas de despliegue en:

- Google Cloud Run
- AWS EC2
- Heroku
- DigitalOcean

## 💰 Consideraciones de Costos

### Límites del Nivel Gratuito

- **Dialogflow CX**: 100 peticiones/mes gratis
- **Speech-to-Text**: 60 minutos/mes gratis
- **Text-to-Speech**: 1M caracteres/mes gratis
- **Twilio Sandbox**: Gratis para pruebas con números aprobados

### Costos de Producción (Aproximados)

- Dialogflow CX: $0.007 por petición
- Speech-to-Text: $0.006 por 15 segundos
- Text-to-Speech: $4 por 1M caracteres
- Twilio WhatsApp: ~$0.005 por mensaje

**Costo estimado para 1000 conversaciones/mes**: $10-20

## 🛠️ Solución de Problemas

### "Validación de configuración falló"

Asegúrate de que todas las variables de entorno requeridas estén configuradas en `.env`

### "Falló la descarga de audio"

Verifica las credenciales de Twilio y asegúrate de que el servidor pueda acceder a las URLs de medios de Twilio

### "Falló la detección de intención de Dialogflow"

Verifica tu ID de agente de Dialogflow y asegúrate de que el agente esté correctamente entrenado

### El webhook no recibe mensajes

- Verifica que tu URL de webhook sea públicamente accesible
- Verifica la configuración del webhook de Twilio
- Revisa los registros del servidor para errores

## 📖 Documentación de la API

### POST /webhook

Recibe mensajes entrantes de WhatsApp desde Twilio.

**Cuerpo de la Petición** (desde Twilio):
```json
{
  "From": "whatsapp:+1234567890",
  "Body": "Hola",
  "NumMedia": "0",
  "MessageSid": "SM..."
}
```

**Respuesta**: `200 OK`

### GET /webhook

Endpoint de verificación del webhook.

### GET /health

Endpoint de verificación de estado.

**Respuesta**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, siéntete libre de enviar un Pull Request.

## 📄 Licencia

Licencia MIT - consulta el archivo LICENSE para más detalles

## 🙏 Agradecimientos

- [Twilio](https://www.twilio.com/) por la API de WhatsApp
- [Google Cloud](https://cloud.google.com/) por los servicios de IA
- [Dialogflow CX](https://cloud.google.com/dialogflow) por la IA conversacional

## 📞 Soporte

Para problemas y preguntas:
- Consulta la [guía de solución de problemas](docs/GUIA_CONFIGURACION.md#solucion-problemas)
- Revisa los registros del servidor en `logs/`
- Abre un issue en GitHub

---

**Construido con ❤️ para estudiantes de idiomas en todo el mundo**
