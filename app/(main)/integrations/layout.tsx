'use client';

import { Feature } from '@/lib/constants/billing-states';
import { FeatureGate } from '@/components/billing/FeatureGate';

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGate feature={Feature.AUTOMATION}>
            {children}
        </FeatureGate>
    );
}
