#!/bin/bash

# Webhook Test Script
# Tests the webhook endpoint with a valid signature

WEBHOOK_URL="https://hoperxpharma.onrender.com/api/v1/payments/webhooks/razorpay"
WEBHOOK_SECRET="${RAZORPAY_WEBHOOK_SECRET:-your_webhook_secret_here}"

# Sample webhook payload
PAYLOAD='{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test123456",
        "order_id": "order_S1Rx3bkEGRTTEA",
        "amount": 100,
        "currency": "INR",
        "method": "upi",
        "status": "captured",
        "captured": true,
        "email": "hoperxpharma@gmail.com",
        "contact": "+919876543210"
      }
    }
  }
}'

# Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')

echo "🧪 Testing Webhook Endpoint"
echo ""
echo "URL: $WEBHOOK_URL"
echo "Signature: $SIGNATURE"
echo ""
echo "Sending webhook..."
echo ""

# Send webhook
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: $SIGNATURE" \
  -d "$PAYLOAD" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ Test complete!"
