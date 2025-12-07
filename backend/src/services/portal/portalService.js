const prisma = require('../../config/database');
const jwt = require('jsonwebtoken');

class PortalService {
    /**
     * Verify patient identity
     * @param {string} phoneNumber 
     * @param {string} dateOfBirth (YYYY-MM-DD or ISO string)
     */
    async verifyPatient(phoneNumber, dateOfBirth) {
        // Normalize phone number (remove non-digits)
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // Find patient by phone
        // We search globally or we could restrict to a store if context allows
        const patient = await prisma.getClient().patient.findFirst({
            where: {
                phoneNumber: { contains: cleanPhone }, // Loose match
                deletedAt: null
            }
        });

        if (!patient) {
            throw new Error('Patient not found');
        }

        // Verify DOB
        // Compare just the date parts to avoid timezone issues
        const inputDob = new Date(dateOfBirth).toISOString().split('T')[0];
        const recordDob = new Date(patient.dateOfBirth).toISOString().split('T')[0];

        if (inputDob !== recordDob) {
            throw new Error('Verification failed');
        }

        // Generate short-lived token (1 hour)
        const token = jwt.sign(
            { id: patient.id, storeId: patient.storeId, type: 'PATIENT_PORTAL' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        return {
            token,
            patient: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                storeId: patient.storeId
            }
        };
    }

    /**
     * Get active prescriptions for patient
     */
    async getActivePrescriptions(patientId) {
        return await prisma.getClient().prescription.findMany({
            where: {
                patientId,
                status: { not: 'CANCELLED' },
                deletedAt: null
            },
            include: {
                items: {
                    include: { drug: true }
                },
                prescriber: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    /**
     * Get refillable prescriptions
     */
    async getRefillablePrescriptions(patientId) {
        const today = new Date();
        return await prisma.getClient().prescription.findMany({
            where: {
                patientId,
                status: 'COMPLETED', // Specifically completed prescriptions that might trigger a refill workflow
                refillsRemaining: { gt: 0 },
                deletedAt: null
            },
            include: {
                items: {
                    include: { drug: true }
                }
            }
        });
    }

    /**
     * Submit refill request
     */
    async requestRefill(patientId, prescriptionId) {
        const prescription = await prisma.getClient().prescription.findFirst({
            where: { id: prescriptionId, patientId }
        });

        if (!prescription) {
            throw new Error('Prescription not found');
        }

        if (prescription.refillsRemaining <= 0) {
            throw new Error('No refills remaining');
        }

        // Create a new queue item or just flag the prescription
        // For now, let's create a new prescription in "NEW" stage marked as Refill Request
        // OR better, create a specific RefillRequest queue/model.
        // Given existing architecture, let's clone the prescription into a new DRAFT/NEW one linked to original.

        const newRx = await prisma.getClient().prescription.create({
            data: {
                storeId: prescription.storeId,
                patientId: prescription.patientId,
                prescriberId: prescription.prescriberId,
                source: 'portal_refill',
                status: 'DRAFT',
                stage: 'NEW',
                priority: 'Normal',
                refillNumber: prescription.refillNumber + 1,
                refillsRemaining: prescription.refillsRemaining - 1,
                originalRxId: prescription.originalRxId || prescription.id,
                notes: `Refill requested via Patient Portal on ${new Date().toLocaleString()}`,

                // Copy items? Logic might be complex if partial refill. 
                // For simplified flow, we assume full refill of same items.
                // We'll require pharmacist verification anyway.
            }
        });

        // Copy items logic would go here ideally, or handled by pharmacist when they open the "NEW" request.
        // Let's copy items to be helpful.
        const originalItems = await prisma.getClient().prescriptionItem.findMany({
            where: { prescriptionId: prescription.id }
        });

        if (originalItems.length > 0) {
            await prisma.getClient().prescriptionItem.createMany({
                data: originalItems.map(item => ({
                    prescriptionId: newRx.id,
                    drugId: item.drugId,
                    quantityPrescribed: item.quantityPrescribed,
                    sig: item.sig,
                    daysSupply: item.daysSupply,
                    isControlled: item.isControlled
                }))
            });
        }

        return newRx;
    }
}

module.exports = new PortalService();
