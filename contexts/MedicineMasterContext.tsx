'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { medicineApi } from '@/lib/api/medicineApi';

// Define the shape of our Master Data Item
export interface MedicineMasterItem {
    barcode: string;
    name: string;
    mrp: number;
    gstRate: number;
    manufacturer: string;
    sku: string;
    type?: 'OTC' | 'RX';
    requiresPrescription?: boolean;
}

interface MedicineMasterContextType {
    lookupByBarcode: (barcode: string) => Promise<MedicineMasterItem | undefined>;
    isLoading: boolean;
}

const MedicineMasterContext = createContext<MedicineMasterContextType | undefined>(undefined);

export function MedicineMasterProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);

    const lookupByBarcode = async (barcode: string): Promise<MedicineMasterItem | undefined> => {
        try {
            setIsLoading(true);
            const medicine = await medicineApi.findByBarcode(barcode);
            
            if (!medicine) {
                return undefined;
            }

            // Transform API response to MedicineMasterItem format
            return {
                barcode: medicine.primaryBarcode || barcode,
                name: medicine.name,
                mrp: medicine.defaultPrice || 0,
                gstRate: medicine.defaultGstRate || 12,
                manufacturer: medicine.manufacturerName,
                sku: medicine.id,
                type: medicine.requiresPrescription ? 'RX' : 'OTC',
                requiresPrescription: medicine.requiresPrescription
            };
        } catch (error) {
            console.error('❌ Failed to lookup medicine by barcode:', error);
            return undefined;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MedicineMasterContext.Provider value={{ lookupByBarcode, isLoading }}>
            {children}
        </MedicineMasterContext.Provider>
    );
}

export function useMedicineMaster() {
    const context = useContext(MedicineMasterContext);
    if (context === undefined) {
        throw new Error('useMedicineMaster must be used within a MedicineMasterProvider');
    }
    return context;
}
