"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiClient } from '@/lib/api/client';

interface BusinessTypeContextType {
    businessType: string | null;
    featureConfig: Record<string, string>;
    isFeatureEnabled: (featureCode: string) => boolean;
    isFeatureEssential: (featureCode: string) => boolean;
    loading: boolean;
}

const BusinessTypeContext = createContext<BusinessTypeContextType>({
    businessType: null,
    featureConfig: {},
    isFeatureEnabled: () => true,
    isFeatureEssential: () => false,
    loading: true,
});

export const useBusinessType = () => useContext(BusinessTypeContext);

export function BusinessTypeProvider({ children }: { children: React.ReactNode }) {
    const authState = useAuthStore();
    const [businessType, setBusinessType] = useState<string | null>(null);
    const [featureConfig, setFeatureConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBusinessTypeConfig() {
            // Get store ID from auth state using correct properties
            // AuthState has primaryStore object, not stores array
            const storeId = authState.primaryStore?.id ||
                (authState as any).user?.storeUsers?.[0]?.storeId ||
                (authState as any).user?.storeId;

            console.log('[BusinessType] Auth state:', {
                hasPrimaryStore: !!authState.primaryStore,
                primaryStoreId: authState.primaryStore?.id,
                resolvedStoreId: storeId,
                user: authState.user?.email
            });

            if (!storeId) {
                console.log('[BusinessType] No store ID found, skipping fetch');
                setLoading(false);
                return;
            }

            try {
                const endpoint = `/business-types/stores/${storeId}/feature-config`;
                console.log('[BusinessType] Fetching config from:', endpoint);

                const response = await apiClient.get(endpoint);

                console.log('[BusinessType] Response:', response);

                if (response.success && response.data) {
                    console.log('[BusinessType] Received data:', response.data);
                    setBusinessType(response.data.businessType);
                    setFeatureConfig(response.data.featureConfig);
                } else {
                    console.error('[BusinessType] API returned unsuccessful response:', response);
                }
            } catch (error) {
                console.error('[BusinessType] Failed to fetch business type config:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchBusinessTypeConfig();
    }, [authState]);

    const isFeatureEnabled = (featureCode: string): boolean => {
        if (!businessType) return true; // Default to showing all features if no business type
        const availability = featureConfig[featureCode];
        return availability === 'essential' || availability === 'optional';
    };

    const isFeatureEssential = (featureCode: string): boolean => {
        if (!businessType) return false;
        return featureConfig[featureCode] === 'essential';
    };

    return (
        <BusinessTypeContext.Provider
            value={{
                businessType,
                featureConfig,
                isFeatureEnabled,
                isFeatureEssential,
                loading,
            }}
        >
            {children}
        </BusinessTypeContext.Provider>
    );
}
