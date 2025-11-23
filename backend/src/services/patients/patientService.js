const patientRepository = require('../../repositories/patientRepository');
const ApiError = require('../../Utils/ApiError');
const logger = require('../../config/logger');

/**
 * Patient Service - Business logic for patient management
 */
class PatientService {
    /**
     * Get all patients with pagination
     */
    async getPatients(filters) {
        return await patientRepository.findPatients(filters);
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
}

module.exports = new PatientService();
