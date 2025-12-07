const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

class ERxService {
    /**
     * Simulation of fetching pending scripts from an external provider/hub
     * In production, this would call an external API (SureScripts, etc.)
     */
    async fetchPendingERx(providerId) {
        // Mock data simulation
        return [
            {
                eRxId: `ERX-${Math.floor(Math.random() * 10000)}`,
                patient: {
                    firstName: "John",
                    lastName: "Doe",
                    dob: "1980-05-15",
                    phone: "555-0101",
                    insurance: { provider: "BlueCross", policy: "BC-12345" }
                },
                prescriber: {
                    name: "Dr. Sarah Smith",
                    deaInfo: "AB1234567",
                    npi: "1234567890",
                    clinic: "City Health Clinic"
                },
                medications: [
                    {
                        drugName: "Amoxicillin 500mg",
                        quantity: 30,
                        sig: "Take 1 capsule 3 times daily for 10 days",
                        refills: 0,
                        daysSupply: 10
                    }
                ],
                priority: "Normal",
                receivedAt: new Date().toISOString()
            },
            {
                eRxId: `ERX-${Math.floor(Math.random() * 10000)}`,
                patient: {
                    firstName: "Jane",
                    lastName: "Roe",
                    dob: "1992-11-20",
                    phone: "555-0202",
                    insurance: { provider: "Aetna", policy: "AE-98765" }
                },
                prescriber: {
                    name: "Dr. James Wilson",
                    deaInfo: "CD9876543",
                    npi: "0987654321",
                    clinic: "Family Practice Center"
                },
                medications: [
                    {
                        drugName: "Lisinopril 10mg",
                        quantity: 90,
                        sig: "Take 1 tablet daily",
                        refills: 3,
                        daysSupply: 90
                    }
                ],
                priority: "Urgent",
                receivedAt: new Date().toISOString()
            }
        ];
    }

    /**
     * Import an external E-Rx into our local system
     */
    async importERx(eRxData, userId) {
        // 1. Find or Create Patient
        // Simplified logic: try to match by phone, else create
        let patient = await prisma.patient.findFirst({
            where: { phoneNumber: eRxData.patient.phone }
        });

        if (!patient) {
            patient = await prisma.patient.create({
                data: {
                    firstName: eRxData.patient.firstName,
                    lastName: eRxData.patient.lastName,
                    phoneNumber: eRxData.patient.phone,
                    dateOfBirth: new Date(eRxData.patient.dob),
                    insuranceProvider: eRxData.patient.insurance?.provider,
                    insurancePolicyNo: eRxData.patient.insurance?.policy
                }
            });
        }

        // 2. Find or Create Prescriber
        let prescriber = await prisma.prescriber.findFirst({
            where: { npiNumber: eRxData.prescriber.npi }
        });

        if (!prescriber) {
            prescriber = await prisma.prescriber.create({
                data: {
                    name: eRxData.prescriber.name,
                    npiNumber: eRxData.prescriber.npi,
                    deaNumber: eRxData.prescriber.deaInfo,
                    clinicName: eRxData.prescriber.clinic
                }
            });
        }

        // 3. Create Prescription
        const prescription = await prisma.prescription.create({
            data: {
                patientId: patient.id,
                prescriberId: prescriber.id,
                status: 'DRAFT',
                stage: 'NEW',
                source: 'ERX',
                eRxId: eRxData.eRxId,
                eRxMetadata: eRxData, // Store full original JSON
                priority: eRxData.priority,
                items: {
                    create: eRxData.medications.map(med => ({
                        drugName: med.drugName, // Using drugName as string for now if not matched to Catalog
                        quantityPrescribed: med.quantity,
                        sig: med.sig,
                        daysSupply: med.daysSupply,
                        refills: med.refills
                    }))
                }
            },
            include: {
                patient: true,
                items: true,
                prescriber: true
            }
        });

        return prescription;
    }
}

module.exports = new ERxService();
