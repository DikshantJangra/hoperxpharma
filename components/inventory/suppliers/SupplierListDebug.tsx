'use client';

import React, { useState, useEffect } from 'react';

export default function SupplierListDebug() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { supplierApi } = await import('@/lib/api/supplier');
                const response = await supplierApi.getSuppliers({ page: 1, limit: 20 });
                
                console.log('DEBUG - Full Response:', JSON.stringify(response, null, 2));
                
                if (response.success && response.data) {
                    setSuppliers(response.data);
                }
            } catch (error) {
                console.error('DEBUG - Error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>Loading: {isLoading ? 'YES' : 'NO'}</p>
            <p>Suppliers Count: {suppliers.length}</p>
            <pre className="mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(suppliers, null, 2)}
            </pre>
        </div>
    );
}
