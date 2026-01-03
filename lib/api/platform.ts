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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/platform/setup/${secret}/verify-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            const error: any = new Error(data.message || 'Invalid password');
            error.remainingAttempts = data.remainingAttempts;
            error.retryAfter = data.retryAfter;
            throw error;
        }

        return data;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check if the backend is running.');
        }
        throw error;
    }
}

/**
 * Get current email configuration
 */
export async function getEmailConfig(secret: string): Promise<{
    success: boolean;
    data: EmailConfig | null;
    configured: boolean;
    active: boolean;
}> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/platform/setup/${secret}/email`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Invalid setup URL');
            }
            throw new Error('Failed to get email configuration');
        }

        return response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check if the backend is running.');
        }
        throw error;
    }
}

/**
 * Save email configuration
 */
export async function saveEmailConfig(secret: string, config: EmailConfigInput): Promise<{
    success: boolean;
    message: string;
    data: EmailConfig;
}> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/platform/setup/${secret}/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Invalid setup URL');
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to save configuration');
    }

    return response.json();
}

/**
 * Test email connection
 */
export async function testEmailConnection(secret: string): Promise<{
    success: boolean;
    message: string;
}> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/platform/setup/${secret}/email/test`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Invalid setup URL');
        }
        throw new Error('Failed to test connection');
    }

    return response.json();
}

/**
 * Check if email is configured (public endpoint for login page)
 */
export async function checkEmailStatus(): Promise<{
    success: boolean;
    configured: boolean;
}> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/platform/email-status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return { success: true, configured: false };
        }

        return response.json();
    } catch {
        return { success: true, configured: false };
    }
}
