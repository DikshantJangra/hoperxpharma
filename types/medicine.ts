export interface Medicine {
    id: string;
    name: string;
    price: number;
    manufacturer: string;
    packSize: string;
    composition: string;
    type: string;
    discontinued: boolean;
}

export interface MedicineSearchIndex {
    version: string;
    generatedAt: string;
    totalRecords: number;
    medicines: Medicine[];
}

export interface MedicineSearchResult extends Medicine {
    score: number;
    match: {
        name?: string[];
        composition?: string[];
        manufacturer?: string[];
    };
}
