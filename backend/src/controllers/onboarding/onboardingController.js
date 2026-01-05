const onboardingService = require('../../services/onboarding/onboardingService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * Get onboarding progress
 */
const getProgress = asyncHandler(async (req, res) => {
    const progress = await onboardingService.getProgress(req.user.id);

    const response = ApiResponse.success(progress);
    res.status(response.statusCode).json(response);
});

/**
 * Create store (Step 1)
 */
const createStore = asyncHandler(async (req, res) => {
    const store = await onboardingService.createStore(req.body, req.user.id);

    const response = ApiResponse.created(store, 'Store created successfully with trial subscription');
    res.status(response.statusCode).json(response);
});

/**
 * Add licenses (Step 2)
 */
const addLicenses = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { licenses } = req.body;

    const addedLicenses = await onboardingService.addLicenses(storeId, licenses, req.user.id);

    const response = ApiResponse.success(addedLicenses, 'Licenses added successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Set operating hours (Step 3)
 */
const setOperatingHours = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { hours } = req.body;

    const operatingHours = await onboardingService.setOperatingHours(storeId, hours, req.user.id);

    const response = ApiResponse.success(operatingHours, 'Operating hours set successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Select subscription plan (Step 4)
 */
const selectPlan = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { planId } = req.body;

    const subscription = await onboardingService.selectPlan(storeId, planId);

    const response = ApiResponse.success(subscription, 'Subscription plan selected successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Complete onboarding (all at once)
 */
const completeOnboarding = asyncHandler(async (req, res) => {
    const result = await onboardingService.completeOnboarding(req.body, req.user.id);

    const response = ApiResponse.created(result, 'Onboarding completed successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Mark onboarding as complete
 */
const markComplete = asyncHandler(async (req, res) => {
    const result = await onboardingService.markComplete(req.user.id);

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

/**
 * Request logo upload URL for onboarding (no store ID)
 */
const requestLogoUpload = asyncHandler(async (req, res) => {
    const { fileName } = req.body;
    const result = await require('../../services/onboarding/onboardingAssetService').requestLogoUpload(req.user.id, fileName);

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

/**
 * Process logo upload for onboarding
 */
const processLogoUpload = asyncHandler(async (req, res) => {
    const { tempKey, fileName } = req.body;
    const result = await require('../../services/onboarding/onboardingAssetService').processLogoUpload(
        tempKey,
        req.user.id,
        fileName
    );

    if (!result.success) {
        throw ApiError.badRequest(result.error);
    }

    const response = ApiResponse.success(result, 'Logo uploaded successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Request license document upload URL for onboarding
 */
const requestLicenseUpload = asyncHandler(async (req, res) => {
    const { licenseType, fileName } = req.body;

    if (!['DRUG_LICENSE', 'GST_CERTIFICATE'].includes(licenseType)) {
        throw ApiError.badRequest('Invalid license type. Must be DRUG_LICENSE or GST_CERTIFICATE');
    }

    const result = await require('../../services/onboarding/onboardingAssetService').requestLicenseUpload(
        req.user.id,
        licenseType,
        fileName
    );

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

/**
 * Process license document upload for onboarding
 */
const processLicenseUpload = asyncHandler(async (req, res) => {
    const { tempKey, licenseType } = req.body;

    if (!['DRUG_LICENSE', 'GST_CERTIFICATE'].includes(licenseType)) {
        throw ApiError.badRequest('Invalid license type. Must be DRUG_LICENSE or GST_CERTIFICATE');
    }

    const result = await require('../../services/onboarding/onboardingAssetService').processLicenseUpload(
        tempKey,
        req.user.id,
        licenseType
    );

    if (!result.success) {
        throw ApiError.badRequest(result.error);
    }

    const response = ApiResponse.success(result, 'License document uploaded successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Set Setup Mode (Demo vs Real)
 */
const setSetupMode = asyncHandler(async (req, res) => {
    const { mode, businessType } = req.body; // "REAL" or "DEMO", optional businessType
    const userId = req.user.id;

    if (!['REAL', 'DEMO'].includes(mode)) {
        throw ApiError.badRequest('Invalid mode. Must be REAL or DEMO');
    }

    // Update onboarding progress mode
    let progress = await require('../../repositories/onboardingRepository').getProgress(userId);

    // If progress doesn't exist (shouldn't happen usually but for safety), create or update
    // We'll update the mode via Prisma directly for now as repository might not have specific updateMode method
    // Or we assume getProgress returns the object we can just update via Prisma
    // Let's use Prisma directly here for simplicity or update Repository later. 
    // Ideally we should add `updateMode` to Repository.
    // For now, let's use a direct Prisma call inside controller or add a quick method to repository.
    // Let's do it via Repository update if possible, or just update using standard updateProgress logic if adaptable.
    // Actually, let's just do it directly here for speed as repository update is separate task.
    // Wait, the Plan said "Update getProgress to return mode".

    // Let's trigger the Demo Creation if DEMO
    let result = { mode };

    if (mode === 'DEMO') {
        // Create Demo Store with business type (defaults to 'Retail Pharmacy' if not provided)
        const demoDataService = require('../../services/onboarding/demoDataService');
        const store = await demoDataService.createDemoStore(userId, businessType || 'Retail Pharmacy');

        // Mark onboarding as complete
        await require('../../db/prisma').onboardingProgress.update({
            where: { userId },
            data: {
                mode: 'DEMO',
                isComplete: true,
                currentStep: 10,
                completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            }
        });

        result.storeId = store.id;
        result.isComplete = true;
    } else {
        // Just save the mode preference
        await require('../../db/prisma').onboardingProgress.update({
            where: { userId },
            data: { mode: 'REAL' }
        });
    }

    const response = ApiResponse.success(result, 'Setup mode updated');
    res.status(response.statusCode).json(response);
});

/**
 * Reset Onboarding (Delete Demo Store)
 */
const resetMode = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const prisma = require('../../db/prisma');

    // Find store
    const storeUser = await prisma.storeUser.findFirst({
        where: { userId, isPrimary: true },
        include: { store: true }
    });

    if (storeUser && storeUser.store) {
        if (!storeUser.store.isDemo) {
            throw ApiError.forbidden('Only demo stores can be reset');
        }

        const storeId = storeUser.storeId;

        await prisma.$transaction(async (tx) => {
            // First, get all patients for this store to delete their relations
            const patients = await tx.patient.findMany({
                where: { storeId },
                select: { id: true }
            });
            const patientIds = patients.map(p => p.id);

            // Delete PatientRelations (not auto-cascaded in relationMode = prisma)
            if (patientIds.length > 0) {
                await tx.patientRelation.deleteMany({
                    where: {
                        OR: [
                            { patientId: { in: patientIds } },
                            { relatedPatientId: { in: patientIds } }
                        ]
                    }
                });
            }

            // Delete Prescriptions (and related items will cascade)
            await tx.prescription.deleteMany({ where: { storeId } });

            // Delete Sales and SaleItems (SaleItems should cascade, but be explicit)
            const sales = await tx.sale.findMany({
                where: { storeId },
                select: { id: true }
            });
            const saleIds = sales.map(s => s.id);
            if (saleIds.length > 0) {
                await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
            }
            await tx.sale.deleteMany({ where: { storeId } });

            // Delete InventoryBatches -> Drugs (Batches should cascade with Drug if Drug cascades with Store)
            // But since relationMode = prisma, we may need explicit deletion
            await tx.inventoryBatch.deleteMany({ where: { storeId } });
            await tx.drug.deleteMany({ where: { storeId } });

            // Delete Prescribers and Patients (Patients should cascade with Store)
            await tx.prescriber.deleteMany({ where: { storeId } });
            await tx.patient.deleteMany({ where: { storeId } });

            // Delete StoreUser records to prevent orphaned relations
            await tx.storeUser.deleteMany({ where: { storeId } });

            // Delete Store (other cascades should handle rest)
            await tx.store.delete({ where: { id: storeId } });
        }, { timeout: 60000 });
    }

    // Reset User Onboarding Progress
    await prisma.onboardingProgress.update({
        where: { userId },
        data: {
            mode: null,
            isComplete: false,
            currentStep: 1,
            completedSteps: [],
            data: {}
        }
    });

    const response = ApiResponse.success({ success: true }, 'Demo store reset successfully');
    res.status(200).json(response);
});

/**
 * Get import template
 */
const getImportTemplate = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const dataImportService = require('../../services/onboarding/dataImportService');

    try {
        const csvContent = dataImportService.getTemplate(type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type.toLowerCase()}_template.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        throw ApiError.badRequest(error.message);
    }
});

/**
 * Import data
 */
const importData = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const file = req.file;

    if (!file) throw ApiError.badRequest('No file uploaded');

    const prisma = require('../../db/prisma');
    console.log('DEBUG: importData called for user:', req.user.id);

    const storeUser = await prisma.storeUser.findFirst({
        where: { userId: req.user.id }
    });
    console.log('DEBUG: Found storeUser:', storeUser);

    if (!storeUser) {
        // Cleanup file if no store context
        require('fs').unlinkSync(file.path);
        throw ApiError.badRequest('No active store found for user');
    }

    const dataImportService = require('../../services/onboarding/dataImportService');
    const result = await dataImportService.processImport(type, file.path, storeUser.storeId, req.user.id);

    const response = ApiResponse.success(result, 'Data imported successfully');
    res.status(response.statusCode).json(response);
});

module.exports = {
    getProgress,
    createStore,
    addLicenses,
    setOperatingHours,
    selectPlan,
    completeOnboarding,
    markComplete,
    requestLogoUpload,
    processLogoUpload,
    requestLicenseUpload,
    processLicenseUpload,
    setSetupMode,
    resetMode,
    getImportTemplate,
    importData
};
