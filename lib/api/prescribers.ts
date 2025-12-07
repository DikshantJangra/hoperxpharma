const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const prescriberApi = {
    // Get prescribers with optional search
    getPrescribers: async (search: string = "") => {
        try {
            const response = await fetch(`${API_URL}/prescribers?search=${encodeURIComponent(search)}`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch prescribers", error);
            return { success: false, message: "Network error" };
        }
    },

    // Create a new prescriber
    createPrescriber: async (prescriberData: { name: string; licenseNumber: string; clinicAddress?: string; phoneNumber?: string }) => {
        try {
            const response = await fetch(`${API_URL}/prescribers`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(prescriberData),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to create prescriber", error);
            return { success: false, message: "Network error" };
        }
    }
};
