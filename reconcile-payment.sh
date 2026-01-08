#!/bin/bash

# Manual Payment Reconciliation Script
# Usage: ./reconcile-payment.sh <PAYMENT_ID>

PAYMENT_ID="${1:-cmk5ntmvm000peg2bive8y7ie}"
API_URL="https://hoperxpharma.onrender.com"

echo "🔄 Reconciling payment: $PAYMENT_ID"
echo ""

# Call reconciliation via backend script
cd backend && node -e "
const { PrismaClient } = require('@prisma/client');
const { reconcilePayment } = require('./src/services/paymentService');
const prisma = new PrismaClient();

async function reconcile() {
  try {
    console.log('Fetching payment from Razorpay...');
    const result = await reconcilePayment('$PAYMENT_ID');
    
    console.log('');
    console.log('✅ Reconciliation Complete!');
    console.log('- Resolved:', result.resolved);
    console.log('- New Status:', result.newStatus || result.razorpayStatus);
    console.log('');
    console.log('Refresh your page to see updated status!');
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

reconcile();
"
