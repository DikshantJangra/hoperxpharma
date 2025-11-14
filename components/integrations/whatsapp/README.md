# WhatsApp Integration Module

## Overview
Enterprise-grade WhatsApp Business integration for HopeRxPharma, enabling pharmacies to communicate with patients through automated messages, 2-way conversations, and compliance-focused workflows.

## Features Implemented

### ✅ Phase 1 (MVP) - Completed
- **Channel Management**: Connect and manage multiple WhatsApp channels
- **Provider Support**: Meta (WABA), Twilio, 360dialog
- **Quick Composer**: Send one-off messages with template support
- **Templates Library**: Create, manage, and track message templates
- **Automation Flows**: Configure trigger-based automated sequences
- **2-Way Inbox**: Real-time conversations with patients
- **Message Logs**: Delivery tracking and audit trail
- **Overview Dashboard**: KPIs, health metrics, and cost tracking

### 🚧 Phase 2 (In Progress)
- Template approval workflow with provider integration
- Advanced consent management UI
- Media library and attachment handling
- Batch operations (recalls, bulk notifications)
- Campaign scheduler

### 📋 Phase 3 (Planned)
- Visual flow builder (drag-and-drop)
- AI-powered template suggestions
- Advanced analytics and reporting
- Cost optimization recommendations
- Multi-language support

## Component Structure

```
components/integrations/whatsapp/
├── ChannelSelector.tsx          # Left sidebar - channel management
├── OverviewDashboard.tsx        # KPI cards and metrics
├── QuickComposer.tsx            # Fast message sending
├── TemplatesLibrary.tsx         # Template CRUD and approval
├── AutomationFlows.tsx          # Trigger-based automation
├── Inbox.tsx                    # 2-way conversations + logs
├── ConnectChannelModal.tsx      # Multi-step channel setup
└── README.md                    # This file
```

## Usage

### Connecting a Channel
1. Click "Add Channel" in the left sidebar
2. Choose provider (Meta/Twilio/360dialog)
3. Enter API credentials
4. Verify phone number (QR code or OTP)
5. Configure webhooks
6. Complete setup

### Sending Messages
**Quick Send:**
- Search for patient
- Select template or type free text
- Attach media (optional)
- Send or schedule

**Automated:**
- Create flow with trigger
- Add conditions and actions
- Activate flow
- Monitor performance

### Managing Templates
1. Navigate to Templates tab
2. Click "Create Template"
3. Fill in details (name, category, body, variables)
4. Submit for approval
5. Track status (pending/approved/rejected)

### Inbox Management
- View all conversations in real-time
- Respond to patient messages
- Track delivery status (sent/delivered/read)
- Switch to Message Logs for audit trail

## Compliance Features

### Consent Management
- ✅ Opted-in badge display
- ⚠️ Warning for no consent
- Consent scope tracking (transactional/marketing)
- Opt-out handling

### Audit Trail
- All messages logged with timestamp
- Delivery status tracking
- Cost per message
- Provider message IDs
- Related object linking (prescription/invoice)

### Privacy Controls
- HIPAA mode toggle
- Confidential message marking
- PHI redaction options
- Data retention policies

## API Integration Points

### Required Endpoints
```typescript
POST   /api/integrations/whatsapp/connect
GET    /api/integrations/whatsapp/channels
POST   /api/integrations/whatsapp/templates
GET    /api/integrations/whatsapp/templates
POST   /api/integrations/whatsapp/messages
GET    /api/integrations/whatsapp/conversations
GET    /api/integrations/whatsapp/conversations/{id}
POST   /api/integrations/whatsapp/flows
GET    /api/integrations/whatsapp/logs
POST   /api/integrations/whatsapp/campaigns
POST   /api/integrations/whatsapp/recall
```

### Webhook Handler
```typescript
POST   /api/webhooks/whatsapp
// Receives: message status, inbound messages, template approvals
// Must be: authenticated (HMAC), idempotent
```

## Template Examples

### Pickup Ready
```
Hi {{name}}, your prescription {{order_no}} is ready for pickup at {{store_name}}. 
Pickup by {{pickup_by}}. Reply 1 to confirm. — HopeRxPharma
```

### Invoice
```
Hi {{name}}, your invoice {{invoice_no}} for ₹{{amount}} is ready. 
View: {{invoice_url}}. Thank you.
```

### Refill Reminder
```
Hi {{name}}, it's time to refill {{medicine_name}}. 
Reply REFILL to place an order or visit {{store_link}}.
```

### Batch Recall
```
URGENT: Batch {{batch_no}} of {{medicine_name}} has been recalled. 
Please return to {{store_name}} for replacement.
```

## Automation Triggers

Available triggers for flows:
- Prescription finalized
- Sale completed
- Refill due (7/14/30 days)
- Batch recall initiated
- Low stock alert
- Customer birthday
- Appointment reminder
- Payment received
- Order shipped

## Cost Tracking

### Message Types & Costs
- **Template (Business-initiated)**: ₹0.50/msg
- **Session (Reply within 24h)**: ₹0.25/msg
- **Media messages**: +₹0.10/msg

### Budget Controls
- Daily/monthly spend caps
- Cost alerts
- Per-channel budgets
- Forecast vs actual tracking

## Security & Permissions

### Role-Based Access
- **Admin**: Full access, connect/disconnect channels
- **Manager**: Approve templates, view logs, run campaigns
- **Agent**: Send messages, manage inbox
- **Audit**: View-only access to logs

### Security Features
- API key encryption
- Webhook HMAC validation
- IP whitelisting
- 2FA for critical actions
- Audit logging

## Performance Metrics

### KPIs Tracked
- Messages sent/delivered/failed
- Delivery rate (%)
- Response time (avg)
- Consent rate (%)
- Cost per message
- Template approval rate
- Flow success rate

## Troubleshooting

### Common Issues

**Channel not connecting:**
- Verify API credentials
- Check webhook URL is accessible
- Ensure phone number is verified

**Template rejected:**
- Review WhatsApp template policies
- Check variable count and format
- Avoid promotional content in transactional templates

**Messages failing:**
- Verify recipient has opted-in
- Check phone number format
- Review provider rate limits
- Ensure sufficient balance

**Webhook not receiving:**
- Verify webhook URL is public
- Check HMAC signature validation
- Review firewall/security rules

## Future Enhancements

### Planned Features
- [ ] Visual flow builder (drag-and-drop)
- [ ] Rich media templates (carousel, buttons)
- [ ] AI-powered response suggestions
- [ ] Sentiment analysis
- [ ] Multi-language templates
- [ ] A/B testing for templates
- [ ] Advanced segmentation
- [ ] Integration with CRM
- [ ] Voice message support
- [ ] WhatsApp catalog integration

### Integration Opportunities
- Link with prescription system for auto-notifications
- Connect to POS for invoice sending
- Integrate with inventory for recall alerts
- Sync with patient records for refill reminders
- Connect to loyalty program for rewards

## Support & Documentation

### Resources
- WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp
- Twilio WhatsApp Docs: https://www.twilio.com/docs/whatsapp
- 360dialog Docs: https://docs.360dialog.com/

### Internal Support
- Email: support@hoperxpharma.com
- Docs: /help/docs
- Chat: /help/chat

## License & Compliance

This module is designed to comply with:
- **India**: DPDPA 2023
- **US**: HIPAA
- **EU**: GDPR
- **WhatsApp**: Business Policy & Commerce Policy

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained by**: HopeRxPharma Team
