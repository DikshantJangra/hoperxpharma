'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FeatureConfig {
    [key: string]: 'essential' | 'optional' | 'hidden' | 'premium';
}

export interface Features {
    featureConfig: FeatureConfig;
    enabledSections: string[];
    defaultPermissions: string[];
}

interface FeatureContextType {
    features: Features | null;
    loading: boolean;
    isEnabled: (featureName: string) => boolean;
    getVisibilityLevel: (featureName: string) => string;
    refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: ReactNode }) {
    const [features, setFeatures] = useState<Features | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchFeatures = async () => {
        try {
            const response = await fetch('/api/v1/features', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFeatures(data.data);
            } else {
                // Fallback to default features
                setFeatures(getDefaultFeatures());
            }
        } catch (error) {
            console.error('Error fetching features:', error);
            setFeatures(getDefaultFeatures());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    const isEnabled = (featureName: string): boolean => {
        if (!features || !features.featureConfig) {
            return true; // Default to enabled
        }

        const level = features.featureConfig[featureName];
        return level === 'essential' || level === 'optional';
    };

    const getVisibilityLevel = (featureName: string): string => {
        if (!features || !features.featureConfig) {
            return 'optional';
        }

        return features.featureConfig[featureName] || 'optional';
    };

    const refreshFeatures = async () => {
        setLoading(true);
        await fetchFeatures();
    };

    const value: FeatureContextType = {
        features,
        loading,
        isEnabled,
        getVisibilityLevel,
        refreshFeatures,
    };

    return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
}

export function useFeatures() {
    const context = useContext(FeatureContext);
    if (context === undefined) {
        throw new Error('useFeatures must be used within a FeatureProvider');
    }
    return context;
}

// Default features fallback
function getDefaultFeatures(): Features {
    return {
        featureConfig: {
            pos: 'essential',
            inventory: 'essential',
            customers: 'essential',
            prescriptions: 'essential',
            engage: 'optional',
            reports: 'essential',
            dispensing: 'hidden',
            ipd: 'hidden',
            opd: 'hidden',
            'whatsapp-campaigns': 'hidden',
            'email-marketing': 'hidden',
        },
        enabledSections: [
            'Operations',
            'Inventory & Supply',
            'Customers',
            'Engage',
            'Reports & Analytics',
            'Settings',
        ],
        defaultPermissions: [
            'sale.create',
            'sale.view',
            'inventory.view',
            'patient.create',
            'prescription.view',
            'reports.view',
        ],
    };
}
