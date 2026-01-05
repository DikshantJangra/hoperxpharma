'use client';

import { Feature } from '@/lib/constants/billing-states';
import { FeatureGate } from '@/components/billing/FeatureGate';

export default function EngageLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGate feature={Feature.LOYALTY}>
            {children}
        </FeatureGate>
    );
}
