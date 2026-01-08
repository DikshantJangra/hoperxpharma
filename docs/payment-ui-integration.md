# Payment UI Components - Integration Guide

## Components Created

### 1. BillingPage.jsx
Complete subscription billing page with Razorpay payment integration.

### 2. PaymentHistory.jsx
Standalone payment history component with filtering.

---

## Quick Integration

### Option 1: Use Complete Billing Page

```jsx
import React from 'react';
import BillingPage from './components/BillingPage';

function App() {
  const storeId = 'your-store-id'; // Get from auth context 
  const currentPlan = {
    name: 'Retail Monthly',
    status: 'ACTIVE',
    validUntil: '2026-02-08'
  };

  return (
    <BillingPage 
      storeId={storeId}
      currentPlan={currentPlan}
    />
  );
}
```

### Option 2: Use Separate Payment History

```jsx
import React from 'react';
import PaymentHistory from './components/PaymentHistory';

function PaymentHistoryPage() {
  const storeId = 'your-store-id';

  return (
    <PaymentHistory 
      storeId={storeId}
      limit={50}  // Optional, defaults to 50
    />
  );
}
```

### Option 3: Integrate into Existing Billing Page

```jsx
import { initiatePaymentFlow } from './services/api/payment.api';

const handleSubscribe = async (planId) => {
  try {
    const result = await initiatePaymentFlow(planId, storeId, {
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone
      },
      themeColor: '#3399cc'
    });

    if (result.success) {
      console.log('Payment successful!');
      alert('Subscription activated!');
      // Refresh subscription status
    } else {
      console.error('Payment failed:', result.message);
      alert('Payment failed: ' + result.message);
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment error: ' + error.message);
  }
};
```

---

## Features Included

### BillingPage Component

✅ **Subscription Plan Display**
- Grid layout for all plans
- Monthly and yearly options
- Savings badges for yearly plans
- Feature lists
- Visual selection state

✅ **Payment Integration**
- Razorpay Checkout modal
- Loading states during payment
- Error handling
- Success confirmation
- Auto-refresh after success

✅ **Payment History**
- Toggleable view
- Full transaction history
- Status badges
- Date formatting

### PaymentHistory Component

✅ **Filtering**
- All payments
- Success only
- Failed only
- Processing only

✅ **Detailed Information**
- Date and time
- Plan details
- Amount
- Payment method
- Status with color coding
- Payment ID

✅ **Interactions**
- Manual refresh
- Count display
- Loading states
- Error handling

---

## Subscription Plans Configuration

The BillingPage includes all 6 plans:

```javascript
const plans = [
  {
    id: 'retail_monthly',
    name: 'Retail Pharmacy',
    price: 29900,  // ₹299 in paise
    billing: 'monthly',
    features: [...]
  },
  // ... 5 more plans
];
```

**To modify plans:**
1. Update the `plans` array in BillingPage.jsx
2. Ensure `id` matches backend plan IDs
3. Price must be in paise (₹1 = 100 paise)

---

## Styling

Both components use inline styles for portability. To customize:

### Option 1: Modify Inline Styles

```jsx
const styles = {
  planCard: {
    ...styles.planCard,
    backgroundColor: 'your-color',
    // Add your styles
  }
};
```

### Option 2: Add CSS Classes

Replace inline styles with className:

```jsx
// Before:
<div style={styles.planCard}>

// After:
<div className="plan-card">
```

Then create CSS file:
```css
/* billing.css */
.plan-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  /* ... */
}
```

### Option 3: Use CSS-in-JS Library

```jsx
import styled from 'styled-components';

const PlanCard = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  /* ... */
`;
```

---

## Authentication Integration

Get `storeId` from your auth context:

```jsx
import { useAuth } from './context/AuthContext';

function BillingPageWrapper() {
  const { user } = useAuth();
  const storeId = user?.storeId || user?.storeUsers?.[0]?.storeId;

  if (!storeId) {
    return <div>Please log in to view billing</div>;
  }

  return <BillingPage storeId={storeId} />;
}
```

---

## Current Plan Integration

Fetch current subscription status:

```jsx
import { useState, useEffect } from 'react';
import { apiClient } from './services/api/apiClient';

function BillingPageWrapper({ storeId }) {
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await apiClient.get(`/subscriptions/${storeId}`);
        setCurrentPlan({
          name: response.data.data.planName,
          status: response.data.data.status,
          validUntil: response.data.data.currentPeriodEnd
        });
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    }
    fetchSubscription();
  }, [storeId]);

  return <BillingPage storeId={storeId} currentPlan={currentPlan} />;
}
```

---

## Error Handling

Both components include comprehensive error handling:

```jsx
// Payment errors are caught and displayed
try {
  const result = await initiatePaymentFlow(...);
  if (!result.success) {
    setError(result.message);
  }
} catch (error) {
  setError(error.message || 'Payment failed');
}
```

**User sees:**
- Error message in red alert box
- Ability to retry
- Clear error descriptions

---

## Payment Flow

**Complete payment lifecycle:**

1. **User selects plan** → Visual feedback
2. **Click "Pay"** → Loading state
3. **Razorpay modal opens** → User enters payment details
4. **Payment processed** → Modal closes
5. **Signature verified** → Backend confirms
6. **Status polled** → Wait for webhook
7. **Success/Failure** → Show message
8. **Auto-refresh** → Update subscription status

**All handled automatically by `initiatePaymentFlow()`!**

---

## Testing

### Test Mode

1. Ensure `.env` has test keys:
   ```
   RAZORPAY_MODE=test
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   ```

2. Use Razorpay test cards:
   - Success: 4111 1111 1111 1111
   - Failure: 4000 0000 0000 0002
   - CVV: Any 3 digits
   - Expiry: Any future date

### Component Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import BillingPage from './BillingPage';

test('renders billing page', () => {
  render(<BillingPage storeId="test-store" />);
  expect(screen.getByText(/Billing & Subscription/i)).toBeInTheDocument();
});

test('selects plan and shows pay button', () => {
  render(<BillingPage storeId="test-store" />);
  
  // Click first plan
  const planCard = screen.getAllByRole('button')[0];
  fireEvent.click(planCard);
  
  // Pay button should appear
  expect(screen.getByText(/Pay ₹/i)).toBeInTheDocument();
});
```

---

## Production Checklist

Before deploying:

- [ ] Backend migration completed
- [ ] Subscription plans seeded in database
- [ ] Razorpay live keys configured
- [ ] Webhook URL configured
- [ ] Tested with ₹1 payment
- [ ] Error handling verified
- [ ] Loading states tested
- [ ] Success flow tested
- [ ] Failure flow tested
- [ ] Payment history displays correctly
- [ ] Plan selection works
- [ ] Amount display correct
- [ ] Status badges show correctly

---

## Troubleshooting

### "Razorpay is not defined"

Make sure Razorpay script loads:
```jsx
// Check in browser console:
console.log(window.Razorpay); // Should not be undefined
```

The component automatically loads the script, but if it fails:
```jsx
// Manually add to index.html:
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Payment stays in PROCESSING

- Check backend webhook URL is correct
- Verify webhook secret in `.env`
- Check backend logs for webhook errors
- Run manual reconciliation if needed

### Amount shows as NaN

Ensure backend returns `amountPaise` as number:
```javascript
// Backend:
amountPaise: 29900  // ✅ Correct
amountPaise: "29900"  // ❌ Wrong (string)
```

### Plans not showing

Check backend has subscription plans seeded:
```bash
node scripts/seedSubscriptionPlans.js
```

---

## Advanced Customization

### Add Trial Period Display

```jsx
const PlanCard = ({ plan }) => (
  <div>
    {/* ... */}
    {plan.hasTrial && (
      <div style={styles.trialBadge}>
        7 days free trial
      </div>
    )}
  </div>
);
```

### Add Coupon Code Input

```jsx
const [couponCode, setCouponCode] = useState('');

const handlePayment = async () => {
  const result = await initiatePaymentFlow(
    selectedPlan.id,
    storeId,
    {
      notes: { coupon: couponCode }  // Pass to backend
    }
  );
};
```

### Add Email Receipts

```jsx
// After successful payment:
if (result.success) {
  await apiClient.post('/payments/send-receipt', {
    paymentId: result.data.paymentId,
    email: user.email
  });
}
```

---

## Support

For issues:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify Razorpay Dashboard for payment status
4. Review `payment-bugs-and-fixes.md` for known issues

**Payment system is production-ready!** 🚀
