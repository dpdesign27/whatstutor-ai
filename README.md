# Whatstutor AI 🎓

A bilingual conversational AI tutor integrated with WhatsApp, powered by Google Cloud AI services. Practice English through text and voice conversations with an intelligent tutor available 24/7 on WhatsApp.

## ✨ Features

- 📱 **WhatsApp Integration**: Interact via text messages or voice notes
- 🗣️ **Voice Support**: Send voice notes in English or Spanish, get voice responses
- 🤖 **AI-Powered**: Uses Google Dialogflow CX for natural conversations
- 🌍 **Bilingual**: Supports English and Spanish with automatic language detection
- 💬 **Context-Aware**: Maintains conversation context across messages
- 🎯 **Tutoring Focus**: Designed specifically for English language learning

## 🏗️ Architecture

```
WhatsApp (User) 
    ↓
Twilio WhatsApp API
    ↓
Express Webhook Server
    ↓
Message Handler
    ├─→ Audio Processor (for voice notes)
    ├─→ Speech-to-Text (Google Cloud)
    ├─→ Dialogflow CX (conversation AI)
    ├─→ Text-to-Speech (Google Cloud)
    └─→ WhatsApp Client (Twilio)
```

## 📋 Prerequisites

- Node.js 18+ 
- Google Cloud Platform account with billing enabled
- Twilio account (free tier available)
- Google Cloud services enabled:
  - Dialogflow CX API
  - Cloud Speech-to-Text API
  - Cloud Text-to-Speech API

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd whatstutor-ai
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Cloud
GOOGLE_PROJECT_ID=your_project_id
DIALOGFLOW_AGENT_ID=your_agent_id
```

### 3. Set Up Google Cloud Credentials

1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Save it as `config/google-credentials.json`
4. Update `GOOGLE_APPLICATION_CREDENTIALS` in `.env`

### 4. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 5. Configure Twilio Webhook

1. Log in to [Twilio Console](https://console.twilio.com/)
2. Go to WhatsApp Sandbox settings
3. Set webhook URL to your public endpoint: `https://your-domain.com/webhook`
   - For local development, use [ngrok](https://ngrok.com/): `ngrok http 3000`
4. Set HTTP method to `POST`

### 6. Test the Integration

Send a WhatsApp message to your Twilio sandbox number:

```
Hello!
```

You should receive a response from Whatstutor AI!

## 📚 Detailed Setup Guides

- [Google Cloud Setup](docs/SETUP_GUIDE.md#google-cloud-setup)
- [Twilio Configuration](docs/SETUP_GUIDE.md#twilio-configuration)
- [Dialogflow Agent Creation](docs/SETUP_GUIDE.md#dialogflow-setup)
- [Deployment Guide](docs/SETUP_GUIDE.md#deployment)

## 🗂️ Project Structure

```
whatstutor-ai/
├── src/
│   ├── config/
│   │   └── config.js          # Configuration management
│   ├── routes/
│   │   └── webhook.js         # WhatsApp webhook endpoints
│   ├── services/
│   │   ├── audioProcessor.js  # Audio download & processing
│   │   ├── dialogflow.js      # Dialogflow CX integration
│   │   ├── messageHandler.js  # Main message orchestration
│   │   ├── speechToText.js    # Google Speech-to-Text
│   │   ├── textToSpeech.js    # Google Text-to-Speech
│   │   └── whatsappClient.js  # Twilio WhatsApp client
│   ├── utils/
│   │   ├── errorHandler.js    # Error handling utilities
│   │   └── logger.js          # Winston logger
│   └── server.js              # Express server entry point
├── config/
│   └── google-credentials.json # Google Cloud credentials (gitignored)
├── docs/
│   ├── SETUP_GUIDE.md
│   └── ARCHITECTURE.md
├── temp/                       # Temporary audio files
├── logs/                       # Application logs
├── .env                        # Environment variables (gitignored)
├── .env.example               # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🎯 Usage Examples

### Text Conversation

```
User: "Hello! I want to practice English."
Bot: "Hi! I'd love to help you practice English. What would you like to talk about today?"

User: "Let's talk about hobbies."
Bot: "Great choice! What are some of your favorite hobbies?"
```

### Voice Conversation

1. Record a voice note: "Hello, how are you today?"
2. Send to WhatsApp
3. Receive transcription confirmation
4. Get AI response in text (and voice if configured)

### Language Switching

```
User: "Hola, ¿cómo estás?"
Bot: "¡Hola! Estoy aquí para ayudarte a practicar inglés. ¿Quieres que continuemos en inglés?"
```

## 🔧 Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Run Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## 📊 Monitoring

Check server health:

```bash
curl http://localhost:3000/health
```

View logs:

```bash
tail -f logs/combined.log
tail -f logs/error.log
```

## 🌐 Deployment

See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md#deployment) for detailed deployment instructions for:

- Google Cloud Run
- AWS EC2
- Heroku
- DigitalOcean

## 💰 Cost Considerations

### Free Tier Limits

- **Dialogflow CX**: 100 requests/month free
- **Speech-to-Text**: 60 minutes/month free
- **Text-to-Speech**: 1M characters/month free
- **Twilio Sandbox**: Free for testing with approved numbers

### Production Costs (Approximate)

- Dialogflow CX: $0.007 per request
- Speech-to-Text: $0.006 per 15 seconds
- Text-to-Speech: $4 per 1M characters
- Twilio WhatsApp: ~$0.005 per message

**Estimated cost for 1000 conversations/month**: $10-20

## 🛠️ Troubleshooting

### "Configuration validation failed"

Make sure all required environment variables are set in `.env`

### "Failed to download audio"

Check Twilio credentials and ensure the server can access Twilio's media URLs

### "Dialogflow intent detection failed"

Verify your Dialogflow agent ID and ensure the agent is properly trained

### Webhook not receiving messages

- Check that your webhook URL is publicly accessible
- Verify Twilio webhook configuration
- Check server logs for errors

## 📖 API Documentation

### POST /webhook

Receives incoming WhatsApp messages from Twilio.

**Request Body** (from Twilio):
```json
{
  "From": "whatsapp:+1234567890",
  "Body": "Hello",
  "NumMedia": "0",
  "MessageSid": "SM..."
}
```

**Response**: `200 OK`

### GET /webhook

Webhook verification endpoint.

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Twilio](https://www.twilio.com/) for WhatsApp API
- [Google Cloud](https://cloud.google.com/) for AI services
- [Dialogflow CX](https://cloud.google.com/dialogflow) for conversation AI

## 📞 Support

For issues and questions:
- Check the [troubleshooting guide](docs/SETUP_GUIDE.md#troubleshooting)
- Review server logs in `logs/`
- Open an issue on GitHub

---

**Built with ❤️ for language learners worldwide**
