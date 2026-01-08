'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { userApi } from '@/lib/api/user';
import { PricingTiers } from '@/components/pricing/PricingTiers';
import { FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const storeData = await userApi.getPrimaryStore();
            setStore(storeData);
        } catch (error) {
            console.error('Failed to load store:', error);
        } finally {
            setLoading(false);
        }
    };

    const vertical = store?.businessType === 'Retail Pharmacy' ? 'retail' :
                     store?.businessType === 'Wholesale Pharmacy' ? 'wholesale' :
                     store?.businessType === 'Hospital Pharmacy' ? 'hospital' : 'retail';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Upgrade Your Pharmacy
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the perfect plan for your {store?.businessType || 'pharmacy'}
                    </p>
                </div>

                {store?.id && (
                    <PricingTiers
                        vertical={vertical}
                        storeId={store.id}
                        onPaymentSuccess={() => {
                            router.push('/store/profile?tab=billing');
                        }}
                    />
                )}
            </div>
        </div>
    );
}
