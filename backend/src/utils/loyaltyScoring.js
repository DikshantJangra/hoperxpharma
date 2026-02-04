/**
 * Loyalty Scoring Algorithms
 * 
 * Calculates loyalty progression based on:
 * - Purchase Frequency (50% weight)
 * - Time Consistency (30% weight)
 * - Engagement Actions (20% weight)
 */

// Status thresholds
const STATUS_THRESHOLDS = {
    NEW: {
        minPurchases: 0,
        minConsistency: 0,
        minEngagement: 0,
        minDays: 0,
    },
    REGULAR: {
        minPurchases: 2,
        minConsistency: 20,
        minEngagement: 0,
        minDays: 7,
    },
    TRUSTED: {
        minPurchases: 5,
        minConsistency: 40,
        minEngagement: 10,
        minDays: 30,
    },
    INSIDER: {
        minPurchases: 10,
        minConsistency: 60,
        minEngagement: 20,
        minDays: 90,
    },
    ADVOCATE: {
        minPurchases: 20,
        minConsistency: 80,
        minEngagement: 40,
        minDays: 180,
    },
};

const STATUS_ORDER = ['NEW', 'REGULAR', 'TRUSTED', 'INSIDER', 'ADVOCATE'];

/**
 * Calculate purchase frequency score (0-50 points)
 */
function calculateFrequencyScore(purchaseCount) {
    return Math.min(50, purchaseCount * 2.5);
}

/**
 * Calculate time consistency score (0-30 points)
 * Based on regularity of purchases
 */
function calculateConsistencyScore(purchaseCount, daysSinceFirst) {
    if (purchaseCount === 0 || daysSinceFirst === 0) {
        return 0;
    }

    const averageGap = daysSinceFirst / purchaseCount;
    const idealGap = 14; // Ideal: every 2 weeks

    // The closer to ideal gap, the higher the score
    const deviation = Math.abs(averageGap - idealGap);
    const score = Math.max(0, 30 - deviation);

    return Math.min(30, score);
}

/**
 * Calculate engagement score (0-20 points)
 * Based on non-transactional actions
 */
function calculateEngagementScore(feedbackCount, comebackCount = 0) {
    const feedbackPoints = feedbackCount * 5;
    const comebackPoints = comebackCount * 3;

    return Math.min(20, feedbackPoints + comebackPoints);
}

/**
 * Calculate total progress score (0-100)
 */
function calculateTotalScore(purchaseCount, daysSinceFirst, feedbackCount, comebackCount = 0) {
    const frequency = calculateFrequencyScore(purchaseCount);
    const consistency = calculateConsistencyScore(purchaseCount, daysSinceFirst);
    const engagement = calculateEngagementScore(feedbackCount, comebackCount);

    return {
        frequency,
        consistency,
        engagement,
        total: frequency + consistency + engagement,
    };
}

/**
 * Determine loyalty status based on scores and time
 */
function determineStatus(purchaseCount, consistencyScore, engagementScore, daysSinceFirst) {
    // Start from highest status and work down
    for (let i = STATUS_ORDER.length - 1; i >= 0; i--) {
        const status = STATUS_ORDER[i];
        const threshold = STATUS_THRESHOLDS[status];

        const meetsRequirements =
            purchaseCount >= threshold.minPurchases &&
            consistencyScore >= threshold.minConsistency &&
            engagementScore >= threshold.minEngagement &&
            daysSinceFirst >= threshold.minDays;

        if (meetsRequirements) {
            return status;
        }
    }

    return 'NEW';
}

/**
 * Calculate progress to next milestone (0-100%)
 */
function calculateMilestoneProgress(currentStatus, purchaseCount, consistencyScore, engagementScore, daysSinceFirst) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);

    // Already at max tier
    if (currentIndex === STATUS_ORDER.length - 1) {
        return 100;
    }

    const nextStatus = STATUS_ORDER[currentIndex + 1];
    const nextThreshold = STATUS_THRESHOLDS[nextStatus];

    // Calculate progress for each dimension - avoid division by zero
    const purchaseProgress = nextThreshold.minPurchases > 0
        ? (purchaseCount / nextThreshold.minPurchases) * 100
        : 100;
    const consistencyProgress = nextThreshold.minConsistency > 0
        ? (consistencyScore / nextThreshold.minConsistency) * 100
        : 100;
    const engagementProgress = nextThreshold.minEngagement > 0
        ? (engagementScore / nextThreshold.minEngagement) * 100
        : 100;
    const timeProgress = nextThreshold.minDays > 0
        ? (daysSinceFirst / nextThreshold.minDays) * 100
        : 100;

    // Take the minimum - all must be met
    const progress = Math.min(
        100,
        Math.min(purchaseProgress, consistencyProgress, engagementProgress, timeProgress)
    );

    return isNaN(progress) ? 0 : Math.round(progress * 100) / 100; // Round to 2 decimals
}

/**
 * Get requirements for next status
 */
function getNextStatusRequirements(currentStatus) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);

    if (currentIndex === STATUS_ORDER.length - 1) {
        return null; // Already at max
    }

    const nextStatus = STATUS_ORDER[currentIndex + 1];
    return {
        status: nextStatus,
        requirements: STATUS_THRESHOLDS[nextStatus],
    };
}

/**
 * Calculate points for a purchase event
 */
function calculatePurchasePoints(saleAmount, itemCount) {
    // Base points: 1 point per purchase
    let points = 5;

    // Bonus for larger purchases (capped to prevent gaming)
    if (saleAmount > 500) points += 2;
    if (saleAmount > 1000) points += 3;

    // Small bonus for multiple items
    if (itemCount > 3) points += 1;

    return Math.min(15, points); // Cap at 15 points per purchase
}

/**
 * Calculate points for feedback
 */
function calculateFeedbackPoints(rating, hasComment) {
    let points = 5; // Base points for any feedback

    // Bonus for detailed feedback
    if (hasComment) points += 3;

    // Bonus for positive feedback (encourages good experiences)
    if (rating >= 4) points += 2;

    return points;
}

/**
 * Determine if a comeback bonus should be awarded
 */
function shouldAwardComebackBonus(daysSinceLastPurchase) {
    // Award comeback bonus if customer returns after 30+ days
    return daysSinceLastPurchase >= 30;
}

/**
 * Generate recognition message based on status and progress
 */
function generateRecognitionMessage(status, daysSinceFirst, purchaseCount) {
    const months = Math.floor(daysSinceFirst / 30);

    const messages = {
        NEW: `Welcome! Your loyalty journey begins now.`,
        REGULAR: `You've made ${purchaseCount} purchases with us. Thank you!`,
        TRUSTED: `You've been with us for ${months} month${months > 1 ? 's' : ''}. We value your trust.`,
        INSIDER: `As one of our valued insiders, you're part of our inner circle.`,
        ADVOCATE: `You're an advocate! Your loyalty inspires us every day.`,
    };

    return messages[status] || messages.NEW;
}

module.exports = {
    STATUS_THRESHOLDS,
    STATUS_ORDER,
    calculateFrequencyScore,
    calculateConsistencyScore,
    calculateEngagementScore,
    calculateTotalScore,
    determineStatus,
    calculateMilestoneProgress,
    getNextStatusRequirements,
    calculatePurchasePoints,
    calculateFeedbackPoints,
    shouldAwardComebackBonus,
    generateRecognitionMessage,
};
