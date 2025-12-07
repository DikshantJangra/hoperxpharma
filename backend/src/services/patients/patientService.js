const patientRepository = require('../../repositories/patientRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

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

        return await patientRepository.findPatients(parsedFilters);
    }

    /**
     * Get patient by ID
     */
    async getPatientById(id) {
        const patient = await patientRepository.findById(id);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
        }

        return patient;
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
            throw ApiError.conflict('Patient with this phone number already exists');
        }

        const patient = await patientRepository.create(patientData);
        logger.info(`Patient created: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);

        return patient;
    }

    /**
     * Update patient
     */
    async updatePatient(id, patientData) {
        const existingPatient = await patientRepository.findById(id);

        if (!existingPatient) {
            throw ApiError.notFound('Patient not found');
        }

        // If phone number is being updated, check for duplicates
        if (patientData.phoneNumber && patientData.phoneNumber !== existingPatient.phoneNumber) {
            const duplicate = await patientRepository.findByPhoneNumber(
                existingPatient.storeId,
                patientData.phoneNumber
            );

            if (duplicate) {
                throw ApiError.conflict('Patient with this phone number already exists');
            }
        }

        const patient = await patientRepository.update(id, patientData);
        logger.info(`Patient updated: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);

        return patient;
    }

    /**
     * Delete patient (soft delete for GDPR compliance)
     */
    async deletePatient(id, deletedBy) {
        const existingPatient = await patientRepository.findById(id);

        if (!existingPatient) {
            throw ApiError.notFound('Patient not found');
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
    async getPatientConsents(patientId) {
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
    async getPatientHistory(patientId, filters) {
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
                description: `${prescription.items.length} medication(s) prescribed by Dr. ${prescription.prescriber.name}`,
                status: prescription.status,
                data: prescription,
            });
        });

        // Add sale events
        historyData.sales.forEach((sale) => {
            events.push({
                eventId: `sale_${sale.id}`,
                type: 'sale',
                date: sale.createdAt,
                title: 'Purchase Made',
                description: `${sale.items.length} item(s) purchased - ₹${sale.totalAmount}`,
                status: 'completed',
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
    async getAdherence(patientId) {
        const patient = await patientRepository.findById(patientId);

        if (!patient) {
            throw ApiError.notFound('Patient not found');
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
}

module.exports = new PatientService();
