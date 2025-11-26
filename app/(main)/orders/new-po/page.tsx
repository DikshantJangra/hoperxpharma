'use client';

import React from 'react';
import NewPOPage from '@/components/orders/NewPOPage';
import { useAuthStore } from '@/lib/store/auth-store';
import { redirect, useSearchParams } from 'next/navigation';

export default function NewPurchaseOrderPage() {
  const { user, primaryStore, isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const poId = searchParams.get('id');

  if (!isAuthenticated || !user) {
    redirect('/login');
  }

  if (!primaryStore) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Store Found</h2>
          <p className="text-gray-600">Please complete onboarding to set up your store first.</p>
          <a href="/onboarding" className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Complete Onboarding
          </a>
        </div>
      </div>
    );
  }

  return <NewPOPage storeId={primaryStore.id} poId={poId || undefined} />;
}