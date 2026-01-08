#!/usr/bin/env node

/**
 * Webhook Test Script
 * Tests webhook with valid Razorpay signature
 * 
 * Usage: node test-webhook.js <WEBHOOK_SECRET> <RAZORPAY_ORDER_ID>
 */

const crypto = require('crypto');
const https = require('https');

// Get webhook secret from command line
const WEBHOOK_SECRET = process.argv[2] || 'your_webhook_secret_here';
const ORDER_ID = process.argv[3] || 'order_S1Rx3bkEGRTTEA';

if (WEBHOOK_SECRET === 'your_webhook_secret_here') {
  console.log('❌ Please provide webhook secret');
  console.log('Usage: node test-webhook.js <WEBHOOK_SECRET> <RAZORPAY_ORDER_ID>');
  process.exit(1);
}

// Webhook payload
const payload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_test_' + Date.now(),
        order_id: ORDER_ID,
        amount: 100,
        currency: 'INR',
        method: 'upi',
        status: 'captured',
        captured: true,
        email: 'hoperxpharma@gmail.com',
        contact: '+919876543210',
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  }
};

const payloadString = JSON.stringify(payload);

// Generate signature (same as Razorpay)
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payloadString)
  .digest('hex');

console.log('🧪 Testing Webhook\n');
console.log('Order ID:', ORDER_ID);
console.log('Signature:', signature.substring(0, 20) + '...');
console.log('');

// Send webhook
const options = {
  hostname: 'hoperxpharma.onrender.com',
  port: 443,
  path: '/api/v1/payments/webhooks/razorpay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-razorpay-signature': signature,
    'Content-Length': Buffer.byteLength(payloadString)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data);
    console.log('');
    
    if (res.statusCode === 200) {
      console.log('✅ Webhook processed successfully!');
      console.log('Check your database - payment should be SUCCESS and subscription ACTIVE');
    } else {
      console.log('❌ Webhook failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(payloadString);
req.end();
