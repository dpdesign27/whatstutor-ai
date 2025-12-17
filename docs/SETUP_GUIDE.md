# Whatstutor AI - Setup Guide

Complete setup instructions for deploying Whatstutor AI.

## Table of Contents

1. [Google Cloud Setup](#google-cloud-setup)
2. [Twilio Configuration](#twilio-configuration)
3. [Dialogflow Setup](#dialogflow-setup)
4. [Local Development](#local-development)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

## Google Cloud Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project"
3. Enter project name: `whatstutor-ai`
4. Note your Project ID

### 2. Enable Required APIs

Enable these APIs in your project:

```bash
gcloud services enable dialogflow.googleapis.com
gcloud services enable speech.googleapis.com
gcloud services enable texttospeech.googleapis.com
```

Or via Console:
- Navigate to "APIs & Services" > "Enable APIs and Services"
- Search and enable:
  - Dialogflow CX API
  - Cloud Speech-to-Text API
  - Cloud Text-to-Speech API

### 3. Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `whatstutor-service-account`
4. Grant roles:
   - Dialogflow API Client
   - Cloud Speech Client
   - Cloud Text-to-Speech Client
5. Click "Create Key" > JSON
6. Download and save as `config/google-credentials.json`

### 4. Set Up Billing

> **Important**: You need billing enabled to use these APIs, but they have generous free tiers.

1. Go to "Billing" in Cloud Console
2. Link a billing account
3. Set up budget alerts (recommended: $20/month)

## Twilio Configuration

### 1. Create Twilio Account

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Verify your email and phone
3. Navigate to Console Dashboard

### 2. Get Account Credentials

From the Twilio Console:

1. Copy **Account SID**
2. Copy **Auth Token**
3. Add to `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
```

### 3. Set Up WhatsApp Sandbox

> **For Testing**: Use Twilio Sandbox (free)

1. Go to "Messaging" > "Try it out" > "Send a WhatsApp message"
2. Follow instructions to join sandbox:
   - Send `join <your-sandbox-code>` to  `+1 415 523 8886`
3. Note your sandbox number:

```env
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Configure Webhook

You need a publicly accessible URL:

**Option A: Using ngrok (for local development)**

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Option B: Production server**

Use your deployed server URL (e.g., `https://whatstutor.example.com`)

**Configure in Twilio:**

1. Go to WhatsApp Sandbox Settings
2. Under "When a message comes in":
   - URL: `https://your-url.com/webhook`
   - Method: `POST`
3. Click "Save"

### 5. Production WhatsApp (Optional)

For production use beyond testing:

1. Apply for WhatsApp Business API access
2. Complete verification process
3. Get approved WhatsApp number
4. Update `.env` with your number

## Dialogflow Setup

### 1. Create Dialogflow CX Agent

1. Go to [Dialogflow CX Console](https://dialogflow.cloud.google.com/cx)
2. Select your Google Cloud project
3. Click "Create Agent"
4. Configure:
   - **Display name**: Whatstutor AI
   - **Default language**: English
   - **Time zone**: Your timezone
   - **Location**: global

### 2. Create Intents

Create these basic intents:

**Intent: Default Welcome**
```
Training phrases:
- Hello
- Hi
- Hey
- Good morning

Responses:
- Hi! I'm your English tutor. How can I help you practice today?
- Hello! Ready to practice English? What would you like to talk about?
```

**Intent: Greeting**
```
Training phrases:
- How are you
- How's it going
- What's up

Responses:
- I'm doing great! How about you?
- I'm wonderful! How are you doing today?
```

**Intent: Practice Request**
```
Training phrases:
- I want to practice English
- Let's practice
- Help me learn English
- I need English practice

Responses:
- Great! What topic would you like to practice? Grammar, conversation, or vocabulary?
- Excellent! Let's start practicing. What interests you?
```

**Intent: Goodbye**
```
Training phrases:
- Bye
- Goodbye
- See you later
- Talk to you later

Responses:
- Goodbye! Keep practicing!
- See you later! Great job today!
```

### 3. Add Spanish Support

1. In agent settings, click "Add Language"
2. Select "Spanish - es"
3. Translate key intents for Spanish support

### 4. Get Agent ID

1. Click on agent settings (gear icon)
2. Copy the Agent ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Add to `.env`:

```env
DIALOGFLOW_AGENT_ID=your_agent_id_here
DIALOGFLOW_LOCATION=global
```

### 5. Test Agent

1. Use "Test Agent" panel in Dialogflow
2. Try queries like "Hello", "I want to practice English"
3. Verify responses work correctly

## Local Development

### 1. Install Dependencies

```bash
cd whatstutor-ai
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials.

### 3. Start Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### 4. Test Endpoints

**Health check:**
```bash
curl http://localhost:3000/health
```

**Simulate webhook (text message):**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890" \
  -d "Body=Hello" \
  -d "MessageSid=SM123" \
  -d "NumMedia=0"
```

### 5. Monitor Logs

```bash
tail -f logs/combined.log
```

## Deployment

### Option 1: Google Cloud Run

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/whatstutor-ai

# Deploy
gcloud run deploy whatstutor-ai \
  --image gcr.io/YOUR_PROJECT_ID/whatstutor-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Create app
heroku create whatstutor-ai

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=yourvalue
heroku config:set TWILIO_AUTH_TOKEN=yourvalue
# ... set all env vars

# Deploy
git push heroku main
```

### Option 3: DigitalOcean App Platform

1. Create account at DigitalOcean
2. Go to "Apps" > "Create App"
3. Connect GitHub repository
4. Configure:
   - Build command: `npm install`
   - Run command: `npm start`
5. Add environment variables
6. Deploy

### Option 4: AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd whatstutor-ai

# Install dependencies
npm install

# Use PM2 for process management
sudo npm install -g pm2
pm2 start src/server.js --name whatstutor-ai

# Configure nginx as reverse proxy
sudo apt-get install nginx
# Configure /etc/nginx/sites-available/default
```

## Troubleshooting

### Issue: "Configuration validation failed"

**Solution**: Ensure all required env variables are set:
```bash
# Check .env file
cat .env

# Verify these are set:
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
GOOGLE_PROJECT_ID
DIALOGFLOW_AGENT_ID
```

### Issue: "Failed to download audio"

**Causes**:
- Invalid Twilio credentials
- Server can't access Twilio URLs
- Firewall blocking outbound requests

**Solution**:
```bash
# Test Twilio credentials
curl -X GET 'https://api.twilio.com/2010-04-01/Accounts.json' \
  -u "YOUR_SID:YOUR_TOKEN"
```

### Issue: "Dialogflow intent detection failed"

**Causes**:
- Wrong Agent ID
- Agent not trained
- Service account lacks permissions

**Solution**:
1. Verify Agent ID in Dialogflow Console
2. Test agent in Dialogflow UI
3. Check service account has "Dialogflow API Client" role

### Issue: Webhook not receiving messages

**Causes**:
- Webhook URL not accessible
- Wrong HTTP method (should be POST)
- Twilio configuration error

**Solution**:
```bash
# Test webhook accessibility
curl https://your-webhook-url.com/webhook

# Should return: "Whatstutor AI Webhook Active"
```

### Issue: "Google Cloud authentication failed"

**Solution**:
```bash
# Verify credentials file exists
ls -la config/google-credentials.json

# Test credentials
export GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
node -e "require('@google-cloud/speech').SpeechClient()"
```

### Getting Help

1. Check server logs: `logs/error.log`
2. Enable debug logging: `LOG_LEVEL=debug` in `.env`
3. Test each service independently
4. Review Twilio debugger: https://console.twilio.com/monitor/debugger

## Next Steps

After successful setup:

1. ✅ Test basic text conversation
2. ✅ Test voice note functionality
3. ✅ Switch between English/Spanish
4. ✅ Monitor costs in Google Cloud Console
5. ✅ Set up monitoring/alerts
6. ✅ Create more sophisticated Dialogflow intents
7. ✅ Add user progress tracking

---

**Need help?** Check the main [README](../README.md) or open an issue.
