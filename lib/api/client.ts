/**
 * API Client Configuration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000');

export const config = {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
};

/**
 * Token management
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenManager = {
    getAccessToken: () => accessToken,
    setAccessToken: (token: string | null) => {
        accessToken = token;
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
 * API Error class
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

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
            const response = await fetch(`${config.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Send refresh token cookie
            });
            const data = await response.json();
            if (data?.data?.accessToken) {
                tokenManager.saveTokens(data.data.accessToken);
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function baseFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    // Auto-refresh token if needed (except for auth endpoints)
    if (!endpoint.includes('/auth/')) {
        await refreshTokenIfNeeded();
    }

    const url = `${config.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (options.headers) {
        const customHeaders = options.headers as Record<string, string>;
        Object.assign(headers, customHeaders);
    }

    const token = tokenManager.getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // Send cookies with requests
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data: any;
        try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {
            data = {};
        }

        if (!response.ok) {
            throw new ApiError(
                response.status,
                data.message || 'Request failed',
                data
            );
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new ApiError(408, 'Request timeout');
            }
            throw new ApiError(500, error.message);
        }

        throw new ApiError(500, 'Unknown error occurred');
    }
}

/**
 * API client with automatic token refresh
 */
export const apiClient = {
    async get(endpoint: string, options?: RequestInit) {
        return baseFetch(endpoint, { ...options, method: 'GET' });
    },

    async post(endpoint: string, data?: any, options?: RequestInit) {
        return baseFetch(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    async put(endpoint: string, data?: any, options?: RequestInit) {
        return baseFetch(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    async patch(endpoint: string, data?: any, options?: RequestInit) {
        return baseFetch(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    async delete(endpoint: string, options?: RequestInit) {
        return baseFetch(endpoint, { ...options, method: 'DELETE' });
    },
};

// Load tokens on initialization (client-side only)
if (typeof window !== 'undefined') {
    tokenManager.loadTokens();
}
