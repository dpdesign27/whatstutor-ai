# Whatstutor AI - System Architecture

Technical architecture documentation for Whatstutor AI.

## Overview

Whatstutor AI is a microservices-based application that integrates WhatsApp messaging with Google Cloud AI services to provide an intelligent English tutoring experience.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         End User                                 │
│                     (WhatsApp Client)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ WhatsApp Message (Text/Voice)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Twilio WhatsApp API                           │
│  - Message routing                                               │
│  - Media hosting                                                 │
│  - Webhook delivery                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP POST /webhook
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Whatstutor AI Server (Node.js)                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Webhook Route Handler                       │   │
│  │  - Receives messages                                     │   │
│  │  - Returns 200 OK immediately                            │   │
│  │  - Queues for async processing                           │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Message Handler                             │   │
│  │  - Determines message type (text/audio)                  │   │
│  │  - Routes to appropriate processor                       │   │
│  │  - Manages conversation flow                             │   │
│  │  - Error handling                                        │   │
│  └──────┬───────────────────────────────────┬──────────────┘   │
│         │                                    │                  │
│         │ Text Message                       │ Voice Note       │
│         ▼                                    ▼                  │
│  ┌──────────────┐                  ┌──────────────────────┐   │
│  │   Language   │                  │  Audio Processor     │   │
│  │   Detection  │                  │  - Download audio    │   │
│  └──────┬───────┘                  │  - Validate size     │   │
│         │                           └──────┬───────────────┘   │
│         │                                  │                   │
│         │                                  ▼                   │
│         │                          ┌──────────────────────┐   │
│         │                          │  Speech-to-Text      │   │
│         │                          │  (Google Cloud)      │   │
│         │                          │  - Transcribe audio  │   │
│         │ ◄────────────────────────┤  - Detect language   │   │
│         │                          └──────────────────────┘   │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Dialogflow CX Service                       │ │
│  │  - Session management                                    │ │
│  │  - Intent detection                                      │ │
│  │  - Context tracking                                      │ │
│  │  - Generate response                                     │ │
│  └────────────────────┬────────────────────────────────────┘ │
│                       │                                        │
│                       ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Response Handler                            │ │
│  │  - Format response                                       │ │
│  │  - Optional: Generate voice                              │ │
│  └──────┬──────────────────────────────────┬───────────────┘ │
│         │                                   │                 │
│         │ Text Response                     │ Voice Response  │
│         ▼                                   ▼                 │
│  ┌──────────────┐                  ┌──────────────────────┐ │
│  │   WhatsApp   │                  │  Text-to-Speech      │ │
│  │   Client     │                  │  (Google Cloud)      │ │
│  │              │ ◄────────────────┤  - Synthesize voice  │ │
│  │              │                  │  - Save audio file   │ │
│  └──────┬───────┘                  └──────────────────────┘ │
│         │                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │
          │ Send via Twilio API
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Twilio WhatsApp API                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         End User                                 │
│                     (WhatsApp Client)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. WhatsApp Client (Frontend)

**Technology**: WhatsApp mobile/web app

**Responsibilities**:
- User input via text or voice notes
- Display bot responses
- Handle media (voice notes, images)

**Data Flow**:
- Outbound: Messages → Twilio → Our Server
- Inbound: Our Server → Twilio → Messages

### 2. Twilio WhatsApp API

**Technology**: Twilio Messaging Service

**Responsibilities**:
- Bridge between WhatsApp and our server
- Host media files temporarily
- Deliver webhooks to our server
- Send responses back to users

**Key Features**:
- Sandbox for testing (free)
- Production API (requires approval)
- Media URL hosting
- Delivery receipts

### 3. Express Server

**Technology**: Node.js + Express.js

**Port**: 3000 (configurable)

**Endpoints**:
- `POST /webhook` - Receive WhatsApp messages
- `GET /webhook` - Webhook verification
- `GET /health` - Health check
- `GET /` - API info

**Middleware**:
- Body parser (URL-encoded, JSON)
- Request logging
- Error handling

### 4. Message Handler Service

**File**: `src/services/messageHandler.js`

**Responsibilities**:
- Message type detection (text vs audio)
- Route to appropriate processor
- Language detection
- Error handling & user feedback
- Welcome messages

**Key Methods**:
- `handleIncomingMessage()` - Main entry point
- `handleTextMessage()` - Process text
- `handleVoiceMessage()` - Process audio
- `sendErrorMessage()` - User-friendly errors

### 5. Audio Processor Service

**File**: `src/services/audioProcessor.js`

**Responsibilities**:
- Download audio from Twilio URLs
- Validate file size (max 16MB)
- Save to temp directory
- Cleanup old files

**Authentication**: Uses Twilio credentials

**Supported Formats**: OGG OPUS (WhatsApp default)

### 6. Speech-to-Text Service

**File**: `src/services/speechToText.js`

**Technology**: Google Cloud Speech-to-Text API

**Features**:
- Automatic language detection
- Support for English and Spanish
- Confidence scoring
- Automatic punctuation

**Configuration**:
```javascript
{
  encoding: 'OGG_OPUS',
  sampleRateHertz: 16000,
  languageCode: 'en-US',
  alternativeLanguageCodes: ['es-ES', 'en-US'],
  enableAutomaticPunctuation: true
}
```

### 7. Dialogflow CX Service

**File**: `src/services/dialogflow.js`

**Technology**: Google Dialogflow CX

**Responsibilities**:
- Session management
- Intent detection
- Context preservation
- Response generation

**Session Handling**:
- UUID-based session IDs
- Mapped to WhatsApp user numbers
- Configurable timeout (default: 1 hour)

**Key Methods**:
- `detectIntent()` - Send query, get response
- `getSessionId()` - Session management
- `extractResponseText()` - Parse Dialogflow response

### 8. Text-to-Speech Service

**File**: `src/services/textToSpeech.js`

**Technology**: Google Cloud Text-to-Speech API

**Features**:
- Neural voices (higher quality)
- Multiple languages
- Gender selection
- Speed/pitch control

**Voice Configuration**:
- English: `en-US-Neural2-F` (Female)
- Spanish (ES): `es-ES-Neural2-A` (Female)
- Spanish (US): `es-US-Neural2-A` (Female)

**Output Format**: OGG OPUS (WhatsApp compatible)

### 9. WhatsApp Client Service

**File**: `src/services/whatsappClient.js`

**Technology**: Twilio Node.js SDK

**Responsibilities**:
- Send text messages
- Send audio messages
- Retry logic
- Error handling

**Key Methods**:
- `sendTextMessage()` - Send text
- `sendAudioMessage()` - Send voice
- `sendMessageWithRetry()` - Auto-retry

## Data Flow

### Text Message Flow

```
1. User sends text → WhatsApp
2. WhatsApp → Twilio API
3. Twilio → POST /webhook
4. Webhook → MessageHandler
5. MessageHandler → Language Detection
6. MessageHandler → Dialogflow.detectIntent()
7. Dialogflow → AI Response
8. MessageHandler → WhatsAppClient.sendTextMessage()
9. Twilio → WhatsApp
10. WhatsApp → User sees response
```

**Average latency**: 500-1500ms

### Voice Note Flow

```
1. User records voice → WhatsApp
2. WhatsApp → Twilio (uploads media)
3. Twilio → POST /webhook (with MediaUrl)
4. Webhook → MessageHandler
5. MessageHandler → AudioProcessor.downloadAudio()
6. AudioProcessor → Downloads from Twilio
7. MessageHandler → SpeechToText.transcribe()
8. SpeechToText → Google Cloud STT
9. MessageHandler → Confirms transcription to user
10. MessageHandler → Dialogflow.detectIntent()
11. Dialogflow → AI Response
12. MessageHandler → TextToSpeech.synthesize() [optional]
13. TextToSpeech → Google Cloud TTS
14. MessageHandler → WhatsAppClient.sendTextMessage()
15. Twilio → WhatsApp
16. WhatsApp → User sees response
```

**Average latency**: 2-5 seconds

## Security Considerations

### 1. API Authentication

- **Twilio**: Account SID + Auth Token (HTTP Basic Auth)
- **Google Cloud**: Service account JSON key file
- **Credentials**: Stored in `.env`, never committed to git

### 2. Data Privacy

- **Voice recordings**: Downloaded temporarily, deleted after processing
- **Transcriptions**: Not persisted (logged only in debug mode)
- **User data**: WhatsApp numbers used as session IDs
- **Compliance**: Consider GDPR/CCPA for production

### 3. Rate Limiting

**Current**: None (should add for production)

**Recommended**:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
});

app.use('/webhook', limiter);
```

### 4. Input Validation

- Audio file size limits (16MB max)
- Message length validation
- Media type verification

### 5. Error Handling

- Never expose internal errors to users
- Log all errors with context
- Graceful degradation

## Scalability Considerations

### Current Architecture

- **Single instance**: Suitable for hundreds of users
- **Stateless**: Session data in memory (lost on restart)
- **Synchronous**: Processes one message at a time per user

### Production Scaling

**For thousands of users**:

1. **Add message queue**:
   ```
   Webhook → Redis Queue → Worker Processes → Services
   ```

2. **Persistent session storage**:
   ```javascript
   // Replace in-memory Map with Redis
   const redis = require('redis');
   const client = redis.createClient();
   ```

3. **Load balancing**:
   ```
   Nginx → [Instance 1, Instance 2, Instance 3]
   ```

4. **Caching**:
   - Cache Dialogflow responses for common queries
   - Cache TTS audio for common phrases

5. **Database** (for user tracking):
   ```
   PostgreSQL or MongoDB
   - User profiles
   - Conversation history
   - Progress tracking
   ```

## Monitoring & Logging

### Current Logging

**Winston logger** with:
- Console output (colored, formatted)
- File output: `logs/combined.log`
- Error file: `logs/error.log`

### Production Monitoring

**Recommended additions**:

1. **Application metrics**:
   - Request latency
   - Error rates
   - Active sessions

2. **External monitoring**:
   - Google Cloud Monitoring
   - Datadog / New Relic
   - Uptime monitoring

3. **Alerting**:
   - Error rate > 5%
   - Response time > 5s
   - Service downtime

## Cost Analysis

### Per 1000 Conversations

**Assumptions**:
- 5 messages per conversation
- 50% text, 50% voice
- Average voice note: 10 seconds

**Costs**:
- Dialogflow CX: 5000 requests × $0.007 = $35
- Speech-to-Text: 2500 × 10s × $0.006/15s = $10
- Text-to-Speech: 2500 × 50 chars × $4/1M = $0.50
- Twilio: 5000 messages × $0.005 = $25
- **Total**: ~$70/month

**Free tier covers**:
- First 100 conversations (well within limits)

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18+ | JavaScript execution |
| Framework | Express.js | 4.18+ | Web server |
| WhatsApp | Twilio API | 5.0+ | Messaging |
| AI Engine | Dialogflow CX | Latest | Conversations |
| STT | Google Cloud | Latest | Voice to text |
| TTS | Google Cloud | Latest | Text to voice |
| Logging | Winston | 3.11+ | Application logs |
| HTTP Client | Axios | 1.6+ | API requests |

## Future Enhancements

1. **User Authentication**: Link WhatsApp to user accounts
2. **Progress Tracking**: Store learning progress in database
3. **Gamification**: Points, streaks, achievements
4. **Group Lessons**: Support WhatsApp groups
5. **Web Dashboard**: View progress, stats, settings
6. **Multi-tutor**: Different personas (strict, friendly, etc.)
7. **Exercise Mode**: Specific grammar/vocabulary drills
8. **Voice Analysis**: Pronunciation feedback

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0
