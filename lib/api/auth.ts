import { apiClient, tokenManager } from './client';

export interface SignupData {
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        user: {
            id: string;
            email: string;
            phoneNumber: string;
            firstName: string;
            lastName: string;
            role: string;
            isActive: boolean;
            createdAt: string;
        };
        accessToken: string;
        permissions?: string[]; // User's permission codes
    };
}

export interface UserProfile {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    storeUsers: any[];
}

/**
 * Authentication API
 */
export const authApi = {
    /**
     * User signup
     */
    async signup(data: SignupData): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/signup', data);

        if (response.data?.accessToken) {
            tokenManager.saveTokens(response.data.accessToken);
            // Note: Cookie will be set by auth-store AFTER successful profile fetch
        }

        return response;
    },

    /**
     * User login
     */
    async login(data: LoginData): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/login', data);

        if (response.data?.accessToken) {
            tokenManager.saveTokens(response.data.accessToken);
            // Note: Cookie will be set by auth-store AFTER successful profile fetch
        }

        return response;
    },

    /**
     * Set logged in cookie (called after successful profile fetch)
     * Uses Secure and SameSite=None for production HTTPS to ensure cross-origin cookie persistence
     */
    setLoggedInCookie(): void {
        if (typeof document !== 'undefined') {
            const isSecure = window.location.protocol === 'https:';
            // Production (HTTPS): Use SameSite=None with Secure for cross-origin cookie support
            // Development (HTTP): Use SameSite=Lax without Secure
            const cookieValue = isSecure
                ? "logged_in=true; path=/; max-age=604800; SameSite=None; Secure"
                : "logged_in=true; path=/; max-age=604800; SameSite=Lax";
            document.cookie = cookieValue;
        }
    },

    /**
     * Clear logged in cookie
     * Clears with all possible attribute combinations to ensure cleanup
     */
    clearLoggedInCookie(): void {
        if (typeof document !== 'undefined') {
            // Clear with multiple attribute combinations to handle both dev and prod
            document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
            document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure";
            document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=None";
        }
    },

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<{ accessToken: string }> {
        const response = await apiClient.post('/auth/refresh');

        if (response.data?.accessToken) {
            tokenManager.saveTokens(response.data.accessToken);
        }

        return response.data;
    },

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            tokenManager.clearTokens();
            this.clearLoggedInCookie();

            // SECURITY FIX: Clear all auth-related cookies with multiple attribute combinations
            // Production cookies may be set with Secure/SameSite=None which requires matching attributes to clear
            if (typeof document !== 'undefined') {
                const cookiesToClear = ['token', 'accessToken', 'refreshToken', 'logged_in'];
                cookiesToClear.forEach(name => {
                    // Clear with basic path
                    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
                    // Clear with Secure flag (for HTTPS contexts)
                    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure`;
                    // Clear with Secure + SameSite=None (for cross-origin production setup)
                    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=None`;
                    // Clear with SameSite=Lax (for development)
                    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
                });
            }
        }
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<UserProfile> {
        const response = await apiClient.get('/auth/profile');
        return response.data;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!tokenManager.getAccessToken();
    },

    /**
     * Get current access token
     */
    getToken(): string | null {
        return tokenManager.getAccessToken();
    },

    /**
     * Get current user's permissions
     */
    async getMyPermissions(): Promise<{ success: boolean; data: { permissions: string[] } }> {
        const response = await apiClient.get('/auth/permissions');
        return response;
    },
};
