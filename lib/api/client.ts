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
    getRefreshToken: () => refreshToken,
    setRefreshToken: (token: string | null) => {
        refreshToken = token;
    },
    clearTokens: () => {
        accessToken = null;
        refreshToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    },
    loadTokens: () => {
        if (typeof window !== 'undefined') {
            accessToken = localStorage.getItem('accessToken');
            refreshToken = localStorage.getItem('refreshToken');
        }
    },
    saveTokens: (access: string, refresh?: string) => {
        accessToken = access;
        if (refresh) refreshToken = refresh;

        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', access);
            if (refresh) localStorage.setItem('refreshToken', refresh);
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
async function baseFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const url = `${config.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Merge custom headers
    if (options.headers) {
        const customHeaders = options.headers as Record<string, string>;
        Object.assign(headers, customHeaders);
    }

    // Add auth token if available
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
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Try to parse JSON, but handle cases where response body is empty or invalid
        let data: any;
        try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {
            // If JSON parsing fails, use empty object
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
