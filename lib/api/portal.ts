import { getApiBaseUrl } from '@/lib/config/env';

const PORTAL_API_URL = getApiBaseUrl();

// Helper to handle fetch errors similarly to axios
async function handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
        const error: any = new Error(data.error || data.message || 'API request failed');
        error.response = { data, status: response.status };
        throw error;
    }
    return data;
}

export const portalApi = {
    /**
     * Verify patient identity
     */
    async verify(data: { phoneNumber: string; dateOfBirth: string }) {
        try {
            const response = await fetch(`${PORTAL_API_URL}/portal/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await handleResponse(response);

            // Should return { token, patient }
            if (result.token) {
                // Save token
                localStorage.setItem('portal_token', result.token);
                localStorage.setItem('portal_user', JSON.stringify(result.patient));
            }

            return result;
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * Get active prescriptions
     */
    async getPrescriptions() {
        const token = localStorage.getItem('portal_token');
        if (!token) throw new Error('Not authenticated');

        try {
            const response = await fetch(`${PORTAL_API_URL}/portal/prescriptions`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return await handleResponse(response);
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * Request refill
     */
    async requestRefill(prescriptionId: string) {
        const token = localStorage.getItem('portal_token');
        if (!token) throw new Error('Not authenticated');

        try {
            const response = await fetch(`${PORTAL_API_URL}/portal/refill-request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prescriptionId }),
            });

            return await handleResponse(response);
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * Logout
     */
    logout() {
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_user');
        window.location.href = '/portal';
    }
};
