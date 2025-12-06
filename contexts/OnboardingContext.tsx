"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { onboardingApi } from "@/lib/api/onboarding";

export interface StoreIdentityData {
    pharmacyName: string;
    businessType: string;
    address: string;
    city: string;
    pinCode: string;
    state: string;
    landmark: string;
    storeLogo: string;
    displayName: string;
    phoneNumber: string;
    email: string;
}

export interface LicensingData {
    dlNumber: string;
    dlValidityStart: string;
    dlValidityEnd: string;
    gstin: string;
    pan: string;
    dlDocument: string;
    gstCertificate: string;
}

export interface TimingsData {
    operatingDays: string[];
    openTime: string;
    closeTime: string;
    lunchBreak: boolean;
    lunchStart: string;
    lunchEnd: string;
    is24x7: boolean;
    holidays: string[];
    deliveryAvailable: boolean;
}

export interface InventoryData {
    lowStockThreshold: number;
    nearExpiryThreshold: number;
    defaultUoM: string;
    purchaseRounding: boolean;
    batchTracking: boolean;
    autoGenerateCodes: boolean;
    allowNegativeStock: boolean;
    defaultGSTSlab: string;
}

export interface SupplierData {
    name: string;
    contactName: string;
    phone: string;
    email?: string;
    whatsapp?: string;
    category: string;
    gstin?: string;
    dlNumber?: string;
    pan?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    deliveryArea?: string;
    creditTerms: string;
    creditLimit?: string;
    dlDocument?: string;
}

export interface POSData {
    invoiceFormat: string;
    paymentMethods: string[];
    billingType: string;
    printFormat: string;
    footerText: string;
    autoRounding: boolean;
    defaultCustomerType: string;
    enableGSTBilling: boolean;
}

export interface UserData {
    name: string;
    email?: string;
    phone: string;
    role: string;
    password?: string;
    pin: string;
}

export interface IntegrationData {
    whatsapp: { connected: boolean; number: string; verified: boolean };
    email: { connected: boolean; provider: string };
    sms: { connected: boolean; provider: string };
    payment: { connected: boolean; provider: string; apiKey: string };
}

export interface ImportData {
    inventory: { uploaded: boolean; count: number };
    patients: { uploaded: boolean; count: number };
    suppliers: { uploaded: boolean; count: number };
    sales: { uploaded: boolean; count: number };
}

export interface OnboardingState {
    currentStep: number;
    completedSteps: number[];
    data: {
        storeIdentity: Partial<StoreIdentityData>;
        licensing: Partial<LicensingData>;
        timings: Partial<TimingsData>;
        inventory: Partial<InventoryData>;
        suppliers: SupplierData[];
        pos: Partial<POSData>;
        users: UserData[];
        integrations: Partial<IntegrationData>;
        imports: Partial<ImportData>;
    };
    isComplete: boolean;
}

interface OnboardingContextType {
    state: OnboardingState;
    updateStoreIdentity: (data: Partial<StoreIdentityData>) => void;
    updateLicensing: (data: Partial<LicensingData>) => void;
    updateTimings: (data: Partial<TimingsData>) => void;
    updateInventory: (data: Partial<InventoryData>) => void;
    addSupplier: (supplier: SupplierData) => void;
    removeSupplier: (index: number) => void;
    updatePOS: (data: Partial<POSData>) => void;
    addUser: (user: UserData) => void;
    removeUser: (index: number) => void;
    updateIntegrations: (data: Partial<IntegrationData>) => void;
    updateImports: (data: Partial<ImportData>) => void;
    setCurrentStep: (step: number) => void;
    markStepComplete: (step: number) => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialState: OnboardingState = {
    currentStep: 1,
    completedSteps: [],
    data: {
        storeIdentity: {},
        licensing: {},
        timings: {
            operatingDays: [],
            lunchBreak: false,
            is24x7: false,
            holidays: [],
            deliveryAvailable: false
        },
        inventory: {
            lowStockThreshold: 10,
            nearExpiryThreshold: 90,
            defaultUoM: "Units",
            purchaseRounding: false,
            batchTracking: true,
            autoGenerateCodes: true,
            allowNegativeStock: false,
            defaultGSTSlab: "12"
        },
        suppliers: [],
        pos: {
            invoiceFormat: "INV/0001",
            paymentMethods: ["Cash"],
            autoRounding: true,
            enableGSTBilling: true
        },
        users: [],
        integrations: {
            whatsapp: { connected: false, number: "", verified: false },
            email: { connected: false, provider: "resend" },
            sms: { connected: false, provider: "" },
            payment: { connected: false, provider: "", apiKey: "" }
        },
        imports: {
            inventory: { uploaded: false, count: 0 },
            patients: { uploaded: false, count: 0 },
            suppliers: { uploaded: false, count: 0 },
            sales: { uploaded: false, count: 0 }
        }
    },
    isComplete: false
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<OnboardingState>(initialState);
    const [isLoading, setIsLoading] = useState(true);

    // Load from API on mount
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const progress = await onboardingApi.getProgress();
                if (progress && progress.data) {
                    setState(prev => ({
                        ...prev,
                        currentStep: progress.currentStep || 1,
                        completedSteps: progress.completedSteps || [],
                        data: { ...prev.data, ...progress.data },
                        isComplete: progress.isComplete || false
                    }));
                }
            } catch (e) {
                console.error("Failed to load onboarding progress", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadProgress();
    }, []);

    // Save to API on state change (debounced)
    useEffect(() => {
        if (isLoading) return; // Don't save initial empty state or while loading
        if (state.isComplete) return; // Don't save if onboarding is already complete

        const timer = setTimeout(() => {
            onboardingApi.saveProgress({
                currentStep: state.currentStep,
                completedSteps: state.completedSteps,
                data: state.data,
                isComplete: state.isComplete
            }).catch(err => {
                // Silently fail - don't disrupt user experience
                console.warn("Failed to save onboarding progress:", err);
            });
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [state, isLoading]);

    const updateStoreIdentity = useCallback((data: Partial<StoreIdentityData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                storeIdentity: { ...prev.data.storeIdentity, ...data }
            }
        }));
    }, []);

    const updateLicensing = useCallback((data: Partial<LicensingData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                licensing: { ...prev.data.licensing, ...data }
            }
        }));
    }, []);

    const updateTimings = useCallback((data: Partial<TimingsData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                timings: { ...prev.data.timings, ...data }
            }
        }));
    }, []);

    const updateInventory = useCallback((data: Partial<InventoryData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                inventory: { ...prev.data.inventory, ...data }
            }
        }));
    }, []);

    const addSupplier = useCallback((supplier: SupplierData) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                suppliers: [...prev.data.suppliers, supplier]
            }
        }));
    }, []);

    const removeSupplier = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                suppliers: prev.data.suppliers.filter((_, i) => i !== index)
            }
        }));
    }, []);

    const updatePOS = useCallback((data: Partial<POSData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                pos: { ...prev.data.pos, ...data }
            }
        }));
    }, []);

    const addUser = useCallback((user: UserData) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                users: [...prev.data.users, user]
            }
        }));
    }, []);

    const removeUser = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                users: prev.data.users.filter((_, i) => i !== index)
            }
        }));
    }, []);

    const updateIntegrations = useCallback((data: Partial<IntegrationData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                integrations: { ...prev.data.integrations, ...data }
            }
        }));
    }, []);

    const updateImports = useCallback((data: Partial<ImportData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                imports: { ...prev.data.imports, ...data }
            }
        }));
    }, []);

    const setCurrentStep = useCallback((step: number) => {
        setState(prev => ({ ...prev, currentStep: step }));
    }, []);

    const markStepComplete = useCallback((step: number) => {
        setState(prev => ({
            ...prev,
            completedSteps: prev.completedSteps.includes(step)
                ? prev.completedSteps
                : [...prev.completedSteps, step]
        }));
    }, []);

    const completeOnboarding = useCallback(() => {
        setState(prev => ({ ...prev, isComplete: true }));
        // Progress is automatically saved to API via useEffect
    }, []);

    const resetOnboarding = useCallback(() => {
        setState(initialState);
        // Progress is automatically saved to API via useEffect
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <OnboardingContext.Provider
            value={{
                state,
                updateStoreIdentity,
                updateLicensing,
                updateTimings,
                updateInventory,
                addSupplier,
                removeSupplier,
                updatePOS,
                addUser,
                removeUser,
                updateIntegrations,
                updateImports,
                setCurrentStep,
                markStepComplete,
                completeOnboarding,
                resetOnboarding
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider");
    }
    return context;
}
