"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    phone: string;
    category: string;
    gstin: string;
    deliveryArea: string;
    creditTerms: string;
    dlDocument: string;
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
    phone: string;
    role: string;
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
    updatePOS: (data: Partial<POSData>) => void;
    addUser: (user: UserData) => void;
    updateIntegrations: (data: Partial<IntegrationData>) => void;
    updateImports: (data: Partial<ImportData>) => void;
    setCurrentStep: (step: number) => void;
    markStepComplete: (step: number) => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = "hoperx_onboarding_state";

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

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setState(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved onboarding state", e);
            }
        }
    }, []);

    // Save to localStorage on state change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const updateStoreIdentity = (data: Partial<StoreIdentityData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                storeIdentity: { ...prev.data.storeIdentity, ...data }
            }
        }));
    };

    const updateLicensing = (data: Partial<LicensingData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                licensing: { ...prev.data.licensing, ...data }
            }
        }));
    };

    const updateTimings = (data: Partial<TimingsData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                timings: { ...prev.data.timings, ...data }
            }
        }));
    };

    const updateInventory = (data: Partial<InventoryData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                inventory: { ...prev.data.inventory, ...data }
            }
        }));
    };

    const addSupplier = (supplier: SupplierData) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                suppliers: [...prev.data.suppliers, supplier]
            }
        }));
    };

    const updatePOS = (data: Partial<POSData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                pos: { ...prev.data.pos, ...data }
            }
        }));
    };

    const addUser = (user: UserData) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                users: [...prev.data.users, user]
            }
        }));
    };

    const updateIntegrations = (data: Partial<IntegrationData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                integrations: { ...prev.data.integrations, ...data }
            }
        }));
    };

    const updateImports = (data: Partial<ImportData>) => {
        setState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                imports: { ...prev.data.imports, ...data }
            }
        }));
    };

    const setCurrentStep = (step: number) => {
        setState(prev => ({ ...prev, currentStep: step }));
    };

    const markStepComplete = (step: number) => {
        setState(prev => ({
            ...prev,
            completedSteps: prev.completedSteps.includes(step)
                ? prev.completedSteps
                : [...prev.completedSteps, step]
        }));
    };

    const completeOnboarding = () => {
        setState(prev => ({ ...prev, isComplete: true }));
        localStorage.removeItem(STORAGE_KEY);
    };

    const resetOnboarding = () => {
        setState(initialState);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <OnboardingContext.Provider
            value={{
                state,
                updateStoreIdentity,
                updateLicensing,
                updateTimings,
                updateInventory,
                addSupplier,
                updatePOS,
                addUser,
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
