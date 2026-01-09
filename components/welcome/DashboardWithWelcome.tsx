/**
 * Example Integration: Premium Welcome in Dashboard
 * 
 * This shows how to integrate the welcome experience into your main dashboard/layout.
 * The welcome will automatically show once after successful payment.
 */

'use client';

import { useWelcomeExperience } from '@/lib/hooks/useWelcomeExperience';
import { PremiumWelcome } from '@/components/welcome';

export function DashboardWithWelcome({ children }: { children: React.ReactNode }) {
    const { shouldShow, subscriptionData, markAsShown, skipWelcome } = useWelcomeExperience();

    return (
        <>
            {/* Main Dashboard Content */}
            {children}

            {/* Premium Welcome Overlay - Shows once after payment */}
            {shouldShow && subscriptionData && (
                <PremiumWelcome
                    subscriptionData={subscriptionData}
                    onComplete={markAsShown}
                    onSkip={skipWelcome}
                />
            )}
        </>
    );
}

/**
 * Usage in app/(main)/layout.tsx or app/(main)/dashboard/page.tsx:
 * 
 * import { DashboardWithWelcome } from '@/components/welcome/DashboardWithWelcome';
 * 
 * export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <DashboardWithWelcome>
 *       {children}
 *     </DashboardWithWelcome>
 *   );
 * }
 */
