/**
 * API Integration Utility
 * 
 * Provides direct API access for backend testing and verification.
 * Useful for:
 * - Direct data manipulation in tests
 * - API response validation
 * - Bypassing UI for faster test setup
 */

import { request, APIRequestContext } from '@playwright/test';
import { getEnvironment } from '../config/environments';

let apiContext: APIRequestContext | null = null;

/**
 * Initialize API context with authentication
 */
export async function initializeApiContext(accessToken?: string): Promise<APIRequestContext> {
    const env = getEnvironment();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    apiContext = await request.newContext({
        baseURL: env.apiURL,
        extraHTTPHeaders: headers,
    });

    return apiContext;
}

/**
 * Get or create API context
 */
export async function getApiContext(): Promise<APIRequestContext> {
    if (!apiContext) {
        return await initializeApiContext();
    }
    return apiContext;
}

/**
 * Dispose API context
 */
export async function disposeApiContext(): Promise<void> {
    if (apiContext) {
        await apiContext.dispose();
        apiContext = null;
    }
}

/**
 * Make authenticated API request
 */
export async function apiRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options?: {
        data?: any;
        params?: Record<string, string>;
        headers?: Record<string, string>;
        token?: string;
    }
) {
    const context = await getApiContext();

    const requestOptions: any = {
        headers: options?.headers || {},
    };

    if (options?.token) {
        requestOptions.headers['Authorization'] = `Bearer ${options.token}`;
    }

    if (options?.data) {
        requestOptions.data = options.data;
    }

    if (options?.params) {
        const params = new URLSearchParams(options.params);
        endpoint = `${endpoint}?${params.toString()}`;
    }

    const response = await context[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch'](
        endpoint,
        requestOptions
    );

    return {
        status: response.status(),
        ok: response.ok(),
        headers: response.headers(),
        body: await response.json().catch(() => response.text()),
    };
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
    return apiRequest('GET', '/health');
}

/**
 * API helper functions for common operations
 */
export const api = {
    /**
     * Authentication endpoints
     */
    auth: {
        login: async (email: string, password: string) => {
            return apiRequest('POST', '/auth/login', {
                data: { email, password },
            });
        },

        logout: async (token: string) => {
            return apiRequest('POST', '/auth/logout', { token });
        },
    },

    /**
     * Store endpoints
     */
    stores: {
        get: async (storeId: string, token: string) => {
            return apiRequest('GET', `/stores/${storeId}`, { token });
        },

        list: async (token: string) => {
            return apiRequest('GET', '/stores', { token });
        },
    },

    /**
     * Inventory endpoints
     */
    inventory: {
        getBatch: async (batchId: string, token: string) => {
            return apiRequest('GET', `/inventory/batches/${batchId}`, { token });
        },

        listBatches: async (storeId: string, token: string) => {
            return apiRequest('GET', `/inventory/batches`, {
                params: { storeId },
                token,
            });
        },
    },

    /**
     * Sales endpoints
     */
    sales: {
        get: async (saleId: string, token: string) => {
            return apiRequest('GET', `/sales/${saleId}`, { token });
        },

        list: async (storeId: string, token: string) => {
            return apiRequest('GET', '/sales', {
                params: { storeId },
                token,
            });
        },
    },

    /**
     * Alerts endpoints
     */
    alerts: {
        list: async (storeId: string, token: string) => {
            return apiRequest('GET', '/alerts', {
                params: { storeId },
                token,
            });
        },

        markAsRead: async (alertId: string, token: string) => {
            return apiRequest('PATCH', `/alerts/${alertId}/read`, { token });
        },
    },
};

/**
 * Response validators
 */
export const validators = {
    /**
     * Validate response status
     */
    expectStatus(response: any, expectedStatus: number) {
        if (response.status !== expectedStatus) {
            throw new Error(
                `Expected status ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(response.body)}`
            );
        }
        return response;
    },

    /**
     * Validate response is OK (2xx)
     */
    expectOk(response: any) {
        if (!response.ok) {
            throw new Error(
                `Expected OK response, got ${response.status}. Body: ${JSON.stringify(response.body)}`
            );
        }
        return response;
    },

    /**
     * Validate response has specific fields
     */
    expectFields(response: any, fields: string[]) {
        const body = response.body;
        const missing = fields.filter(field => !(field in body));

        if (missing.length > 0) {
            throw new Error(`Missing required fields in response: ${missing.join(', ')}`);
        }

        return response;
    },
};
