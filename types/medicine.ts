// Medicine Master schema (from MedicineMaster table)
export interface Medicine {
    id: string;
    name: string;
    genericName?: string;
    strength?: string;
    form?: string;
    manufacturerName?: string;
    schedule?: string;
    compositionText?: string;
    primaryBarcode?: string;
    status?: string;
    usageCount?: number;
    requiresPrescription?: boolean;
    price?: number; // Optional - may not be in master data
}

export interface MedicineSearchIndex {
    version: string;
    generatedAt: string;
    totalRecords: number;
    medicines: Medicine[];
}

export interface MedicineSearchResult extends Medicine {
    score: number;
    match?: {
        name?: string[];
        composition?: string[];
        manufacturer?: string[];
    };
}
