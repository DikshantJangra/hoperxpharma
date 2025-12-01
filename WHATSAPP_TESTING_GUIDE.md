# WhatsApp Business Integration - Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ Meta Developer app created with WhatsApp Business API enabled
- ✅ Environment variables configured in `.env`
- ✅ Database migrations run (`npx prisma migrate deploy`)
- ✅ Backend server running on expected port
- ✅ Frontend dev server running

---

## Test Plan Overview

### Phase 1: Backend Unit Tests
### Phase 2: Integration Setup Tests
### Phase 3: End-to-End User Flow Tests
### Phase 4: Multi-Tenant Isolation Tests
### Phase 5: Security & Error Handling Tests

---

## Phase 1: Backend Unit Tests

### 1.1 Token Encryption

**Test:** Encryption/decryption utility

```bash
# Create test file: backend/tests/encryption.test.js
cd backend
npm test encryption.test.js
```

**Expected:**
- ✅ Encrypted token is not plaintext
- ✅ Decrypted token matches original
- ✅ Wrong key fails to decrypt
- ✅ Tampered ciphertext throws error

### 1.2 Webhook Signature Verification

**Test:** Signature validation

```bash
npm test webhookVerification.test.js
```

**Expected:**
- ✅ Valid signature passes
- ✅ Invalid signature fails
- ✅ Missing signature fails
- ✅ Constant-time comparison prevents timing attacks

### 1.3 Repository Methods

**Test:** Database operations

```bash
npm test whatsappAccountRepository.test.js
npm test conversationRepository.test.js
npm test messageRepository.test.js
```

**Expected:**
- ✅ CRUD operations work
- ✅ Tenant isolation enforced
- ✅ Phone number routing works

---

## Phase 2: Integration Setup Tests

### 2.1 Manual Token Setup

**Steps:**
1. Open Postman/cURL
2. POST to `/api/v1/whatsapp/manual-token`
   ```json
   {
     "storeId": "test-store-123",
     "systemToken": "YOUR_META_SYSTEM_USER_TOKEN"
   }
   ```
3. Check response: `{ "success": true }`
4. Query database: `SELECT * FROM WhatsAppAccount WHERE storeId = 'test-store-123'`

**Expected:**
- ✅ Account created with encrypted token
- ✅ Status set to ACTIVE
- ✅ Phone number and WABA ID populated

### 2.2 Connection Status

**Steps:**
1. GET `/api/v1/whatsapp/status/test-store-123`

**Expected:**
```json
{
  "connected": true,
  "status": "ACTIVE",
  "phoneNumber": "+1234567890",
  "phoneNumberId": "...",
  "businessName": "Test Pharmacy"
}
```

### 2.3 Webhook Verification

**Steps:**
1. GET `/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hoperx_whatsapp_verify_token&hub.challenge=TEST123`

**Expected:**
- ✅ Returns `TEST123` (the challenge value)

---

## Phase 3: End-to-End User Flow Tests

### 3.1 Complete Connection Flow (UI)

**Owner Persona:**

1. **Navigate to Integrations**
   - Open `/integrations`
   - ✅ WhatsApp card shows "Not Connected"
   - Click "Connect WhatsApp"

2. **Manual Setup (easier to test)**
   - Click "Manual Setup"
   - Paste system user token
   - Click "Connect Token"
   - ✅ Success message appears
   - ✅ Redirects to management page
   - ✅ Status shows "Connected"

3. **Phone Verification (if needed)**
   - If status shows "NEEDS_VERIFICATION"
   - Enter 6-digit OTP code
   - ✅ Status changes to "ACTIVE"

### 3.2 Template Management

**Steps:**

1. **Sync Templates from Meta**
   - Navigate to `/integrations/whatsapp`
   - Click "Sync from Meta"
   - ✅ Templates appear in table
   - ✅ Status shows APPROVED/PENDING/REJECTED

2. **Create Template (via Meta Business Manager)**
   - Go to Meta Business Manager
   - Create a simple template
   - Return to HopeRx and sync
   - ✅ New template appears

### 3.3 Inbound Message Routing

**Steps:**

1. **Send Test Message**
   - From your personal WhatsApp, send message to the connected business number
   - Message: "Test message from customer"

2. **Verify in Backend Logs**
   ```bash
   # Check backend console
   [Webhook] Saved inbound message <id> for store <storeId>
   ```

3. **Check Messages Inbox**
   - Navigate to `/messages/whatsapp`
   - ✅ New conversation appears in sidebar
   - ✅ Message shows in thread
   - ✅ Timestamp is correct
   - ✅ Unread badge shows "1"

4. **Verify Database**
   ```sql
   SELECT * FROM Conversation WHERE phoneNumber = '+YOUR_PHONE';
   SELECT * FROM Message WHERE conversationId = '...';
   ```
   - ✅ Conversation record exists
   - ✅ Message record exists with correct content

### 3.4 Outbound Messaging

**Steps:**

1. **Reply to Conversation**
   - Open conversation in `/messages/whatsapp`
   - Type reply: "Hello! This is a test reply from HopeRx"
   - Click Send
   - ✅ Message appears in thread immediately (optimistic UI)
   - ✅ Delivery status shows ✓ (sent)

2. **Verify on Personal Phone**
   - ✅ Message received on WhatsApp
   - ✅ Content is correct
   - ✅ Sent from business number

3. **Check Status Updates**
   - Wait for delivery/read receipts
   - Refresh inbox
   - ✅ Status changes to ✓✓ (delivered)
   - ✅ Status changes to blue ✓✓ (read) after opening on phone

### 3.5 24-Hour Session Enforcement

**Steps:**

1. **Create Old Conversation**
   - Manually update database: Set `lastCustomerMessageAt` to 25 hours ago
   - Set `sessionActive = false`

2. **Try to Send**
   - Open conversation
   - ✅ Warning badge shows "Session expired"
   - ✅ Text input shows template-only message
   - ✅ Send button disabled for regular text

3. **Send Template**
   - Click template picker (if implemented)
   - Select approved template
   - Send
   - ✅ Template message sent successfully
   - ✅ Session reactivated

### 3.6 Template Message Sending

**Steps:**

1. **Use Template Endpoint**
   ```bash
   curl -X POST http://localhost:8000/api/v1/whatsapp/send-template \
     -H "Content-Type: application/json" \
     -d '{
       "conversationId": "...",
       "templateName": "your_template_name",
       "templateLanguage": "en",
       "parameters": ["John", "tomorrow"]
     }'
   ```

2. **Verify on Phone**
   - ✅ Template message received with parameters filled in
   - ✅ Formatting is correct

---

## Phase 4: Multi-Tenant Isolation Tests

### 4.1 Setup Multiple Stores

**Steps:**

1. Create Store A with WhatsApp number A
2. Create Store B with WhatsApp number B
3. Send messages to both numbers

### 4.2 Verify Isolation

**Expected:**

- ✅ Messages to Number A only appear in Store A's inbox
- ✅ Messages to Number B only appear in Store B's inbox
- ✅ Attempting to access Store A's conversations from Store B fails
- ✅ Database records correctly tagged with storeId

### 4.3 Webhook Routing Test

**Steps:**

1. Send webhook with `phone_number_id` for Store A
2. Check logs: Should route to Store A
3. Verify Store B doesn't see the message

---

## Phase 5: Security & Error Handling Tests

### 5.1 Token Encryption in Database

**Test:**

```sql
SELECT accessToken FROM WhatsAppAccount LIMIT 1;
```

**Expected:**
- ✅ Token is NOT plaintext
- ✅ Token is base64-encoded ciphertext
- ✅ Contains salt + IV + tag + encrypted data

### 5.2 Webhook Signature Rejection

**Test:**

```bash
curl -X POST http://localhost:8000/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=INVALID_SIGNATURE" \
  -d '{"test": "data"}'
```

**Expected:**
- ✅ Returns 401 Unauthorized
- ✅ Logs warning about invalid signature
- ✅ Does NOT process the webhook

### 5.3 Invalid Token Handling

**Test:**

```bash
curl -X POST http://localhost:8000/api/v1/whatsapp/manual-token \
  -d '{
    "storeId": "test",
    "systemToken": "INVALID_TOKEN"
  }'
```

**Expected:**
- ✅ Returns error message: "Failed to connect: ..."
- ✅ Account not created in database

### 5.4 Expired Session Error

**Test:**

1. Set conversation session to expired
2. Try to send regular text message

**Expected:**
- ✅ API returns error: "Session expired. Use a template to start a new conversation."
- ✅ Frontend displays template picker/warning
- ✅ Regular send button disabled

### 5.5 Failed Message Send

**Test:**

1. Disconnect WhatsApp or use invalid phone number
2. Try to send message

**Expected:**
- ✅ Error displayed in UI
- ✅ Message marked as "failed" in database
- ✅ Retry option available (if queue implemented)

---

## Automated Test Suite (Example)

Create `backend/tests/whatsapp.integration.test.js`:

```javascript
describe('WhatsApp Integration', () => {
  describe('Webhook Routing', () => {
    it('should route message to correct tenant', async () => {
      // Mock webhook payload
      const payload = {
        entry: [{
          changes: [{
            value: {
              metadata: { phone_number_id: 'TEST_PHONE_ID' },
              messages: [{
                from: '+1234567890',
                id: 'msg_123',
                text: { body: 'Test message' },
                timestamp: Date.now(),
                type: 'text'
              }]
            }
          }]
        }]
      };
      
      // Send to webhook
      const response = await request(app)
        .post('/api/v1/whatsapp/webhook')
        .send(payload);
      
      expect(response.status).toBe(200);
      
      // Verify message saved
      const message = await prisma.message.findFirst({
        where: { providerMessageId: 'msg_123' }
      });
      
      expect(message).toBeDefined();
      expect(message.body).toBe('Test message');
    });
  });
  
  describe('Token Encryption', () => {
    it('should encrypt and decrypt tokens', () => {
      const plaintext = 'TEST_TOKEN_12345';
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);
      
      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });
  });
});
```

---

## Test Completion Checklist

Use this to track your testing progress:

### Setup Tests
- [ ] Environment variables configured
- [ ] Database migrated successfully
- [ ] Webhook verification endpoint works
- [ ] Manual token setup works

### Messaging Tests
- [ ] Inbound message routes correctly
- [ ] Outbound message sends successfully
- [ ] Delivery statuses update (sent/delivered/read)
- [ ] Media messages work (image/document)
- [ ] Template messages send correctly

### UI Tests
- [ ] Integrations hub displays status
- [ ] Connection flow completes
- [ ] Messages inbox loads conversations
- [ ] Message thread displays correctly
- [ ] Composer sends messages
- [ ] Empty states show appropriately

### Security Tests
- [ ] Tokens encrypted in database
- [ ] Webhook signature verification works
- [ ] Tenant isolation enforced
- [ ] Invalid tokens rejected

### Multi-Tenant Tests
- [ ] Multiple stores can connect
- [ ] Messages route to correct store
- [ ] No cross-tenant data leak

### Error Handling Tests
- [ ] Expired session blocks regular sends
- [ ] Failed sends show errors
- [ ] Invalid credentials rejected
- [ ] Webhook downtime gracefully handled

---

## Common Issues & Fixes

### Issue: Webhook not receiving messages

**Cause:** Meta can't reach webhook URL

**Fix:**
- Ensure webhook URL is HTTPS in production
- Check firewall/security group settings
- Verify webhook subscribed in Meta dashboard
- Check `FB_APP_SECRET` matches

### Issue: Messages not appearing in inbox

**Cause:** Polling not working or phone_number_id mismatch

**Fix:**
- Check browser console for API errors
- Verify `phone_number_id` in database matches Meta
- Check backend logs for webhook processing errors

### Issue: Can't send messages

**Cause:** Session expired or invalid token

**Fix:**
- Check session status in conversation record
- Use template for expired sessions
- Verify access token not expired
- Check Meta API error response

---

## Performance Testing

### Load Test: Concurrent Webhooks

```bash
# Using Apache Bench
ab -n 1000 -c 50 -p webhook-payload.json \
  -T "application/json" \
  http://localhost:8000/api/v1/whatsapp/webhook
```

**Expected:**
- All webhooks processed successfully
- Response time < 200ms
- No database deadlocks

### Stress Test: High Message Volume

**Scenario:** Send 100 messages rapidly

**Monitor:**
- Database connection pool
- Memory usage
- Rate limit responses from Meta API

---

## Sign-Off Criteria

Before considering WhatsApp integration complete:

✅ All Phase 1-5 tests pass  
✅ Multi-tenant isolation verified  
✅ Security tests pass  
✅ Documentation reviewed by team  
✅ Owner trained on connection flow  
✅ Staff trained on messaging interface  
✅ Monitoring/alerting configured  
✅ Rollback plan documented  

---

**Test Completion Date:** _____________  
**Tested By:** _____________  
**Sign-Off:** _____________
