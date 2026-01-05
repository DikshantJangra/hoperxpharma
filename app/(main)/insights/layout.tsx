'use client';

import { Feature } from '@/lib/constants/billing-states';
import { FeatureGate } from '@/components/billing/FeatureGate';

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGate feature={Feature.ADVANCED_REPORTS}>
            {children}
        </FeatureGate>
    );
}
