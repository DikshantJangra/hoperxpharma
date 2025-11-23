import { apiClient } from './client';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface StoreLicense {
    id: string;
    storeId: string;
    type: string;
    number: string;
    validFrom: string;
    validTo: string;
    documentUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface StoreOperatingHours {
    id: string;
    storeId: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
    lunchStart?: string;
    lunchEnd?: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    price: number;
    currency: string;
    billingCycle: string;
}

export interface Subscription {
    id: string;
    storeId: string;
    planId: string;
    status: string;
    trialEndsAt?: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    autoRenew: boolean;
    plan: SubscriptionPlan;
    createdAt: string;
    updatedAt: string;
}

export interface Store {
    id: string;
    name: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    businessType?: string;
    logoUrl?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    landmark?: string;
    is24x7: boolean;
    homeDelivery: boolean;
    licenses: StoreLicense[];
    operatingHours: StoreOperatingHours[];
    subscription?: Subscription;
    createdAt: string;
    updatedAt: string;
}

export interface StoreUser {
    userId: string;
    storeId: string;
    isPrimary: boolean;
    assignedAt: string;
    store: Store;
}

export interface UserProfile {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    storeUsers: StoreUser[];
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserProfileData {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}

export interface OnboardingStatus {
    completed: boolean;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * User API
 */
export const userApi = {
    /**
     * Get current user profile with complete store data
     */
    async getUserProfile(): Promise<UserProfile> {
        const response = await apiClient.get('/users/me');
        return response.data;
    },

    /**
     * Get current user's primary store
     */
    async getPrimaryStore(): Promise<Store> {
        const response = await apiClient.get('/users/me/primary-store');
        return response.data;
    },

    /**
     * Update current user profile
     */
    async updateUserProfile(data: UpdateUserProfileData): Promise<UserProfile> {
        const response = await apiClient.patch('/users/me', data);
        return response.data;
    },

    /**
     * Check if user has completed onboarding
     */
    async getOnboardingStatus(): Promise<OnboardingStatus> {
        const response = await apiClient.get('/users/me/onboarding-status');
        return response.data;
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's full name
 */
export function getUserFullName(user: UserProfile | null): string {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * Get user's initials
 */
export function getUserInitials(user: UserProfile | null): string {
    if (!user) return '?';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (firstName) {
        return firstName[0].toUpperCase();
    }

    return '?';
}

/**
 * Get primary store from user profile
 */
export function getPrimaryStore(user: UserProfile | null): Store | null {
    if (!user?.storeUsers || user.storeUsers.length === 0) {
        return null;
    }

    const primaryStoreUser = user.storeUsers.find(su => su.isPrimary);
    return primaryStoreUser?.store || user.storeUsers[0]?.store || null;
}

/**
 * Get store GSTIN from licenses
 */
export function getStoreGSTIN(store: Store | null): string {
    if (!store?.licenses || store.licenses.length === 0) {
        return '-';
    }

    const gstLicense = store.licenses.find(l => l.type === 'GSTIN');
    return gstLicense?.number || '-';
}

/**
 * Get store location string
 */
export function getStoreLocation(store: Store | null): string {
    if (!store) return '-';

    const parts = [];
    if (store.city) parts.push(store.city);
    if (store.state) parts.push(store.state);

    return parts.length > 0 ? parts.join(', ') : '-';
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(user: UserProfile | null): boolean {
    return !!(user?.storeUsers && user.storeUsers.length > 0);
}
