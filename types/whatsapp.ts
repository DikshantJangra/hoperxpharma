export interface WhatsAppChannel {
  id: string;
  name: string;
  phone: string;
  provider: 'Meta' | 'Twilio' | '360dialog';
  status: 'connected' | 'disconnected' | 'pending';
  lastMessage: string;
  apiKey?: string;
  webhookUrl?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'transactional' | 'reminder' | 'marketing' | 'otp';
  status: 'approved' | 'pending' | 'rejected';
  body: string;
  language: string;
  variables: string[];
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  submittedAt?: string;
}

export interface WhatsAppMessage {
  id: string;
  channelId: string;
  direction: 'sent' | 'received';
  to: string;
  from: string;
  templateId?: string;
  body: string;
  media?: string[];
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  providerMessageId?: string;
  cost: number;
  relatedObject?: {
    type: 'prescription' | 'invoice' | 'patient' | 'batch';
    id: string;
  };
  timestamp: string;
}

export interface WhatsAppConversation {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  channelId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  assignedTo?: string;
  tags?: string[];
  status: 'open' | 'closed' | 'snoozed';
}

export interface WhatsAppFlow {
  id: string;
  name: string;
  trigger: string;
  nodes: FlowNode[];
  active: boolean;
  lastRun?: string;
  successRate: number;
}

export interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  config: any;
}

export interface WhatsAppConsent {
  id: string;
  patientId: string;
  method: 'webform' | 'phone' | 'in-person' | 'sms';
  source: string;
  scope: 'transactional' | 'marketing' | 'both';
  timestamp: string;
  ipAddress?: string;
  expiresAt?: string;
  revokedAt?: string;
}
