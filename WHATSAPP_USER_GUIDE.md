# WhatsApp Business Integration - User Guide

## For Store Owners: Getting Started

### What is WhatsApp Business Integration?

This feature allows your pharmacy to send and receive WhatsApp messages directly from HopeRxPharma. Your staff can:
- View all customer conversations in one inbox
- Reply to messages from the app
- Send prescription reminders
- Notify patients about readyrefills
- Provide delivery updates

---

## Step 1: Prerequisites

Before connecting WhatsApp, verify:

✅ You have a **Facebook Business Manager** account  
✅ You have a **WhatsApp Business Account** (WABA)  
✅ You have a phone number NOT currently used with personal WhatsApp  
✅ You are the **store owner** (admin role required)  

> **⚠️ Important:** If your phone number is already used with a personal WhatsApp account, you must remove that account first. Each number can only be connected to one WhatsApp account.

---

## Step 2: Connect WhatsApp

### Option A: Quick Connect (Recommended)

1. **Navigate to Integrations**
   - From the main menu, click **Integrations**
   - Find the WhatsApp card
   - Click **"Connect WhatsApp"**

2. **Facebook Login**
   - A popup will open asking you to log in with Facebook
   - Use the Facebook account connected to your Business Manager
   - Click **Continue**

3. **Choose Your Business**
   - Select your WhatsApp Business Account from the list
   - Select the phone number to use
   - Click **Next**

4. **Verify Phone Number**
   - You'll receive a 6-digit code via SMS or voice call
   - Enter the code in the verification modal
   - Click **Verify**

5. **Done!**
   - Status will change to **"Connected"**
   - Your staff can now access Messages → WhatsApp

### Option B: Manual Setup (Advanced Users)

If you prefer to manage tokens yourself:

1. **Generate System User Token**
   - Go to [Facebook Business Manager](https://business.facebook.com)
   - Navigate to Business Settings → System Users
   - Create a new system user or select existing
   - Assign permissions:
     - `manage_pages`
     - `whatsapp_business_management`
     - `whatsapp_business_messaging`
   - Generate a permanent token and copy it

2. **Enter Token in HopeRx**
   - Navigate to Integrations → WhatsApp
   - Click **"Manual Setup"**
   - Paste your system user token
   - Click **"Connect Token"**

3. **Verify**
   - Follow phone verification steps if needed
   - Status should show **"Connected"**

---

## Step 3: Verify Connection

After connecting, check:

✅ **Status:** Should show "Connected" with green checkmark  
✅ **Phone Number:** Your business number is displayed  
✅ **Business Name:** Your business name appears  
✅ **Verification:** Business verification status shows  

### If Status Shows "Needs Verification"

1. Complete phone verification (see Step 2)
2. Wait for business verification (1-3 days)
3. Complete any pending actions in Meta Business Manager

---

## Managing Templates

### What are Templates?

Templates are pre-approved messages you can send to customers **after 24 hours** of no conversation. Meta requires all business-initiated messages to use approved templates.

### Creating a Template

#### Method 1: Via Meta Business Manager (Recommended)

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to WhatsApp Manager → Message Templates
3. Click **Create Template**
4. Fill in:
   - **Name:** e.g., `prescription_ready_reminder`
   - **Category:** Choose UTILITY (for notifications) or MARKETING
   - **Language:** English (or your language)
   - **Body:** Your message with variables like {{1}}, {{2}}
     ```
     Hello {{1}},

     Your prescription is ready for pickup at {{2}}.
     
     Please bring your ID and insurance card.
     
     Thank you!
     ```
5. Submit for approval
6. **Wait 1-24 hours** for Meta approval

#### Method 2: In HopeRx (Coming Soon)

Future versions will allow template creation directly in the app.

### Syncing Templates

After Meta approves your templates:

1. Navigate to Integrations → WhatsApp
2. Scroll to **Message Templates** section
3. Click **"Sync from Meta"**
4. ✅ Approved templates will appear in the list

---

## For Staff: Using the Messages Inbox

### Accessing WhatsApp Messages

1. From the main menu, click **Messages**
2. Click **WhatsApp** tab
3. You'll see all customer conversations

### Reading Messages

**Conversation List (Left Sidebar):**
- Shows all customers who've messaged
- Unread messages have a badge
- Search bar to find specific conversations
- Click a conversation to open it

**Message Thread (Center):**
- All messages with the customer
- Your replies in green (right side)
- Customer messages in white (left side)
- Delivery status: ✓ sent, ✓✓ delivered, blue ✓✓ read

### Sending Replies

**Within 24 Hours:**
1. Click in the message box at the bottom
2. Type your reply
3. Click **Send** or press Enter
4. ✅ Message sent immediately

**After 24 Hours (Session Expired):**
1. You'll see a warning: "Session expired"
2. Regular text input is disabled
3. You must use a **template**:
   - Click template picker
   - Select approved template
   - Fill in variables (e.g., patient name, pickup time)
   - Click **Send Template**
4. ✅ This restarts the 24-hour window

### Best Practices

✅ **Respond Quickly:** Try to reply within 24 hours to avoid needing templates  
✅ **Be Professional:** Remember, this is official pharmacy communication  
✅ **Protect Privacy:** Don't share sensitive medical info via WhatsApp  
✅ **Use Templates for Reminders:** Prescription ready, refill reminders, etc.  
✅ **Track in HopeRx:** Patient info automatically linked if phone matches records  

---

## Troubleshooting

### "WhatsApp Not Connected" Message

**For Admins:**
- Go to Integrations → WhatsApp
- Click "Connect WhatsApp"
- Complete setup steps above

**For Staff:**
- Ask your store owner/admin to connect WhatsApp
- You cannot connect it yourself (permission required)

### "Session Expired - Use Template"

**Cause:** Customer last messaged >24 hours ago

**Solution:**
- Use approved template to restart conversation
- After template is sent, you can send regular messages again

### Messages Not Sending

**Check:**
1. Internet connection
2. WhatsApp status (should be "Connected")
3. Phone number is correct
4. Template is approved (if using template)

**If Still Not Working:**
- Contact your store admin
- Check Integrations → WhatsApp for error messages

### Phone Verification Failed

**Possible Causes:**
- Number already used with personal WhatsApp
- Wrong OTP code entered
- Number not registered in Meta

**Solutions:**
1. Ensure number is only used for business WhatsApp
2. Request new OTP code
3. Check Meta Business Manager for number status

### Template Rejected by Meta

**Common Reasons:**
- Promotional/marketing language in UTILITY category
- Missing required info
- Unclear call-to-action
- Policy violations

**Solution:**
1. Review Meta's template guidelines
2. Revise template in Meta Business Manager
3. Resubmit for approval
4. Sync templates in HopeRx after approval

---

## Understanding the 24-Hour Rule

### What is it?

Meta enforces a "24-hour customer service window":
- ✅ Within 24 hours: You can send any message
- ❌ After 24 hours: You must use an approved template

### Why?

To prevent spam and ensure businesses don't message customers unexpectedly.

### Practical Implications

**Scenario 1: Customer messages you**
- 24-hour window starts
- You can freely reply for 24 hours
- After 24 hours, you need template

**Scenario 2: You want to send reminder**
- Use template (e.g., "Prescription Ready")
- Template starts new 24-hour window
- Customer can reply, and you can respond freely

---

## Privacy & Compliance

### Patient Consent

Before messaging patients:
- ✅ Obtain explicit consent to receive WhatsApp messages
- ✅ Inform them of message types (reminders, delivery updates)
- ✅ Provide opt-out instructions

### What NOT to Send

❌ Sensitive medical information (diagnoses, test results)  
❌ Prescription details (drug names, dosages)  
❌ Payment/billing information  
❌ Unsolicited marketing messages  

### What's OK to Send

✅ "Your prescription is ready for pickup"  
✅ "Your order is out for delivery"  
✅ "We received your refill request"  
✅ "Store hours update: We're closed Monday"  

### Data Retention

- Messages are stored securely in HopeRx database
- Encryption in transit and at rest
- Accessible only to your store staff
- Can be deleted upon request (right to be forgotten)

---

## FAQs

### Can multiple staff members reply to same conversation?

Yes! All staff can see all conversations. However, only one person should reply to avoid confusion.

**Best Practice:** Assign conversations to specific staff members.

### What if customer messages us on personal WhatsApp?

They should message your **business number** (the one connected in HopeRx). Personal numbers won't appear in the inbox.

### Can we send images/documents?

Yes (future feature):
- Images: Product photos, receipts
- Documents: Prescription scans, invoices
- Max size: 16MB per Meta limits

### Can patients opt-out?

Yes. If a patient requests to stop receiving messages:
1. Mark conversation as "Resolved"
2. Add internal note: "Patient opted out"
3. Do not message them again unless they initiate

### What happens if we disconnect WhatsApp?

- All conversations are archived
- Staff can no longer send/receive messages
- Connection can be restored by reconnecting

### Is this HIPAA compliant?

WhatsApp is **NOT HIPAA compliant**. Do not send:
- Protected Health Information (PHI)
- Medical diagnoses
- Detailed prescription information

Only use for:
- General notifications
- Appointment reminders (without specifics)
- Pickup confirmations

For sensitive info, use phone calls or secure patient portal.

---

## Getting Help

### In-App Support

1. Click **Help** in main menu
2. Search for "WhatsApp"
3. View tutorials and guides

### Contact Support

- **Email:** support@hoperx.com
- **Phone:** [Your support number]
- **Live Chat:** Available in app

### Meta Support

For issues with Meta/Facebook:
- Visit [Meta Business Help Center](https://www.facebook.com/business/help)
- Contact Meta support for:
  - Template approvals
  - Business verification
  - Account restrictions

---

## Quick Reference

### Connection Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 Connected | All good, messages working | None |
| 🟡 Needs Verification | Phone or business verification required | Complete verification |
| 🔴 Error | Connection problem | Reconnect WhatsApp |
| ⚪ Not Connected | WhatsApp not set up | Connect WhatsApp |

### Message Status Icons

| Icon | Meaning |
|------|---------|
| ✓ | Sent to Meta servers |
| ✓✓ | Delivered to customer's phone |
| Blue ✓✓ | Read by customer |
| ❌ | Failed to send |

---

**Last Updated:** 2025-11-28  
**Version:** 1.0  
**Questions?** Contact support or ask your store admin
