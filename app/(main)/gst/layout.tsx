'use client';

import { Feature } from '@/lib/constants/billing-states';
import { FeatureGate } from '@/components/billing/FeatureGate';

export default function GSTLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGate feature={Feature.REPORTS}>
            {children}
        </FeatureGate>
    );
}
