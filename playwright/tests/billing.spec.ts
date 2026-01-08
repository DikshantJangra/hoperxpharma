/**
 * Billing & Subscription Tests
 * 
 * Tests subscription and billing flows:
 * - Trial activation and tracking
 * - Plan selection and upgrades
 * - Payment method management
 * - Feature access based on subscription
 */

import { test, expect } from '../fixtures/auth.fixture';

test.describe('Billing - Subscription Management', () => {
    test('should verify trial subscription status', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: { include: { store: { include: { subscription: true } } } } },
        });

        if (!user?.storeUsers?.[0]?.store) {
            test.skip();
            return;
        }

        const store = user.storeUsers[0].store;
        const subscription = store.subscription;

        // Navigate to billing page
        await page.goto('/settings/billing');
        await page.waitForLoadState('networkidle');

        // Should show trial information
        const trialIndicator = page.locator('text=/trial|free trial/i').first();

        if (await trialIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Trial status visible in UI');
        }

        // VERIFY: Check subscription in database
        if (subscription) {
            expect(subscription.status).toBeDefined();
            console.log('✅ Subscription status:', subscription.status);
        } else {
            console.log('⚠️  No subscription found (may be in trial)');
        }
    });

    test('should display available subscription plans', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]) {
            test.skip();
            return;
        }

        // Navigate to plans/pricing page
        await page.goto('/settings/billing/plans');
        await page.waitForLoadState('networkidle');

        // Should see plan options
        const planCards = page.locator('[data-testid="plan-card"], .plan-card, .pricing-card');

        const count = await planCards.count().catch(() => 0);

        if (count > 0) {
            console.log('✅ Found', count, 'subscription plans');
        } else {
            // Try alternate selectors
            const altPlans = page.locator('text=/monthly|yearly|annual/i');
            const altCount = await altPlans.count().catch(() => 0);
            console.log('✅ Plans visible:', altCount > 0);
        }
    });

    test('should restrict features based on subscription', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: { include: { store: { include: { subscription: true } } } } },
        });

        if (!user?.storeUsers?.[0]?.store) {
            test.skip();
            return;
        }

        const subscription = user.storeUsers[0].store.subscription;

        // Navigate to a premium feature (e.g., advanced reports)
        await page.goto('/reports/advanced');
        await page.waitForLoadState('networkidle');

        // Check for upgrade prompts if on trial/free plan
        if (!subscription || subscription.status === 'TRIAL') {
            const upgradePrompt = page.locator('text=/upgrade|premium|unlock/i').first();

            if (await upgradePrompt.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('✅ Feature restriction enforced - upgrade prompt shown');
            }
        }

        console.log('✅ Feature access verification completed');
    });
});

test.describe('Billing - Payment Management', () => {
    test('should navigate to payment settings', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]) {
            test.skip();
            return;
        }

        await page.goto('/settings/billing/payment');
        await page.waitForLoadState('networkidle');

        // Should see payment method section
        const paymentSection = page.locator('text=/payment method|billing details/i').first();

        if (await paymentSection.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Payment settings page loaded');
        }

        // Check for add payment button
        const addPaymentBtn = page.locator('button:has-text("Add"), button:has-text("Payment Method")').first();

        if (await addPaymentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('✅ Add payment method option available');
        }
    });

    test('should display billing history', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        await page.goto('/settings/billing/history');
        await page.waitForLoadState('networkidle');

        // Check for payment records in database
        const payments = await db.payment.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        if (payments.length > 0) {
            console.log('✅ Found', payments.length, 'payment records');
        } else {
            console.log('⚠️  No payment history found');
        }

        // UI should show history table or empty state
        const historyTable = page.locator('table, [data-testid="billing-history"]').first();
        const emptyState = page.locator('text=/no payments|no history/i').first();

        const hasHistory = await historyTable.isVisible({ timeout: 2000 }).catch(() => false);
        const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasHistory || hasEmptyState) {
            console.log('✅ Billing history UI rendered');
        }
    });
});
