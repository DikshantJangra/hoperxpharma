const prisma = require('../../db/prisma');
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

            // Create bidirectional link or single? 
            // Requirement says "Patient Connections". Usually family links are mutual context, but logic might be directional "Is Father Of".
            // For now, let's just create the record as requested. If we want bidirectional, we can create two records or query efficiently.

            const relation = await prisma.patientRelation.create({
                data: {
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

            // Also create the reverse link if it's a family unit?
            // Let's stick to simple directional for now, UI can handle "fetch relations where id=A OR relatedId=A"

            res.status(201).json({ success: true, data: relation });
        } catch (error) {
            console.error('Add Relation Error:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, errors: error.errors });
            }
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    // Get connections for a patient
    async getRelations(req, res) {
        try {
            const { id } = req.params;

            // Fetch both "related to" and "related from" to show full family
            const [relatedTo, relatedFrom] = await Promise.all([
                prisma.patientRelation.findMany({
                    where: { patientId: id },
                    include: {
                        relatedPatient: {
                            select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true }
                        }
                    }
                }),
                prisma.patientRelation.findMany({
                    where: { relatedPatientId: id },
                    include: {
                        patient: {
                            select: { id: true, firstName: true, lastName: true, phoneNumber: true, email: true }
                        }
                    }
                })
            ]);

            // Normalize structure
            const connections = [
                ...relatedTo.map(r => ({ ...r.relatedPatient, relationType: r.relationType, direction: 'OUT' })),
                ...relatedFrom.map(r => ({ ...r.patient, relationType: r.relationType, direction: 'IN' }))
            ];

            res.json({ success: true, data: connections });
        } catch (error) {
            console.error('Get Relations Error:', error);
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
            console.error('Remove Relation Error:', error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}

module.exports = new PatientRelationController();
