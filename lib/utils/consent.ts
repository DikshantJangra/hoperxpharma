import { patientsApi, PatientConsent } from '../api/patients';

export class ConsentError extends Error {
    constructor(
        message: string,
        public consentType: string,
        public patientId: string
    ) {
        super(message);
        this.name = 'ConsentError';
    }
}

export type ConsentType = 'WhatsApp' | 'SMS' | 'Email' | 'Marketing' | 'DataSharing';

/**
 * Check if patient has active consent for a specific type
 */
export async function checkConsent(
    patientId: string,
    consentType: ConsentType
): Promise<boolean> {
    try {
        const consents = await patientsApi.getPatientConsents(patientId);

        const relevantConsent = consents.find(
            (c: PatientConsent) => c.type === consentType && c.status === 'Active'
        );

        if (!relevantConsent) {
            return false;
        }

        // Check if consent has expired
        if (relevantConsent.expiryDate) {
            const expiryDate = new Date(relevantConsent.expiryDate);
            if (expiryDate < new Date()) {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error checking consent:', error);
        return false;
    }
}

/**
 * Enforce consent before performing an action
 * Throws ConsentError if consent is not granted
 */
export async function enforceConsent(
    patientId: string,
    consentType: ConsentType,
    actionDescription?: string
): Promise<void> {
    const hasConsent = await checkConsent(patientId, consentType);

    if (!hasConsent) {
        throw new ConsentError(
            `Patient has not consented to ${consentType}${actionDescription ? ` for ${actionDescription}` : ''}`,
            consentType,
            patientId
        );
    }
}

/**
 * Get all active consents for a patient
 */
export async function getActiveConsents(patientId: string): Promise<ConsentType[]> {
    try {
        const consents = await patientsApi.getPatientConsents(patientId);

        const activeConsents = consents
            .filter((c: PatientConsent) => {
                if (c.status !== 'Active') return false;

                // Check expiry
                if (c.expiryDate) {
                    const expiryDate = new Date(c.expiryDate);
                    if (expiryDate < new Date()) return false;
                }

                return true;
            })
            .map((c: PatientConsent) => c.type as ConsentType);

        return activeConsents;
    } catch (error) {
        console.error('Error getting active consents:', error);
        return [];
    }
}

/**
 * Check multiple consent types at once
 */
export async function checkMultipleConsents(
    patientId: string,
    consentTypes: ConsentType[]
): Promise<Record<ConsentType, boolean>> {
    const results: Record<string, boolean> = {};

    await Promise.all(
        consentTypes.map(async (type) => {
            results[type] = await checkConsent(patientId, type);
        })
    );

    return results as Record<ConsentType, boolean>;
}

/**
 * Get consent status with details
 */
export async function getConsentStatus(
    patientId: string,
    consentType: ConsentType
): Promise<{
    hasConsent: boolean;
    consent: PatientConsent | null;
    isExpired: boolean;
    expiresIn: number | null; // days until expiry
}> {
    try {
        const consents = await patientsApi.getPatientConsents(patientId);

        const consent = consents.find(
            (c: PatientConsent) => c.type === consentType
        );

        if (!consent) {
            return {
                hasConsent: false,
                consent: null,
                isExpired: false,
                expiresIn: null,
            };
        }

        const isActive = consent.status === 'Active';
        let isExpired = false;
        let expiresIn: number | null = null;

        if (consent.expiryDate) {
            const expiryDate = new Date(consent.expiryDate);
            const now = new Date();
            isExpired = expiryDate < now;

            if (!isExpired) {
                const diffTime = expiryDate.getTime() - now.getTime();
                expiresIn = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        return {
            hasConsent: isActive && !isExpired,
            consent,
            isExpired,
            expiresIn,
        };
    } catch (error) {
        console.error('Error getting consent status:', error);
        return {
            hasConsent: false,
            consent: null,
            isExpired: false,
            expiresIn: null,
        };
    }
}
