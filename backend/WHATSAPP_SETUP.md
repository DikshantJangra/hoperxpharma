# WhatsApp Business Integration - Environment Setup Guide

## Multi-Tenant Architecture

HopeRxPharma uses a **multi-tenant SaaS approach** for WhatsApp Business integration:

- **ONE Meta/Facebook Developer app** for the entire platform (configured in `.env`)
- **Each pharmacy/store** connects their own WhatsApp Business Account (WABA) through Embedded Signup
- **Store-specific credentials** (access tokens, WABA IDs, phone number IDs) are stored encrypted in the database per store
- **Webhook routing** maps `phone_number_id` → `storeId` to route messages to the correct tenant

## Environment Variables Required

Add these to your `.env` file:

```bash
# WhatsApp Business Integration
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=hoperx_whatsapp_verify_token
WHATSAPP_ENCRYPTION_KEY=generate_random_32_byte_hex_key
```

### How to Get These Values

#### 1. Create Meta Developer App (One-Time Platform Setup)

1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Choose "Business" app type
4. Fill in app name (e.g., "HopeRxPharma Integration")
5. Go to app dashboard → Copy **App ID** and **App Secret**

#### 2. Enable WhatsApp Product

1. In your Meta app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. Choose "Cloud API" (not On-Premises)
4. Complete the setup wizard

#### 3. Configure Webhook

1. In WhatsApp Product settings, find "Webhook" section
2. Set **Callback URL**: `https://yourdomain.com/api/v1/whatsapp/webhook`
3. Set **Verify Token**: Use the same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env`
4. Subscribe to webhook fields:
   - `messages`
   - `message_statuses`
5. Click "Verify and Save"

#### 4. Generate Encryption Key

Run this in terminal to generate a secure random key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `WHATSAPP_ENCRYPTION_KEY`.

## Database Migration

Before starting the server, run the Prisma migration:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

This will create the necessary tables:
- `WhatsAppAccount` - Per-store WABA credentials (encrypted)
- `Conversation` - Message threads per customer
- `Message` - Individual messages with status tracking
- `WhatsAppTemplate` - Pre-approved message templates
- `WhatsAppOutboundQueue` - Retry queue for failed sends

## Testing the Integration

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Verify Webhook Endpoint

Test webhook verification:

```bash
curl "http://localhost:8000/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hoperx_whatsapp_verify_token&hub.challenge=test123"
```

Should return: `test123`

### 3. Test from Frontend

The Embedded Signup flow will be initiated from the frontend at `/integrations/whatsapp`.

## Important Notes

- **DO NOT** share `FB_APP_SECRET` or `WHATSAPP_ENCRYPTION_KEY` publicly
- **DO NOT** commit `.env` file to Git
- **HTTPS required** in production for webhook URL
- **Media download** is not implemented yet (fields exist for future use)
- Each store must complete Business Verification through Meta for full features

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/whatsapp/connect` | POST | Store temp token from Embedded Signup |
| `/api/v1/whatsapp/finalize` | POST | Complete WABA setup & subscribe webhook |
| `/api/v1/whatsapp/status/:storeId` | GET | Get connection status |
| `/api/v1/whatsapp/verify-phone` | POST | Submit OTP for phone verification |
| `/api/v1/whatsapp/conversations/:storeId` | GET | List conversations |
| `/api/v1/whatsapp/messages/:conversationId` | GET | Get messages |
| `/api/v1/whatsapp/send` | POST | Send text message |
| `/api/v1/whatsapp/send-template` | POST | Send template (for >24hr) |
| `/api/v1/whatsapp/templates/:storeId` | GET | List templates |
| `/api/v1/whatsapp/templates` | POST | Create template |
| `/api/v1/whatsapp/webhook` | GET/POST | Webhook for Meta |

## Troubleshooting

**Webhook not receiving messages:**
- Verify webhook URL is HTTPS in production
- Check `FB_APP_SECRET` matches Meta app settings
- Ensure webhook is subscribed to WABA (call `/finalize` endpoint)

**Phone verification fails:**
- Ensure phone number is not already used with personal WhatsApp
- Check OTP was sent to correct number
- Verify phone number status in Meta Business Manager

**Token encryption errors:**
- Ensure `WHATSAPP_ENCRYPTION_KEY` is exactly 64 hex characters
- Don't change the key after storing encrypted tokens (data loss)

## Next Steps

1. Set up Meta Developer app
2. Add environment variables
3. Run database migrations
4. Configure webhook in Meta dashboard
5. Build frontend integration pages (see `/app/(main)/integrations/whatsapp`)
