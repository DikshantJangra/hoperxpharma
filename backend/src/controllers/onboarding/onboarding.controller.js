const { PrismaClient } = require('@prisma/client');
const ApiError = require('../../Utils/ApiError');
const ApiResponse = require('../../Utils/ApiResponse');
const asyncHandler = require('../../middlewares/asyncHandler');

const prisma = new PrismaClient();

/**
 * Get onboarding progress for the current user
 */
const getProgress = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const progress = await prisma.onboardingProgress.findUnique({
        where: { userId },
    });

    if (!progress) {
        return res.status(200).json(
            new ApiResponse(200, {
                currentStep: 1,
                completedSteps: [],
                data: {},
                isComplete: false,
            }, 'Onboarding progress retrieved')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, progress, 'Onboarding progress retrieved')
    );
});

/**
 * Save onboarding progress
 */
const saveProgress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentStep, completedSteps, data, isComplete } = req.body;

    const progress = await prisma.onboardingProgress.upsert({
        where: { userId },
        update: {
            currentStep,
            completedSteps,
            data,
            isComplete,
        },
        create: {
            userId,
            currentStep: currentStep || 1,
            completedSteps: completedSteps || [],
            data: data || {},
            isComplete: isComplete || false,
        },
    });

    return res.status(200).json(
        new ApiResponse(200, progress, 'Onboarding progress saved')
    );
});

module.exports = {
    getProgress,
    saveProgress,
};
