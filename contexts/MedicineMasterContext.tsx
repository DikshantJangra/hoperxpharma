'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import mockData from '@/lib/data/mock-medicine-master.json';

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
    lookupByBarcode: (barcode: string) => MedicineMasterItem | undefined;
    isLoading: boolean;
}

const MedicineMasterContext = createContext<MedicineMasterContextType | undefined>(undefined);

export function MedicineMasterProvider({ children }: { children: React.ReactNode }) {
    const [masterIndex, setMasterIndex] = useState<Record<string, MedicineMasterItem>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would fetch from a JSON file URL or IndexedDB
        // For now, we load the imported mock data into a hash map
        const loadData = async () => {
            try {
                console.log('📦 Loading Medicine Master Data...');
                const index: Record<string, MedicineMasterItem> = {};

                // Build O(1) Lookup Map
                mockData.forEach((item) => {
                    // Ensure type is correct
                    const typedItem: MedicineMasterItem = {
                        ...item,
                        type: (item.type as 'OTC' | 'RX')
                    };
                    index[item.barcode] = typedItem;
                });

                setMasterIndex(index);
                console.log(`✅ Loaded ${Object.keys(index).length} items into Master Index`);
            } catch (error) {
                console.error('❌ Failed to load Medicine Master:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Simulate async load
        setTimeout(loadData, 100);
    }, []);

    const lookupByBarcode = (barcode: string): MedicineMasterItem | undefined => {
        return masterIndex[barcode];
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
