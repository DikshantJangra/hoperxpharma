"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { onboardingApi } from "@/lib/api/onboarding";

export interface StoreIdentityData {
    pharmacyName: string;
    businessType: string[]; // Changed to array to support multiple types
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
    upiId?: string;
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
    storeId?: string;
    mode?: 'REAL' | 'DEMO';
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
    setMode: (mode: 'REAL' | 'DEMO', businessType?: string) => Promise<void>;
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
    reloadData: () => Promise<void>;
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
            purchaseRounding: true,
            batchTracking: true,
            autoGenerateCodes: true,
            allowNegativeStock: false,
            defaultGSTSlab: "5"
        },
        suppliers: [],
        pos: {
            invoiceFormat: "INV-{YY}{MM}-{SEQ:4}",
            paymentMethods: ["Cash"],
            autoRounding: true,
            defaultCustomerType: "Walk-in",
            enableGSTBilling: true,
            upiId: ""
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
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const loadProgress = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await onboardingApi.getProgress();
            if (response) {
                const payload = response;
                console.log("[DEBUG_FRONTEND_LOAD] Payload:", payload);
                if (payload.data && payload.data.inventory) {
                    console.log("[DEBUG_FRONTEND_LOAD] Payload Inventory:", JSON.stringify(payload.data.inventory));
                }

                setState(prev => {
                    const newState = {
                        ...prev,
                        currentStep: payload.currentStep || 1,
                        completedSteps: payload.completedSteps || [],
                        data: { ...prev.data, ...(payload.data || {}) },
                        isComplete: payload.completed || false,
                        storeId: payload.storeId,
                        mode: payload.mode
                    };
                    console.log("[DEBUG_FRONTEND_MERGE] New Inventory State:", JSON.stringify(newState.data.inventory));
                    return newState;
                });
                setIsDataLoaded(true);
            }
        } catch (e: any) {
            console.error("Failed to load onboarding progress", e);
            // Only block if it's a real error, not just 404/new user (though backend returns 200 for new user)
            // If it's 401, apiClient handles redirect.
            if (e.status !== 401) {
                setError("Failed to load your progress. Please check your connection.");
            }
            if (e.status === 429) {
                localStorage.setItem('onboarding_last_error', JSON.stringify({ time: Date.now() }));
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load from API on mount
    useEffect(() => {
        const lastError = localStorage.getItem('onboarding_last_error');
        if (lastError) {
            const { time } = JSON.parse(lastError);
            if (Date.now() - time < 5000) {
                setIsLoading(false);
                setError("Please wait a moment before retrying.");
                return;
            }
        }
        loadProgress();
    }, [loadProgress]);

    // Save to API on state change (debounced)
    useEffect(() => {
        if (isLoading) return;
        if (!isDataLoaded) return;
        if (state.isComplete) return;

        setIsSaving(true);
        const timer = setTimeout(() => {
            const payload = {
                currentStep: state.currentStep,
                completedSteps: state.completedSteps,
                data: state.data,
                isComplete: state.isComplete
            };
            console.log("Saving Progress Payload:", payload); // DEBUG: Check what is actually being sent

            onboardingApi.saveProgress(payload).then(() => {
                setLastSaved(new Date());
            }).catch(err => {
                console.warn("Failed to save onboarding progress:", err);
                if (err.status === 429) {
                    setError("Saving too frequently. Please wait a moment.");
                    // Optionally set a flag to prevent immediate retry
                }
            }).finally(() => {
                setIsSaving(false);
            });
        }, 1500); // Increased debounce to 1.5s to be safer

        return () => {
            clearTimeout(timer);
            // Note: We don't clear isSaving here because we want to show it while the timer is running or api is flying
            // But if we clear timer, we should probably keep isSaving true? 
            // Actually, if we clear timer, the save is aborted, so isSaving should technically be false?
            // But effectively, 'isSaving' means 'Changes pending or saving'.
        };
    }, [state, isLoading, isDataLoaded]);

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

    const setMode = useCallback(async (mode: 'REAL' | 'DEMO', businessType?: string) => {
        try {
            const response = await onboardingApi.setMode(mode, businessType);
            const data = response.data || {}; // Fallback if data is missing

            setState(prev => ({
                ...prev,
                mode: mode,
                // Check if backend returned other updates (e.g., storeId for demo mode)
                ...(data.storeId && { storeId: data.storeId }),
                ...(data.isComplete && { isComplete: data.isComplete })
            }));

            return response;
        } catch (error) {
            console.error('Failed to set onboarding mode:', error);
            throw error;
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Progress</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => loadProgress()}
                        className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Try Again
                    </button>
                </div>
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
                resetOnboarding,
                setMode,
                isSaving,
                lastSaved,
                error,
                reloadData: loadProgress
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
