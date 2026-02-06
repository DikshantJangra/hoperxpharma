const patientRepository = require('../../repositories/patientRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

function bucketBillRange(avgBill) {
    if (!avgBill || avgBill <= 0) return '—';
    const buckets = [
        [0, 199],
        [200, 399],
        [400, 699],
        [700, 999],
        [1000, 1999],
        [2000, 4999],
        [5000, 9999],
    ];
    for (const [min, max] of buckets) {
        if (avgBill >= min && avgBill <= max) {
            return `₹${min}–₹${max}`;
        }
    }
    return '₹10,000+';
}

function daysBetween(dateA, dateB) {
    if (!dateA || !dateB) return null;
    const diffMs = Math.abs(new Date(dateB).getTime() - new Date(dateA).getTime());
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function deriveLifecycleStage({ visitCount, firstVisitAt }, policy, patient) {
    let stage = 'IDENTIFIED';
    const daysSinceFirst = firstVisitAt ? daysBetween(firstVisitAt, new Date()) : 0;

    if (visitCount >= policy.minVisitsEstablished) {
        stage = 'ESTABLISHED';
    }
    if (visitCount >= policy.minVisitsTrusted && daysSinceFirst >= policy.minDaysSinceFirstVisit) {
        stage = 'TRUSTED';
    }
    if (patient.creditEnabled) {
        stage = 'CREDIT_ELIGIBLE';
    }

    return stage;
}

function calculateTrustScore({ visitCount, onTimeRate, daysSinceFirst, daysSinceLast }) {
    const base = 300;

    // 1. Punctuality (Max 300) - Heavy Weight
    const punctualityScore = onTimeRate !== null ? Math.round(onTimeRate * 300) : 150; // Neutral if no history

    // 2. Longevity (Max 150)
    const longevityScore = Math.min(150, Math.floor((daysSinceFirst || 0) / 2)); // reach max in ~300 days

    // 3. Recency & Activity (Max 100)
    const recencyScore = daysSinceLast !== null ? Math.max(0, 100 - (daysSinceLast * 2)) : 0;

    // 4. Volume/Visit Depth (Max 50)
    const volumeScore = Math.min(50, (visitCount || 0) * 5);

    const total = base + punctualityScore + longevityScore + recencyScore + volumeScore;

    let label = 'ESTABLISHING';
    if (total > 800) label = 'EXCEPTIONAL';
    else if (total > 700) label = 'HIGH';
    else if (total > 550) label = 'GOOD';
    else if (total > 450) label = 'MODERATE';
    else label = 'LOW';

    return {
        score: Math.min(900, total),
        label,
        factors: {
            punctuality: punctualityScore,
            longevity: longevityScore,
            recency: recencyScore,
            volume: volumeScore
        }
    };
}

function deriveSystemTrust({ visitCount, onTimeRate }, policy) {
    if (visitCount >= policy.minVisitsTrusted && onTimeRate !== null && onTimeRate >= policy.minOnTimeRate) {
        return 'HIGH';
    }
    if (visitCount >= policy.minVisitsEstablished) {
        return 'MEDIUM';
    }
    return 'LOW';
}

function calculateProfileStrength({ visitCount, daysSinceFirst, patient }) {
    let score = 0;
    const details = [];

    // Basic info score (up to 40)
    if (patient.email) { score += 10; details.push('Email verified'); }
    if (patient.addressLine1) { score += 10; details.push('Address provided'); }
    if (patient.dateOfBirth) { score += 10; details.push('DOB verified'); }
    if (patient.emergencyContactName) { score += 10; details.push('Emergency contact'); }

    // Relationship score (up to 60)
    const visitScore = Math.min(40, visitCount * 5);
    const timeScore = Math.min(20, Math.floor(daysSinceFirst / 10));

    score += (visitScore + timeScore);

    let description = "Establishing Profile";
    let tier = "New Patient";

    if (score > 90) { description = "Elite Store Member"; tier = "Brand Champion"; }
    else if (score > 75) { description = "Highly Engaged Profile"; tier = "Store Regular"; }
    else if (score > 55) { description = "Verified Identity"; tier = "Active Member"; }
    else if (score > 35) { description = "Partial Profile Data"; tier = "Developing"; }

    return {
        score: Math.min(100, score),
        description,
        tier,
        details: details.length > 0 ? details.join(', ') : 'Basic details missing'
    };
}

function calculateProfileAccuracy(patient) {
    const fields = [
        { key: 'firstName', label: 'First Name', weight: 10 },
        { key: 'lastName', label: 'Last Name', weight: 10 },
        { key: 'phoneNumber', label: 'Phone', weight: 20 },
        { key: 'email', label: 'Email', weight: 15 },
        { key: 'addressLine1', label: 'Address Line 1', weight: 15 },
        { key: 'city', label: 'City', weight: 10 },
        { key: 'state', label: 'State', weight: 10 },
        { key: 'dateOfBirth', label: 'Date of Birth', weight: 10 }
    ];
    let score = 0;
    const missing = [];
    fields.forEach(f => {
        if (patient[f.key] && patient[f.key] !== 'WALKIN-CUSTOMER') {
            score += f.weight;
        } else {
            missing.push(f.label);
        }
    });

    return {
        score: Math.min(100, score),
        missing,
        isComplete: score >= 100
    };
}

function buildRiskAssessment({
    overdueCount = 0,
    onTimeRate = null,
    currentBalance = 0,
    effectiveLimit = 0,
    visitCount = 0,
    firstVisitAt = null,
    familyMetrics = null,
    accountCreatedAt = null
}, policy) {
    const reasons = [];
    const blockers = [];
    let riskScore = 100;

    // 1. ACCOUNT LONGEVITY (Essential History)
    // Use first sale date if available, otherwise account creation date
    const historyStart = firstVisitAt || accountCreatedAt;
    const daysSinceStart = historyStart ? daysBetween(historyStart, new Date()) : 0;

    logger.info(`[RiskEngine] Starting assessment for patient. DaysSinceStart: ${daysSinceStart}, Visits: ${visitCount}, Overdue: ${overdueCount}`);

    if (daysSinceStart < 30) {
        riskScore -= 60;
        reasons.push({ code: 'NEW_ACCOUNT', label: 'New Account', detail: `History: ${daysSinceStart} days (Target: >30)` });
        logger.info(`[RiskEngine] Deducted 60 for NEW_ACCOUNT. Score: ${riskScore}`);
    } else if (daysSinceStart < 90) {
        riskScore -= 20;
        reasons.push({ code: 'YOUNG_ACCOUNT', label: 'Developing History', detail: `History: ${daysSinceStart} days (Target: >90)` });
        logger.info(`[RiskEngine] Deducted 20 for YOUNG_ACCOUNT. Score: ${riskScore}`);
    }

    // New: Check for aggressive early utilization
    if (daysSinceStart < 7 && currentBalance > (effectiveLimit / 2)) {
        riskScore -= 40;
        reasons.push({ code: 'AGGRESSIVE_USAGE', label: 'Aggressive Utilization', detail: 'High credit usage on brand new account.' });
        logger.info(`[RiskEngine] Deducted 40 for AGGRESSIVE_USAGE. Score: ${riskScore}`);
    }

    if (visitCount === 0) {
        riskScore -= 70; // Zero visits is a massive risk
        reasons.push({
            code: daysSinceStart < 1 ? 'SHADOW_PROFILE' : 'NO_HISTORY',
            label: daysSinceStart < 1 ? 'Shadow Profile' : 'No Store History',
            detail: daysSinceStart < 1 ? 'Identity created today. Zero trust established.' : 'Establish history with cash payments first.'
        });
        logger.info(`[RiskEngine] Deducted 70 for visitCount 0. Score: ${riskScore}`);
        if (daysSinceStart < 1) riskScore = -100; // Hard fail for brand new profiles
    } else if (visitCount < 3) {
        riskScore -= 30;
        reasons.push({ code: 'LOW_VISITS', label: 'Low Frequency', detail: `Only ${visitCount} visits recorded (Target: >3)` });
        logger.info(`[RiskEngine] Deducted 30 for LOW_VISITS. Score: ${riskScore}`);
    }

    // 2. PAYMENT RELIABILITY
    if (overdueCount > 0) {
        riskScore -= 60;
        reasons.push({ code: 'OVERDUE', label: 'Active Overdue', detail: `${overdueCount} payment(s) currently past due` });
        logger.info(`[RiskEngine] Deducted 60 for OVERDUE. Score: ${riskScore}`);
    }

    if (onTimeRate !== null && onTimeRate < 0.8) {
        riskScore -= 25;
        reasons.push({ code: 'LATE_HISTORY', label: 'Late Payment History', detail: `On-time performance ${Math.round(onTimeRate * 100)}% (Target: >80%)` });
        logger.info(`[RiskEngine] Deducted 25 for LATE_HISTORY. Score: ${riskScore}`);
    }

    // 3. UTILIZATION
    const utilization = effectiveLimit > 0 ? (currentBalance / effectiveLimit) : 0;
    if (utilization >= 0.8) {
        riskScore -= 15;
        reasons.push({ code: 'MAXED_OUT', label: 'High Utilization', detail: `Current credit usage is ${Math.round(utilization * 100)}%` });
        logger.info(`[RiskEngine] Deducted 15 for MAXED_OUT. Score: ${riskScore}`);
    }

    // 4. FAMILY RISK
    if (familyMetrics && familyMetrics.familyOverdueCount > 0) {
        riskScore -= 50;
        reasons.push({ code: 'FAMILY_RISK', label: 'Family Circle Risk', detail: `Household has active overdue payments` });
        logger.info(`[RiskEngine] Deducted 50 for FAMILY_RISK. Score: ${riskScore}`);
    }

    // 5. DETERMINE LEVEL
    let riskLevel = 'LOW';
    if (riskScore <= 40) riskLevel = 'ELEVATED';
    else if (riskScore <= 75) riskLevel = 'MEDIUM';

    // 6. HARD BLOCKERS & OVERRIDES
    if (daysSinceStart < 7 || visitCount === 0) {
        riskLevel = 'ELEVATED';
        logger.info(`[RiskEngine] Forced ELEVATED for new/zero-visit user.`);
    }

    if (overdueCount >= 1 || (familyMetrics && familyMetrics.familyOverdueCount > 0)) {
        if (riskScore < 50) riskLevel = 'ELEVATED';
    }

    logger.info(`[RiskEngine] Final Score: ${riskScore}, Level: ${riskLevel}`);

    return { riskLevel, reasons, blockers, score: Math.max(0, riskScore) };
}

/**
 * Patient Service - Business logic for patient management
 */
class PatientService {
    /**
     * Get all patients with pagination
     */
    async getPatients(filters) {
        // Parse pagination parameters to integers
        const parsedFilters = {
            ...filters,
            page: filters.page ? parseInt(filters.page) : 1,
            limit: filters.limit ? parseInt(filters.limit) : 20,
        };
        const result = await patientRepository.findPatients(parsedFilters);
        const policy = await patientRepository.getStoreCreditPolicy(filters.storeId);

        const patients = (result.patients || []).map(p => {
            const lifecycleStage = deriveLifecycleStage(
                { visitCount: p.visitCount || 0, firstVisitAt: p.firstVisitAt },
                policy,
                p
            );
            return {
                ...p,
                lifecycleStage
            };
        });

        return { patients, total: result.total };
    }

    /**
     * Recalculate Patient Analytics (called after sale/payment/refund)
     * Updates cached fields for fast list queries
     */
    async recalculatePatientAnalytics(patientId, storeId) {
        const patient = await patientRepository.findById(patientId);
        if (!patient || patient.storeId !== storeId) {
            throw ApiError.notFound('Patient not found');
        }

        const policy = await patientRepository.getStoreCreditPolicy(storeId);
        const [metrics, creditMetrics] = await Promise.all([
            patientRepository.getPatientMetrics(patientId, storeId),
            patientRepository.getPatientCreditMetrics(patientId, storeId)
        ]);

        // Calculate analytics
        const visitCount = metrics.visitCount || 0;
        const firstVisitAt = metrics.firstVisitAt || null;
        const lastVisitAt = metrics.lastVisitAt || patient.lastVisitAt;
        const avgBillAmount = metrics.avgBill ? Number(metrics.avgBill).toFixed(2) : null;

        const daysSinceFirst = firstVisitAt ? daysBetween(firstVisitAt, new Date()) : 0;

        const onTimePaymentRate = creditMetrics.creditSalesCount > 0
            ? Number(Math.max(0, 1 - (creditMetrics.overdueCount / creditMetrics.creditSalesCount)).toFixed(4))
            : null;

        // Derive lifecycle and trust
        const lifecycleStage = deriveLifecycleStage({ visitCount, firstVisitAt }, policy, patient);
        const systemTrustLevel = deriveSystemTrust({ visitCount, onTimeRate: onTimePaymentRate }, policy);
        const profileStrength = calculateProfileStrength({ visitCount, daysSinceFirst, patient });

        // Calculate risk
        const { riskLevel } = buildRiskAssessment({
            overdueCount: creditMetrics.overdueCount,
            onTimeRate: onTimePaymentRate,
            currentBalance: Number(patient.currentBalance || 0),
            effectiveLimit: Number(patient.creditLimit || 0)
        }, policy);

        // Update patient with cached values
        const updatedPatient = await patientRepository.update(patientId, {
            lifecycleStage,
            profileStrength,
            lastVisitAt,
            visitCount,
            firstVisitAt,
            avgBillAmount,
            onTimePaymentRate,
            systemTrustLevel,
            riskLevel,
            profileLastCalculatedAt: new Date()
        });

        logger.info(`Analytics recalculated for patient ${patientId}: ${lifecycleStage}, ${systemTrustLevel} trust, ${riskLevel} risk`);
        return updatedPatient;
    }

    /**
     * Get patient by ID
     */
    async getPatientById(id, storeId) {
        const patient = await patientRepository.findById(id);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }

        if (storeId && patient.storeId !== storeId) {
            throw ApiError.forbidden('Access to this patient is denied');
        }

        return patient;
    }

    /**
     * Patient insights (decision surface)
     */
    async getPatientInsights(id, storeId) {
        const patient = await this.getPatientById(id, storeId);
        const policy = await patientRepository.getStoreCreditPolicy(storeId);

        const [metrics, creditMetrics, refundStats] = await Promise.all([
            patientRepository.getPatientMetrics(id, storeId),
            patientRepository.getPatientCreditMetrics(id, storeId),
            patientRepository.getPatientRefundStats(id, storeId)
        ]);

        const daysSinceFirst = metrics.firstVisitAt ? daysBetween(metrics.firstVisitAt, new Date()) : 0;
        const purchaseFrequency = metrics.visitCount > 0 && daysSinceFirst > 0
            ? Number((metrics.visitCount / (daysSinceFirst / 30)).toFixed(2))
            : 0;

        const onTimeRate = creditMetrics.creditSalesCount > 0
            ? Math.max(0, 1 - (creditMetrics.overdueCount / creditMetrics.creditSalesCount))
            : null;

        const daysSinceLast = metrics.lastVisitAt ? daysBetween(metrics.lastVisitAt, new Date()) : null;

        const lifecycleStage = deriveLifecycleStage(metrics, policy, patient);

        const trustData = calculateTrustScore({
            visitCount: metrics.visitCount,
            onTimeRate,
            daysSinceFirst,
            daysSinceLast
        });

        const sharedPhoneCount = await patientRepository.getPhoneShareCount(
            storeId,
            patient.phoneNumber,
            patient.id
        );

        const refundRatio = metrics.visitCount > 0
            ? Number((refundStats.refundCount / metrics.visitCount).toFixed(2))
            : 0;

        const profileData = calculateProfileStrength({
            visitCount: metrics.visitCount,
            daysSinceFirst,
            patient
        });

        const visitInterval = metrics.visitCount > 1 && daysSinceFirst > 0
            ? Math.round(daysSinceFirst / metrics.visitCount)
            : null;

        return {
            identity: {
                id: patient.id,
                name: `${patient.firstName} ${patient.lastName}`.trim(),
                phoneNumber: patient.phoneNumber,
                lifecycleStage,
                manualTrustLevel: patient.manualTrustLevel,
                systemTrust: trustData.label,
                systemTrustScore: trustData.score,
                trustFactors: trustData.factors,
                profileStrength: profileData.score,
                profileDescription: profileData.description,
                profileTier: profileData.tier,
                profileDetails: profileData.details,
                sharedPhone: sharedPhoneCount > 0
            },
            relationship: {
                visitCount: metrics.visitCount,
                firstVisitAt: metrics.firstVisitAt,
                lastVisitAt: metrics.lastVisitAt || patient.lastVisitAt,
                purchaseFrequency,
                visitInterval,
                totalSpent: metrics.totalSpent,
                avgBill: metrics.avgBill,
                avgBillRange: bucketBillRange(metrics.avgBill)
            },
            paymentBehavior: {
                creditSalesCount: creditMetrics.creditSalesCount,
                onTimeRate,
                overdueCount: creditMetrics.overdueCount,
                refundRatio
            },
            creditUsage: {
                currentBalance: Number(patient.currentBalance || 0),
                creditLimit: Number(patient.creditLimit || 0),
                creditEnabled: patient.creditEnabled,
                creditSuspendedAt: patient.creditSuspendedAt,
                recentCreditSales: creditMetrics.recentCreditSales,
                priorCreditSales: creditMetrics.priorCreditSales
            }
        };
    }

    /**
     * Credit assessment for POS
     */
    async getCreditAssessment(id, storeId, saleTotal = 0) {
        const patient = await this.getPatientById(id, storeId);
        const policy = await patientRepository.getStoreCreditPolicy(storeId);
        const metrics = await patientRepository.getPatientMetrics(id, storeId);
        const creditMetrics = await patientRepository.getPatientCreditMetrics(id, storeId);
        const familyMetrics = await patientRepository.getPatientFamilyMetrics(id, storeId);

        const onTimeRate = creditMetrics.creditSalesCount > 0
            ? Math.max(0, 1 - (creditMetrics.overdueCount / creditMetrics.creditSalesCount))
            : null;

        const lifecycleStage = deriveLifecycleStage(metrics, policy, patient);

        let stageMax = Number(policy.maxCreditIdentified || 0);
        if (lifecycleStage === 'ESTABLISHED') stageMax = Number(policy.maxCreditEstablished);
        if (lifecycleStage === 'TRUSTED') stageMax = Number(policy.maxCreditTrusted);
        if (lifecycleStage === 'CREDIT_ELIGIBLE') stageMax = Number(policy.maxCreditTrusted);

        const customerLimit = Number(patient.creditLimit || 0);
        const effectiveLimit = Math.min(customerLimit || 0, stageMax || 0) || customerLimit || stageMax || 0;
        const currentBalance = Number(patient.currentBalance || 0);

        // Family risk check: If family balance is close to aggregated limit?
        // (Optional: Implement family limit logic here if needed)

        const availableCredit = Math.max(0, effectiveLimit - currentBalance);

        const { riskLevel, reasons, blockers, score } = buildRiskAssessment(
            {
                overdueCount: creditMetrics.overdueCount,
                onTimeRate,
                currentBalance,
                effectiveLimit,
                visitCount: metrics.visitCount,
                firstVisitAt: metrics.firstVisitAt, // Crucial for new user check
                familyMetrics,
                accountCreatedAt: patient.createdAt
            },
            policy
        );

        const finalBlockers = [...blockers];

        if (!patient.creditEnabled) {
            finalBlockers.push({ code: 'CREDIT_DISABLED', label: 'Credit not enabled', detail: 'Enable credit for this customer to use pay later.' });
        }
        if (patient.creditSuspendedAt) {
            finalBlockers.push({ code: 'CREDIT_SUSPENDED', label: 'Credit is suspended', detail: 'Credit access is temporarily suspended.' });
        }
        if (effectiveLimit <= 0) {
            finalBlockers.push({ code: 'NO_LIMIT', label: 'No credit limit set', detail: 'Set a credit limit to allow pay later.' });
        }
        if (creditMetrics.overdueCount >= policy.autoSuspendAfterLates) {
            finalBlockers.push({ code: 'AUTO_SUSPEND', label: 'Too many late repayments', detail: `Late count reached ${policy.autoSuspendAfterLates}.` });
        }
        if (availableCredit < saleTotal) {
            finalBlockers.push({ code: 'LIMIT_EXCEEDED', label: 'Insufficient available credit', detail: `Available ₹${availableCredit.toFixed(0)} for ₹${saleTotal}.` });
        }

        const profileAccuracy = calculateProfileAccuracy(patient);

        return {
            lifecycleStage,
            systemTrust: deriveSystemTrust({ visitCount: metrics.visitCount, onTimeRate }, policy),
            riskLevel,
            reasons,
            blockers: finalBlockers,
            canUseCredit: finalBlockers.length === 0,
            creditLimit: effectiveLimit,
            availableCredit,
            currentBalance,
            onTimeRate,
            onTimeCount: creditMetrics.onTimeCount || 0,
            score: score || 0,
            profileAccuracy,
            overdueCount: creditMetrics.overdueCount,
            creditSalesCount: creditMetrics.creditSalesCount,
            familyMetrics,

            spendMetrics: {
                totalSpent: metrics.totalSpent,
                visitCount: metrics.visitCount,
                avgBill: metrics.avgBill,
                lastVisitAt: metrics.lastVisitAt
            }
        };
    }

    async getStoreCreditPolicy(storeId) {
        return await patientRepository.getStoreCreditPolicy(storeId);
    }

    async updateStoreCreditPolicy(storeId, data) {
        return await patientRepository.updateStoreCreditPolicy(storeId, data);
    }

    /**
     * Search patients (for autocomplete)
     */
    async searchPatients(storeId, query) {
        const patients = await patientRepository.searchPatients(storeId, query);
        return patients;
    }

    /**
     * Create new patient
     */
    async createPatient(patientData) {
        // Check if patient with same phone number exists
        const existingPatient = await patientRepository.findByPhoneNumber(
            patientData.storeId,
            patientData.phoneNumber
        );

        if (existingPatient) {
            // Log warning but allow creation (phone sharing is common in families)
            logger.warn(`[SHARED_PHONE] Creating new patient with phone ${patientData.phoneNumber} already used by ${existingPatient.firstName} ${existingPatient.lastName} (ID: ${existingPatient.id})`);

            // Optionally throw with existing patient info for deduplication UI
            // Uncomment if you want to block creation:
            // throw ApiError.conflict('Patient with this phone number already exists', { existingPatient });
        }

        const patient = await patientRepository.create(patientData);
        logger.info(`Patient created: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);

        return patient;
    }

    /**
     * Update patient
     */
    async updatePatient(id, patientData, storeId) {
        const existingPatient = await patientRepository.findById(id);

        if (!existingPatient) {
            throw ApiError.notFound('Patient not found');
        }

        if (storeId && existingPatient.storeId !== storeId) {
            throw ApiError.forbidden('Access to update this patient is denied');
        }

        // If phone number is being updated, check for duplicates
        if (patientData.phoneNumber && patientData.phoneNumber !== existingPatient.phoneNumber) {
            const duplicate = await patientRepository.findByPhoneNumber(
                existingPatient.storeId,
                patientData.phoneNumber
            );

            if (duplicate) {
                logger.warn(`[SHARED_PHONE] Updating patient ${id} to phone already used by ${duplicate.firstName} ${duplicate.lastName}`);
                // Optionally block: throw ApiError.conflict('Patient with this phone number already exists');
            }
        }

        // CREDIT OVERRIDE LOGGING: Track manual credit changes
        const creditChanges = [];

        if (patientData.creditEnabled !== undefined && patientData.creditEnabled !== existingPatient.creditEnabled) {
            creditChanges.push({
                field: 'creditEnabled',
                oldValue: existingPatient.creditEnabled,
                newValue: patientData.creditEnabled
            });
        }

        if (patientData.creditLimit !== undefined && Number(patientData.creditLimit) !== Number(existingPatient.creditLimit)) {
            creditChanges.push({
                field: 'creditLimit',
                oldValue: parseFloat(existingPatient.creditLimit),
                newValue: Number(patientData.creditLimit)
            });
        }

        if (patientData.manualTrustLevel !== undefined && patientData.manualTrustLevel !== existingPatient.manualTrustLevel) {
            creditChanges.push({
                field: 'manualTrustLevel',
                oldValue: existingPatient.manualTrustLevel,
                newValue: patientData.manualTrustLevel
            });
        }

        // Log credit overrides for audit
        if (creditChanges.length > 0) {
            logger.warn(`[CREDIT_OVERRIDE] Patient ${id} (${existingPatient.firstName} ${existingPatient.lastName}) - Changes: ${JSON.stringify(creditChanges)}`);
        }

        const patient = await patientRepository.update(id, patientData);
        logger.info(`Patient updated: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);

        return patient;
    }

    /**
     * Delete patient (soft delete for GDPR compliance)
     */
    async deletePatient(id, deletedBy, storeId) {
        const existingPatient = await patientRepository.findById(id);

        if (!existingPatient) {
            throw ApiError.notFound('Patient not found');
        }

        if (storeId && existingPatient.storeId !== storeId) {
            throw ApiError.forbidden('Access to delete this patient is denied');
        }

        await patientRepository.softDelete(id, deletedBy);
        logger.info(`Patient deleted: ${existingPatient.firstName} ${existingPatient.lastName} (ID: ${id})`);

        return { success: true, message: 'Patient deleted successfully' };
    }

    /**
     * Create patient consent
     */
    async createConsent(consentData) {
        const patient = await patientRepository.findById(consentData.patientId);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }

        const consent = await patientRepository.createConsent(consentData);
        logger.info(`Consent created for patient ${consentData.patientId}: ${consent.type}`);

        return consent;
    }

    /**
     * Withdraw consent
     */
    async withdrawConsent(consentId) {
        const consent = await patientRepository.updateConsent(consentId, 'Withdrawn');
        logger.info(`Consent withdrawn: ${consentId}`);

        return consent;
    }

    /**
     * Get patient consents
     */
    async getPatientConsents(patientId, storeId) {
        // Verify ownership
        await this.getPatientById(patientId, storeId);
        return await patientRepository.getConsents(patientId);
    }

    /**
     * Create patient insurance
     */
    async createInsurance(insuranceData) {
        const patient = await patientRepository.findById(insuranceData.patientId);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }

        const insurance = await patientRepository.createInsurance(insuranceData);
        logger.info(`Insurance created for patient ${insuranceData.patientId}`);

        return insurance;
    }

    /**
     * Update patient insurance
     */
    async updateInsurance(id, insuranceData) {
        const insurance = await patientRepository.updateInsurance(id, insuranceData);
        logger.info(`Insurance updated: ${id}`);

        return insurance;
    }

    /**
     * Get patient statistics
     */
    async getPatientStats(storeId) {
        return await patientRepository.getPatientStats(storeId);
    }

    /**
     * Get patient history timeline
     */
    async getPatientHistory(patientId, storeId, filters) {
        // Verify ownership
        await this.getPatientById(patientId, storeId);

        const historyData = await patientRepository.getPatientHistory(patientId, filters);

        if (!historyData) {
            throw ApiError.notFound('Patient not found');
        }

        // Format history into timeline events
        const events = [];

        // Add prescription events
        historyData.prescriptions.forEach((prescription) => {
            events.push({
                eventId: `prescription_${prescription.id}`,
                type: 'prescription',
                date: prescription.createdAt,
                title: 'Prescription Created',
                description: `${prescription.prescriptionItems?.length || 0} medication(s) prescribed by Dr. ${prescription.prescriber?.name || "Unknown"}`,
                status: prescription.status,
                data: prescription,
            });
        });

        // Add sale events
        historyData.sales.forEach((sale) => {
            const isUnpaid = sale.paymentStatus !== 'PAID';
            events.push({
                eventId: `sale_${sale.id}`,
                type: 'sale',
                date: sale.createdAt,
                title: isUnpaid ? 'Unpaid Purchase' : 'Purchase Made',
                description: `${sale.items?.length || 0} item(s) purchased - ₹${Number(sale.total).toFixed(2)}${isUnpaid ? ` (Balance: ₹${Number(sale.balance).toFixed(2)})` : ''}`,
                status: isUnpaid ? 'pending' : 'completed',
                data: sale,
            });
        });

        // Add consent events
        historyData.consents.forEach((consent) => {
            events.push({
                eventId: `consent_${consent.id}`,
                type: 'consent',
                date: consent.grantedDate,
                title: `Consent: ${consent.type}`,
                description: `Status: ${consent.status}`,
                status: consent.status,
                data: consent,
            });
        });

        // Add adherence events
        historyData.adherence.forEach((adherence) => {
            events.push({
                eventId: `adherence_${adherence.id}`,
                type: 'adherence',
                date: adherence.actualRefillDate || adherence.expectedRefillDate,
                title: 'Medication Refill',
                description: `Adherence rate: ${Math.round(adherence.adherenceRate * 100)}%`,
                status: adherence.actualRefillDate ? 'completed' : 'pending',
                data: adherence,
            });
        });

        // Sort events by date (most recent first)
        events.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Group events by date
        const groupedEvents = {};
        events.forEach((event) => {
            const dateKey = new Date(event.date).toISOString().split('T')[0];
            if (!groupedEvents[dateKey]) {
                groupedEvents[dateKey] = [];
            }
            groupedEvents[dateKey].push(event);
        });

        return {
            patient: historyData.patient,
            events: {
                all: events,
                groups: Object.entries(groupedEvents).map(([date, items]) => ({
                    date,
                    events: items,
                })),
            },
        };
    }

    /**
     * Get refills due
     */
    async getRefillsDue(storeId, filters) {
        return await patientRepository.getRefillsDue(storeId, filters);
    }

    /**
     * Process a refill
     */
    async processRefill(patientId, refillData) {
        const patient = await patientRepository.findById(patientId);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }

        // Use transaction to ensure atomicity
        const result = await patientRepository.processRefillTransaction({
            patientId,
            storeId: refillData.storeId || patient.storeId,
            prescriptionId: refillData.prescriptionId,
            expectedRefillDate: refillData.expectedRefillDate,
            adherenceRate: refillData.adherenceRate || 1.0,
            items: refillData.items || [], // Array of { drugId, quantity, batchId }
            soldBy: refillData.soldBy,
            paymentMethod: refillData.paymentMethod || 'CASH',
        });

        logger.info(`Refill processed for patient ${patientId} - Sale ID: ${result.sale?.id || 'N/A'}`);

        return result;
    }

    /**
     * Get adherence data for a patient
     */
    async getAdherence(patientId, storeId) {
        const patient = await patientRepository.findById(patientId);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }

        if (storeId && patient.storeId !== storeId) {
            throw ApiError.forbidden('Access to this patient is denied');
        }

        const [adherenceRecords, stats] = await Promise.all([
            patientRepository.getAdherence(patientId),
            patientRepository.getAdherenceStats(patientId),
        ]);

        return {
            records: adherenceRecords,
            stats,
        };
    }

    /**
     * Record adherence
     */
    async recordAdherence(patientId, adherenceData) {
        const patient = await patientRepository.findById(patientId);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }

        const adherence = await patientRepository.createAdherence({
            ...adherenceData,
            patientId,
        });

        logger.info(`Adherence recorded for patient ${patientId}`);

        return adherence;
    }

    /**
     * Get all consents (for consents page)
     */
    async getAllConsents(storeId, filters) {
        // Parse pagination parameters to integers
        const parsedFilters = {
            ...filters,
            page: filters.page ? parseInt(filters.page) : 1,
            limit: filters.limit ? parseInt(filters.limit) : 20,
        };

        return await patientRepository.getAllConsents(storeId, parsedFilters);
    }

    /**
     * Get Customer Ledger History
     */
    async getLedger(patientId, storeId, filters) {
        // Verify ownership
        await this.getPatientById(patientId, storeId);

        const parsedFilters = {
            ...filters,
            page: filters.page ? parseInt(filters.page) : 1,
            limit: filters.limit ? parseInt(filters.limit) : 20,
        };

        return await patientRepository.getLedger({
            patientId,
            storeId,
            ...parsedFilters
        });
    }

    /**
     * Process Customer Payment (Debt Settlement)
     */
    async processCustomerPayment(patientId, paymentData, storeId) {
        // Verify ownership
        await this.getPatientById(patientId, storeId);

        const { amount, paymentMethod, notes, allocations } = paymentData;

        if (!amount || amount <= 0) {
            throw ApiError.badRequest('Invalid payment amount');
        }

        const ledgerEntry = await patientRepository.customerPayment(
            storeId,
            patientId,
            amount,
            paymentMethod || 'CASH',
            notes,
            allocations
        );

        logger.info(`Customer Payment processed: ${amount} for Patient ${patientId}`);

        // Recalculate Patient Analytics (Customer Profile System)
        this.recalculatePatientAnalytics(patientId, storeId)
            .catch(err => logger.error(`[Analytics] Failed to recalculate after payment for patient ${patientId}`, err));

        return ledgerEntry;
    }

    /**
     * Get Debtors (Patients with outstanding balance)
     */
    async getDebtors(storeId, { page, limit, search, sort }) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;

        return await patientRepository.findDebtors({
            storeId,
            page: pageNum,
            limit: limitNum,
            search,
            sortConfig: sort
        });
    }

    /**
     * Get Unpaid Invoices for Patient
     */
    async getUnpaidInvoices(patientId, storeId) {
        // Verify ownership
        await this.getPatientById(patientId, storeId);

        const saleRepository = require('../../repositories/saleRepository');
        return await saleRepository.getUnpaidInvoices(patientId);
    }

    async syncPatientBalance(patientId, storeId) {
        await this.getPatientById(patientId, storeId); // Verify ownership
        return await patientRepository.recalculatePatientBalance(patientId);
    }
}

module.exports = new PatientService();
