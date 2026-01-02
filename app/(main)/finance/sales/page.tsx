'use client';

import SalesPage from '@/components/Finance/Sales/SalesPage';
import { useAuthStore } from '@/lib/store/auth-store';

export default function FinanceSalesPage() {
  const { primaryStore } = useAuthStore();

  if (!primaryStore?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading store information...</p>
      </div>
    );
  }

  return <SalesPage storeId={primaryStore.id} />;
}
