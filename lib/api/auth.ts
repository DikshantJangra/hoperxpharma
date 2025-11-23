import { apiClient, tokenManager, ApiError } from './client';

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
            // Set a non-httpOnly cookie to help middleware identify logged-in users
            document.cookie = "logged_in=true; path=/; max-age=604800; SameSite=Lax";
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
            // Set a non-httpOnly cookie to help middleware identify logged-in users
            document.cookie = "logged_in=true; path=/; max-age=604800; SameSite=Lax";
        }

        return response;
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
            document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
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
};
