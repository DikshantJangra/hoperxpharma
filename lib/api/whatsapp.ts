/**
 * WhatsApp API Client
 * Type-safe API methods for WhatsApp Business integration
 */

import { getApiBaseUrl } from '@/lib/config/env';
import { apiClient } from './client';

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
    // Connection Management
    async connect(storeId: string, tempToken: string): Promise<{ success: boolean }> {
        const response = await apiClient.post('/whatsapp/connect', { storeId, tempToken });
        return response.data;
    }

    async finalize(storeId: string): Promise<any> {
        const response = await apiClient.post('/whatsapp/finalize', { storeId });
        return response.data;
    }

    async manualSetup(storeId: string, systemToken: string): Promise<{ success: boolean }> {
        const response = await apiClient.post('/whatsapp/manual-token', { storeId, systemToken });
        return response.data;
    }

    async getStatus(storeId: string): Promise<WhatsAppConnection> {
        const response = await apiClient.get(`/whatsapp/status/${storeId}`);
        return response.data;
    }

    async verifyPhone(storeId: string, code: string): Promise<{ success: boolean }> {
        const response = await apiClient.post('/whatsapp/verify-phone', { storeId, code });
        return response.data;
    }

    async disconnect(storeId: string): Promise<{ success: boolean }> {
        const response = await apiClient.delete(`/whatsapp/disconnect/${storeId}`);
        return response.data;
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
        const response = await apiClient.get(`/whatsapp/conversations/${storeId}${query}`);
        return response.data;
    }

    async getMessages(
        conversationId: string,
        pagination?: { skip?: number; take?: number }
    ): Promise<{ messages: Message[] }> {
        const params = new URLSearchParams();
        if (pagination?.skip !== undefined) params.set('skip', pagination.skip.toString());
        if (pagination?.take !== undefined) params.set('take', pagination.take.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get(`/whatsapp/messages/${conversationId}${query}`);
        return response.data;
    }

    async sendMessage(data: SendMessageRequest): Promise<{ success: boolean; message: Message }> {
        // Check consent before sending if patientId is provided
        if (data.patientId) {
            const { enforceConsent } = await import('../utils/consent');
            await enforceConsent(data.patientId, 'WhatsApp', 'sending messages');
        }

        const response = await apiClient.post('/whatsapp/send', data);
        return response.data;
    }

    async sendTestMessage(storeId: string, phoneNumber: string) {
        const response = await apiClient.post(`/whatsapp/test-message/${storeId}`, { phoneNumber });
        return response.data;
    }

    async sendTemplate(data: SendTemplateRequest): Promise<{ success: boolean; message: Message }> {
        // Check consent before sending if patientId is provided
        if (data.patientId) {
            const { enforceConsent } = await import('../utils/consent');
            await enforceConsent(data.patientId, 'WhatsApp', 'sending template messages');
        }

        const response = await apiClient.post('/whatsapp/send-template', data);
        return response.data;
    }

    async updateConversationStatus(
        conversationId: string,
        status: string
    ): Promise<{ success: boolean }> {
        const response = await apiClient.patch(`/whatsapp/conversations/${conversationId}/status`, { status });
        return response.data;
    }

    async assignConversation(
        conversationId: string,
        agentId: string
    ): Promise<{ success: boolean }> {
        const response = await apiClient.patch(`/whatsapp/conversations/${conversationId}/assign`, { agentId });
        return response.data;
    }

    // Templates
    async getTemplates(
        storeId: string,
        status?: string
    ): Promise<WhatsAppTemplate[]> {
        const query = status ? `?status=${status}` : '';
        const response = await apiClient.get(`/whatsapp/templates/${storeId}${query}`);
        return response.data.templates || [];
    }

    async createTemplate(data: CreateTemplateRequest): Promise<{ success: boolean; template: WhatsAppTemplate }> {
        const response = await apiClient.post('/whatsapp/templates', data);
        return response.data;
    }

    async syncTemplates(storeId: string): Promise<{ success: boolean; synced: number }> {
        const response = await apiClient.post(`/whatsapp/templates/${storeId}/sync`);
        return response.data;
    }

    async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
        const response = await apiClient.delete(`/whatsapp/templates/${templateId}`);
        return response.data;
    }
}

export const whatsappApi = new WhatsAppAPI();
