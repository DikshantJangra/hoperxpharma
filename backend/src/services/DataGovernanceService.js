"use strict";
/**
 * DataGovernanceService - Data Quality and Protection
 *
 * Handles data quality checks, verified medicine protection, and soft deletes
 * Requirements: 8.3, 8.5, 8.7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataGovernanceService = exports.DataGovernanceService = void 0;
const client_1 = require("@prisma/client");
const MedicineMasterService_1 = require("./MedicineMasterService");
const prisma = new client_1.PrismaClient();
class DataGovernanceService {
    /**
     * Flag incomplete data for a medicine
     * Requirements: 8.5
     */
    flagIncompleteData(medicine) {
        const issues = [];
        let completenessScore = 100;
        // Check required fields
        if (!medicine.name || medicine.name.trim().length < 3) {
            issues.push({
                field: 'name',
                issue: 'Name is missing or too short',
                severity: 'ERROR',
            });
            completenessScore -= 20;
        }
        if (!medicine.compositionText || medicine.compositionText.trim().length < 3) {
            issues.push({
                field: 'compositionText',
                issue: 'Composition is missing or incomplete',
                severity: 'ERROR',
            });
            completenessScore -= 20;
        }
        if (!medicine.manufacturerName || medicine.manufacturerName.trim().length < 2) {
            issues.push({
                field: 'manufacturerName',
                issue: 'Manufacturer is missing or incomplete',
                severity: 'ERROR',
            });
            completenessScore -= 15;
        }
        // Check important optional fields
        if (!medicine.hsnCode) {
            issues.push({
                field: 'hsnCode',
                issue: 'HSN code is missing',
                severity: 'WARNING',
            });
            completenessScore -= 10;
        }
        if (!medicine.genericName) {
            issues.push({
                field: 'genericName',
                issue: 'Generic name is missing',
                severity: 'WARNING',
            });
            completenessScore -= 10;
        }
        if (!medicine.primaryBarcode) {
            issues.push({
                field: 'primaryBarcode',
                issue: 'Primary barcode is missing',
                severity: 'WARNING',
            });
            completenessScore -= 10;
        }
        if (!medicine.schedule && medicine.requiresPrescription) {
            issues.push({
                field: 'schedule',
                issue: 'Schedule is missing for prescription medicine',
                severity: 'WARNING',
            });
            completenessScore -= 5;
        }
        return {
            medicineId: medicine.id,
            medicineName: medicine.name,
            completenessScore: Math.max(0, completenessScore),
            issues,
            isComplete: issues.filter(i => i.severity === 'ERROR').length === 0,
        };
    }
    /**
     * Check if user is authorized to update verified medicine
     * Requirements: 8.3
     */
    async canUpdateVerifiedMedicine(medicineId, userId, userRole) {
        const medicine = await MedicineMasterService_1.medicineMasterService.getById(medicineId);
        if (!medicine) {
            return false;
        }
        // If not verified, anyone can update
        if (medicine.status !== client_1.MedicineStatus.VERIFIED) {
            return true;
        }
        // Only admins or system can update verified medicines
        const authorizedRoles = ['ADMIN', 'SYSTEM', 'SUPER_ADMIN'];
        if (userRole && authorizedRoles.includes(userRole)) {
            return true;
        }
        // System user always authorized
        if (userId === 'system' || userId === 'admin') {
            return true;
        }
        return false;
    }
    /**
     * Soft delete medicine (mark as DISCONTINUED)
     * Requirements: 8.7
     */
    async discontinueMedicine(medicineId, reason, discontinuedBy) {
        const medicine = await MedicineMasterService_1.medicineMasterService.softDelete(medicineId, discontinuedBy);
        // Log discontinuation
        console.log(`[Governance] Medicine ${medicineId} discontinued by ${discontinuedBy}. Reason: ${reason || 'Not specified'}`);
        return medicine;
    }
    /**
     * Verify medicine data meets quality standards
     * Requirements: 8.5
     */
    async verifyDataQuality(medicineId) {
        const medicine = await MedicineMasterService_1.medicineMasterService.getById(medicineId);
        if (!medicine) {
            throw new Error(`Medicine ${medicineId} not found`);
        }
        return this.flagIncompleteData(medicine);
    }
    /**
     * Bulk check data quality for multiple medicines
     * Requirements: 8.5
     */
    async bulkVerifyDataQuality(medicineIds) {
        const medicines = await MedicineMasterService_1.medicineMasterService.getByIds(medicineIds);
        return medicines.map(m => this.flagIncompleteData(m));
    }
    /**
     * Get medicines with incomplete data
     * Requirements: 8.5
     */
    async getIncompleteMedicines(options = {}) {
        const { skip = 0, take = 100, minCompletenessScore = 80 } = options;
        const medicines = await prisma.medicineMaster.findMany({
            skip,
            take,
            orderBy: { createdAt: 'desc' },
        });
        const reports = medicines.map(m => this.flagIncompleteData(m));
        // Filter by completeness score
        return reports.filter(r => r.completenessScore < minCompletenessScore);
    }
    /**
     * Protect verified medicine from unauthorized updates
     * Requirements: 8.3
     */
    async protectVerifiedMedicine(medicineId, updateData, userId, userRole) {
        const canUpdate = await this.canUpdateVerifiedMedicine(medicineId, userId, userRole);
        if (!canUpdate) {
            return {
                allowed: false,
                reason: 'Verified medicines can only be updated by administrators',
            };
        }
        return { allowed: true };
    }
    /**
     * Get governance statistics
     */
    async getGovernanceStats() {
        const total = await prisma.medicineMaster.count();
        const verified = await prisma.medicineMaster.count({
            where: { status: client_1.MedicineStatus.VERIFIED },
        });
        const discontinued = await prisma.medicineMaster.count({
            where: { status: client_1.MedicineStatus.DISCONTINUED },
        });
        // Sample medicines for quality check
        const sampleSize = Math.min(100, total);
        const sample = await prisma.medicineMaster.findMany({
            take: sampleSize,
            orderBy: { createdAt: 'desc' },
        });
        const qualityReports = sample.map(m => this.flagIncompleteData(m));
        const avgCompleteness = qualityReports.reduce((sum, r) => sum + r.completenessScore, 0) / qualityReports.length;
        const incompleteCount = qualityReports.filter(r => !r.isComplete).length;
        return {
            total,
            verified,
            discontinued,
            verificationRate: total > 0 ? (verified / total) * 100 : 0,
            discontinuedRate: total > 0 ? (discontinued / total) * 100 : 0,
            avgCompleteness: avgCompleteness.toFixed(2),
            incompleteRate: sampleSize > 0 ? (incompleteCount / sampleSize) * 100 : 0,
            sampleSize,
        };
    }
    /**
     * Restore discontinued medicine
     */
    async restoreMedicine(medicineId, restoredBy) {
        const medicine = await MedicineMasterService_1.medicineMasterService.update(medicineId, { status: client_1.MedicineStatus.PENDING }, restoredBy);
        console.log(`[Governance] Medicine ${medicineId} restored by ${restoredBy}`);
        return medicine;
    }
}
exports.DataGovernanceService = DataGovernanceService;
// Export singleton instance
exports.dataGovernanceService = new DataGovernanceService();
