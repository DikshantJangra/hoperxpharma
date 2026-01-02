/**
 * WhatsApp API Client
 * Type-safe API methods for WhatsApp Business integration
 */

import { getApiBaseUrl } from '@/lib/config/env';

const API_BASE = getApiBaseUrl();

// Types
export interface WhatsAppConnection {
    connected: boolean;
    status: 'DISCONNECTED' | 'TEMP_STORED' | 'ACTIVE' | 'NO_PHONE' | 'NEEDS_VERIFICATION' | 'ERROR';
    phoneNumber?: string;
    phoneNumberId?: string;
    businessVerified?: boolean;
    businessName?: string;
    lastWebhookAt?: string;
}

export interface Conversation {
    id: string;
    storeId: string;
    phoneNumber: string;
    displayName?: string;
    profilePicUrl?: string;
    status: 'open' | 'pending' | 'resolved' | 'archived';
    assignedAgentId?: string;
    lastMessageAt?: string;
    lastMessageBody?: string;
    lastCustomerMessageAt?: string;
    unreadCount: number;
    sessionActive: boolean;
    messages?: Message[];
}

export interface Message {
    id: string;
    conversationId: string;
    direction: 'inbound' | 'outbound';
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template';
    body?: string;
    caption?: string;
    mediaUrl?: string;
    mediaType?: string;
    from?: string;
    to?: string;
    status?: 'sent' | 'delivered' | 'read' | 'failed';
    statusReason?: string;
    templateName?: string;
    createdAt: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
}

export interface WhatsAppTemplate {
    id: string;
    storeId: string;
    name: string;
    language: string;
    category: string;
    body: string;
    headerType?: string;
    headerText?: string;
    footer?: string;
    components: any[]; // Meta API component structure
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectedReason?: string;
    usageCount: number;
    createdAt: string;
}

export interface SendMessageRequest {
    conversationId: string;
    patientId?: string; // Added for consent checking
    body: string;
    type?: 'text';
}

export interface SendTemplateRequest {
    conversationId: string;
    patientId?: string; // Added for consent checking
    templateName: string;
    language?: string;
    templateLanguage?: string;
    components?: any[];
    parameters?: string[];
}

export interface CreateTemplateRequest {
    storeId: string;
    name: string;
    language?: string;
    category?: string;
    body: string;
    headerType?: string;
    headerText?: string;
    footer?: string;
    buttons?: any[];
}

// API Client
class WhatsAppAPI {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE}/whatsapp${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Connection Management
    async connect(storeId: string, tempToken: string): Promise<{ success: boolean }> {
        return this.request('/connect', {
            method: 'POST',
            body: JSON.stringify({ storeId, tempToken }),
        });
    }

    async finalize(storeId: string): Promise<any> {
        return this.request('/finalize', {
            method: 'POST',
            body: JSON.stringify({ storeId }),
        });
    }

    async manualSetup(storeId: string, systemToken: string): Promise<{ success: boolean }> {
        return this.request('/manual-token', {
            method: 'POST',
            body: JSON.stringify({ storeId, systemToken }),
        });
    }

    async getStatus(storeId: string): Promise<WhatsAppConnection> {
        return this.request(`/status/${storeId}`);
    }

    async verifyPhone(storeId: string, code: string): Promise<{ success: boolean }> {
        return this.request('/verify-phone', {
            method: 'POST',
            body: JSON.stringify({ storeId, code }),
        });
    }

    async disconnect(storeId: string): Promise<{ success: boolean }> {
        return this.request(`/disconnect/${storeId}`, {
            method: 'DELETE',
        });
    }

    // Conversations & Messaging
    async getConversations(
        storeId: string,
        filters?: { status?: string; search?: string; skip?: number; take?: number }
    ): Promise<{ conversations: Conversation[] }> {
        const params = new URLSearchParams();
        if (filters?.status) params.set('status', filters.status);
        if (filters?.search) params.set('search', filters.search);
        if (filters?.skip !== undefined) params.set('skip', filters.skip.toString());
        if (filters?.take !== undefined) params.set('take', filters.take.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/conversations/${storeId}${query}`);
    }

    async getMessages(
        conversationId: string,
        pagination?: { skip?: number; take?: number }
    ): Promise<{ messages: Message[] }> {
        const params = new URLSearchParams();
        if (pagination?.skip !== undefined) params.set('skip', pagination.skip.toString());
        if (pagination?.take !== undefined) params.set('take', pagination.take.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/messages/${conversationId}${query}`);
    }

    async sendMessage(data: SendMessageRequest): Promise<{ success: boolean; message: Message }> {
        // Check consent before sending if patientId is provided
        if (data.patientId) {
            const { enforceConsent } = await import('../utils/consent');
            await enforceConsent(data.patientId, 'WhatsApp', 'sending messages');
        }

        return this.request('/send', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async sendTestMessage(storeId: string, phoneNumber: string) {
        const response = await fetch(`/api/v1/whatsapp/test-message/${storeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send test message');
        }
        return response.json();
    }

    async sendTemplate(data: SendTemplateRequest): Promise<{ success: boolean; message: Message }> {
        // Check consent before sending if patientId is provided
        if (data.patientId) {
            const { enforceConsent } = await import('../utils/consent');
            await enforceConsent(data.patientId, 'WhatsApp', 'sending template messages');
        }

        return this.request('/send-template', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateConversationStatus(
        conversationId: string,
        status: string
    ): Promise<{ success: boolean }> {
        return this.request(`/conversations/${conversationId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async assignConversation(
        conversationId: string,
        agentId: string
    ): Promise<{ success: boolean }> {
        return this.request(`/conversations/${conversationId}/assign`, {
            method: 'PATCH',
            body: JSON.stringify({ agentId }),
        });
    }

    // Templates
    async getTemplates(
        storeId: string,
        status?: string
    ): Promise<WhatsAppTemplate[]> {
        const query = status ? `?status=${status}` : '';
        const data = await this.request<{ templates: WhatsAppTemplate[] }>(`/templates/${storeId}${query}`);
        return data.templates || [];
    }

    async createTemplate(data: CreateTemplateRequest): Promise<{ success: boolean; template: WhatsAppTemplate }> {
        return this.request('/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async syncTemplates(storeId: string): Promise<{ success: boolean; synced: number }> {
        return this.request(`/templates/${storeId}/sync`, {
            method: 'POST',
        });
    }

    async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
        return this.request(`/templates/${templateId}`, {
            method: 'DELETE',
        });
    }
}

export const whatsappApi = new WhatsAppAPI();
