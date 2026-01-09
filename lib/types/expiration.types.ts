/**
 * Subscription Expiration Types
 * For alert system and access control
 */

export type SubscriptionStatus =
    | 'TRIAL_ACTIVE'
    | 'TRIAL_EXPIRED'
    | 'ACTIVE'
    | 'EXPIRED'
    | 'CANCELLED';

export type AlertSeverity =
    | 'info'      // 7 days - subtle blue
    | 'warning'   // 3 days - yellow
    | 'error'     // 1 day - orange
    | 'critical'; // Expired - red

export interface ExpirationAlert {
    severity: AlertSeverity;
    title: string;
    message: string;
    action: ExpirationAction;
    dismissible: boolean;
}

export interface ExpirationAction {
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface GracePeriodInfo {
    isInGracePeriod: boolean;
    graceDaysLeft: number;
    graceEndsAt: Date | null;
}

export interface SubscriptionExpirationData {
    status: SubscriptionStatus;
    expiresAt: Date;
    daysUntilExpiry: number;
    gracePeriod: GracePeriodInfo;
    autoRenewEnabled: boolean;
}
