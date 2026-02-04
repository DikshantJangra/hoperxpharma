const prisma = require('../../db/prisma');
const logger = require('../../config/logger');
const { z } = require('zod');

// Schema for creating relation
const relationSchema = z.object({
    relatedPatientId: z.string().min(1, "Related patient ID is required"),
    relationType: z.string().min(1, "Relation type is required"), // e.g., "FAMILY", "PARENT"
});

class PatientRelationController {
    // Add a connection (link two patients)
    async addRelation(req, res) {
        try {
            const { id } = req.params; // Patient A
            const { relatedPatientId, relationType } = relationSchema.parse(req.body);

            // Prevent self-linking
            if (id === relatedPatientId) {
                return res.status(400).json({ success: false, message: "Cannot link patient to themselves" });
            }

            // Check if patients exist
            const [patientA, patientB] = await Promise.all([
                prisma.patient.findUnique({ where: { id } }),
                prisma.patient.findUnique({ where: { id: relatedPatientId } })
            ]);

            if (!patientA || !patientB) {
                return res.status(404).json({ success: false, message: "One or both patients not found" });
            }

            // Use upsert to handle existing relations gracefully
            // This prevents the unique constraint error (P2002) if they try to link again
            const relation = await prisma.patientRelation.upsert({
                where: {
                    patientId_relatedPatientId: {
                        patientId: id,
                        relatedPatientId: relatedPatientId
                    }
                },
                update: {
                    relationType, // Update type if it already exists
                },
                create: {
                    patientId: id,
                    relatedPatientId,
                    relationType,
                },
                include: {
                    relatedPatient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phoneNumber: true
                        }
                    }
                }
            });

            res.status(201).json({ success: true, data: relation, message: "Relation updated successfully" });
        } catch (error) {
            logger.error('Add Relation Error:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, errors: error.errors });
            }
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // Get connections for a patient (Strictly Unidirectional)
    async getRelations(req, res) {
        try {
            const { id } = req.params;

            // FETCH ONLY "related to" (OUT) relations.
            // Requirement specifies strictly one-directional until the other side is decided.
            const relations = await prisma.patientRelation.findMany({
                where: { patientId: id },
                include: {
                    relatedPatient: {
                        select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true }
                    }
                }
            });

            // Normalize structure
            const connections = relations.map(r => ({
                ...r.relatedPatient,
                relationType: r.relationType,
                direction: 'OUT'
            }));

            res.json({ success: true, data: connections });
        } catch (error) {
            logger.error('Get Relations Error:', error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // Remove connection
    async removeRelation(req, res) {
        try {
            const { id, relatedPatientId } = req.params;

            // We need to find the relation ID first or deleteMany based on composite key
            // Since we don't have the relation PK in params usually, deleting by composite is safer

            const deleted = await prisma.patientRelation.deleteMany({
                where: {
                    OR: [
                        { patientId: id, relatedPatientId: relatedPatientId },
                        { patientId: relatedPatientId, relatedPatientId: id } // Remove bidirectional if it exists? Or just specific link?
                    ]
                }
            });

            if (deleted.count === 0) {
                return res.status(404).json({ success: false, message: "Relation not found" });
            }

            res.json({ success: true, message: "Connection removed" });
        } catch (error) {
            logger.error('Remove Relation Error:', error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}

module.exports = new PatientRelationController();
