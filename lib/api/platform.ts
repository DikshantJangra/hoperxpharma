/**
 * Platform Configuration API Client
 * For secret SMTP setup endpoints
 */

import { apiClient } from './client';

interface EmailConfig {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpFromName: string;
    useTLS: boolean;
    isActive: boolean;
    lastTestedAt: string | null;
    lastTestResult: boolean | null;
    hasPassword: boolean;
}

interface OAuthStatus {
    configured: boolean;
    authMethod: 'OAUTH' | 'SMTP' | null;
    email: string | null;
    isActive: boolean;
    connectedAt: string | null;
    lastTestedAt: string | null;
    lastTestResult: boolean | null;
}

interface EmailConfigInput {
    smtpUser: string;
    smtpPassword: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpFromName?: string;
    useTLS?: boolean;
}

/**
 * Verify setup password
 */
export async function verifySetupPassword(secret: string, password: string): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        const response = await apiClient.post(`/platform/setup/${secret}/verify-password`, { password }, {
            timeout: 10000
        });
        return response.data;
    } catch (error: any) {
        if (error?.data?.remainingAttempts !== undefined) {
            const customError: any = new Error(error.message || 'Invalid password');
            customError.remainingAttempts = error.data.remainingAttempts;
            customError.retryAfter = error.data.retryAfter;
            throw customError;
        }
        throw error;
    }
}

/**
 * Get current email configuration (includes OAuth status)
 */
export async function getEmailConfig(secret: string): Promise<{
    success: boolean;
    data: EmailConfig | null;
    oauth: OAuthStatus;
    configured: boolean;
    active: boolean;
    oauthAvailable: boolean;
}> {
    try {
        const response = await apiClient.get(`/platform/setup/${secret}/email`, { timeout: 10000 });
        return response.data;
    } catch (error: any) {
        if (error.status === 404) {
            throw new Error('Invalid setup URL');
        }
        throw new Error('Failed to get email configuration');
    }
}

/**
 * Save email configuration (SMTP)
 */
export async function saveEmailConfig(secret: string, config: EmailConfigInput): Promise<{
    success: boolean;
    message: string;
    data: EmailConfig;
}> {
    try {
        const response = await apiClient.post(`/platform/setup/${secret}/email`, config);
        return response.data;
    } catch (error: any) {
        if (error.status === 404) {
            throw new Error('Invalid setup URL');
        }
        throw new Error(error.message || 'Failed to save configuration');
    }
}

/**
 * Test email connection (works for both OAuth and SMTP)
 */
export async function testEmailConnection(secret: string): Promise<{
    success: boolean;
    message: string;
    method?: 'oauth' | 'smtp';
}> {
    try {
        const response = await apiClient.post(`/platform/setup/${secret}/email/test`);
        return response.data;
    } catch (error: any) {
        if (error.status === 404) {
            throw new Error('Invalid setup URL');
        }
        throw new Error('Failed to test connection');
    }
}

/**
 * Get Gmail OAuth authorization URL
 */
export async function getGmailAuthUrl(secret: string): Promise<{
    success: boolean;
    authUrl: string;
}> {
    const response = await apiClient.get(`/platform/setup/${secret}/gmail/auth`);
    return response.data;
}

/**
 * Disconnect Gmail OAuth
 */
export async function disconnectGmail(secret: string): Promise<{
    success: boolean;
    message: string;
}> {
    const response = await apiClient.post(`/platform/setup/${secret}/gmail/disconnect`);
    return response.data;
}

/**
 * Check if email is configured (public endpoint for login page)
 */
export async function checkEmailStatus(): Promise<{
    success: boolean;
    configured: boolean;
    method?: 'oauth' | 'smtp' | null;
}> {
    try {
        const response = await apiClient.get('/platform/email-status');
        return response.data;
    } catch {
        return { success: true, configured: false };
    }
}

