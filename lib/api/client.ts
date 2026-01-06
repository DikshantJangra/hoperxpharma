/**
 * API Client Configuration
 */
import { isNetworkError, isTimeoutError } from '@/lib/utils/network';
import { getApiBaseUrl } from '@/lib/config/env';
import { RequestError, OfflineError } from './errors';

const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '60000');

export const config = {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
};

/**
 * Token management - Cookie-based (more secure than localStorage)
 * Access tokens are now stored in httpOnly cookies set by the backend
 * This prevents XSS attacks from stealing tokens
 */
let accessToken: string | null = null;

export const tokenManager = {
    getAccessToken: () => {
        if (typeof window === 'undefined') return accessToken;
        if (!accessToken) {
            accessToken = localStorage.getItem('accessToken');
        }
        return accessToken;
    },
    setAccessToken: (token: string | null) => {
        accessToken = token;
        if (typeof window !== 'undefined') {
            if (token) localStorage.setItem('accessToken', token);
            else localStorage.removeItem('accessToken');
        }
    },
    clearTokens: () => {
        accessToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
        }
    },
    loadTokens: () => {
        if (typeof window !== 'undefined') {
            accessToken = localStorage.getItem('accessToken');
        }
    },
    saveTokens: (access: string) => {
        accessToken = access;
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', access);
        }
    },
};



/**
 * Base fetch wrapper with error handling
 */
function isTokenExpiringSoon(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const timeUntilExpiry = expiryTime - Date.now();
        return timeUntilExpiry < 5 * 60 * 1000; // Less than 5 minutes
    } catch {
        return false;
    }
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshTokenIfNeeded(): Promise<void> {
    const token = tokenManager.getAccessToken();
    if (!token || !isTokenExpiringSoon(token)) return;

    if (isRefreshing) {
        return refreshPromise!;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            console.log('Refreshing access token...');
            const response = await fetch(`${config.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Send refresh token cookie
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Token refresh failed:', response.status, errorData.message);
                throw new Error(errorData.message || 'Token refresh failed');
            }

            const data = await response.json();
            if (data?.data?.accessToken) {
                tokenManager.saveTokens(data.data.accessToken);
                console.log('Access token refreshed successfully');
            } else {
                console.error('Token refresh response missing accessToken');
            }
        } catch (error: any) {
            console.error('RefreshToken logic caught error:', error.message);
            // Only logout on definitive auth errors (401/403) to avoid issues with flaky network
            if (error.message.includes('Unauthorized') ||
                error.message.includes('unauthenticated') ||
                error.message.includes('expired') ||
                error.message.includes('start with') || // JWT malformed
                error.message.includes('required')) {
                handleRefreshError(error);
            }
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// Helper to handle unauthorized errors during refresh
async function handleRefreshError(error: any) {
    console.error('Token refresh error:', error.message);
    tokenManager.clearTokens();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?error=session_expired';
    }
}

async function baseFetch(
    endpoint: string,
    options: RequestInit & { responseType?: 'json' | 'blob'; timeout?: number } = {}
): Promise<any> {
    // Auto-refresh token if needed (except for auth endpoints)
    if (!endpoint.includes('/auth/')) {
        await refreshTokenIfNeeded();
    }

    const url = `${config.baseURL}${endpoint}`;

    const headers: Record<string, string> = {};

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (options.headers) {
        const customHeaders = options.headers as Record<string, string>;
        Object.assign(headers, customHeaders);
    }

    // Get token from memory (set during login)
    // The httpOnly cookie will be sent automatically with the request
    const token = tokenManager.getAccessToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const requestTimeout = options.timeout || config.timeout;
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // Send cookies with requests
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // SPECIAL HANDLING: If we get a 401 (Unauthorized) from a regular API call,
            // it means our token is invalid/expired and refresh failed or wasn't tried.
            // We must force a logout to prevent infinite error loops.
            if (response.status === 401 && !endpoint.includes('/auth/')) {
                console.error('Received 401 from API - forcing logout');

                // Clear tokens immediately
                tokenManager.clearTokens();

                // Redirect if not already on login page
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    // Use window.location for hard redirect to ensure state clean slate
                    window.location.href = '/login?error=session_expired';
                    // Return empty promise to halt execution chain
                    return new Promise(() => { });
                }
            }

            let data;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } catch {
                data = {};
            }
            throw new RequestError(
                response.status,
                data.message || 'Request failed',
                data
            );
        }

        if (options.responseType === 'blob') {
            return response.blob();
        }

        let data: any;
        try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {
            data = {};
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof RequestError) {
            throw error;
        }

        // Check for offline/network error
        const isNetError = isNetworkError(error);
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET');

        if (isNetError && isMutation) {
            try {
                // Only queue mutations if we're in a browser environment
                if (typeof window !== 'undefined') {
                    const { syncManager } = await import('@/lib/offline/sync-manager');
                    const body = options.body ? JSON.parse(options.body as string) : undefined;
                    await syncManager.queueMutation(endpoint, options.method as any, body);
                    throw new OfflineError();
                }
            } catch (queueError) {
                console.error('Failed to queue offline mutation:', queueError);
                // Fall through to throw original error
            }
        }

        if (error instanceof Error) {
            if (error.name === 'AbortError' || isTimeoutError(error)) {
                throw new RequestError(408, 'Request timeout');
            }
            if (isNetworkError(error)) {
                throw new RequestError(503, 'Network connection failed');
            }
            throw new RequestError(500, error.message);
        }

        throw new RequestError(500, 'Unknown error occurred');
    }
}

/**
 * API client with automatic token refresh
 */
export const apiClient = {
    async get(endpoint: string, options?: RequestInit & { responseType?: 'json' | 'blob'; timeout?: number }) {
        return baseFetch(endpoint, { ...options, method: 'GET' });
    },

    async post(endpoint: string, data?: any, options?: RequestInit & { responseType?: 'json' | 'blob'; timeout?: number }) {
        return baseFetch(endpoint, {
            ...options,
            method: 'POST',
            body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
        });
    },

    async put(endpoint: string, data?: any, options?: RequestInit & { responseType?: 'json' | 'blob'; timeout?: number }) {
        return baseFetch(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    async patch(endpoint: string, data?: any, options?: RequestInit & { responseType?: 'json' | 'blob'; timeout?: number }) {
        return baseFetch(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    async delete(endpoint: string, options?: RequestInit & { responseType?: 'json' | 'blob'; timeout?: number }) {
        return baseFetch(endpoint, { ...options, method: 'DELETE' });
    },
};

// Export baseFetch for direct use in API modules
export { baseFetch };

// Note: Tokens are now managed via secure httpOnly cookies
// No need to load from localStorage on initialization
