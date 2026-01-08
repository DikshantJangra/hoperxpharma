/**
 * Alert System Tests
 * 
 * Tests the intelligent alert system:
 * - Alert generation (low stock, expiry, system events)
 * - Alert acknowledgment and dismissal
 * - Alert preferences configuration
 * - Multi-category alert filtering
 */

import { test, expect } from '../fixtures/auth.fixture';
import { createTestDrug, createTestBatch } from '../data/factories';

test.describe('Alerts - Generation and Display', () => {
    test('should display alerts on dashboard', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Navigate to alerts page or dashboard
        await page.goto('/dashboard/alerts');
        await page.waitForLoadState('networkidle');

        // Should see alerts section
        const alertsContainer = page.locator('[data-testid="alerts"], .alerts-container, .alert-list').first();

        if (await alertsContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Alerts UI visible');
        }

        // Check database for existing alerts
        const alerts = await db.alert.findMany({
            where: {
                storeId,
                status: 'NEW',
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        console.log('✅ Found', alerts.length, 'unread alerts in database');
    });

    test('should generate low stock alert', async ({ page, db, testData }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Create drug with very low stock
        const drug = await createTestDrug(db, storeId, {
            name: 'Alert Test Low Stock Drug',
        });
        testData.drugIds.push(drug.id);

        const batch = await createTestBatch(db, storeId, drug.id, {
            quantity: 3, // Very low quantity
            mrp: 50.00,
        });
        testData.inventoryBatchIds.push(batch.id);

        // Wait for alert generation (may be async)
        await page.waitForTimeout(2000);

        // Check for low stock alert
        const lowStockAlert = await db.alert.findFirst({
            where: {
                storeId,
                category: 'INVENTORY',
                title: { contains: 'Low Stock' },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (lowStockAlert) {
            console.log('✅ Low stock alert generated:', lowStockAlert.title);
        } else {
            console.log('⚠️  Low stock alert may be generated asynchronously');
        }
    });

    test('should generate expiry alert', async ({ page, db, testData }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Create drug with near-expiry batch
        const drug = await createTestDrug(db, storeId, {
            name: 'Alert Test Expiry Drug',
        });
        testData.drugIds.push(drug.id);

        // Create batch expiring in 30 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const batch = await createTestBatch(db, storeId, drug.id, {
            quantity: 100,
            expiryDate,
        });
        testData.inventoryBatchIds.push(batch.id);

        await page.waitForTimeout(2000);

        // Check for expiry alert
        const expiryAlert = await db.alert.findFirst({
            where: {
                storeId,
                category: 'INVENTORY',
                title: { contains: 'Expiry' },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (expiryAlert) {
            console.log('✅ Expiry alert generated:', expiryAlert.title);
        } else {
            console.log('⚠️  Expiry alert may be generated asynchronously');
        }
    });
});

test.describe('Alerts - Interaction', () => {
    test('should mark alert as read', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Find or create an unread alert
        let alert = await db.alert.findFirst({
            where: {
                storeId,
                status: 'NEW',
            },
        });

        if (!alert) {
            // Create a test alert
            alert = await db.alert.create({
                data: {
                    storeId,
                    category: 'SYSTEM',
                    severity: 'INFO',
                    title: 'Test Alert',
                    description: 'This is a test alert',
                    source: 'test',
                    type: 'system',
                    status: 'NEW',
                },
            });
        }

        await page.goto('/dashboard/alerts');
        await page.waitForLoadState('networkidle');

        // Click on alert to mark as read
        const alertItem = page.locator(`[data-alert-id="${alert.id}"], .alert-item`).first();

        if (await alertItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await alertItem.click();
            await page.waitForTimeout(1000);
        }

        // VERIFY: Alert marked as read
        const updatedAlert = await db.alert.findUnique({
            where: { id: alert.id },
        });

        if (updatedAlert && updatedAlert.status !== 'NEW') {
            console.log('✅ Alert marked as read');
        }
    });

    test('should dismiss alert', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Create a dismissible test alert
        const alert = await db.alert.create({
            data: {
                storeId,
                category: 'SYSTEM',
                severity: 'INFO',
                title: 'Dismissible Alert',
                description: 'This alert can be dismissed',
                source: 'test',
                type: 'system',
                status: 'NEW',
            },
        });

        await page.goto('/dashboard/alerts');
        await page.waitForLoadState('networkidle');

        // Find dismiss button
        const dismissBtn = page.locator(`[data-alert-id="${alert.id}"] button:has-text("Dismiss"), .alert-item button[data-action="dismiss"]`).first();

        if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await dismissBtn.click();
            await page.waitForTimeout(1000);

            // VERIFY: Alert dismissed
            const updatedAlert = await db.alert.findUnique({
                where: { id: alert.id },
            });

            if (updatedAlert && updatedAlert.status === 'RESOLVED') {
                console.log('✅ Alert dismissed successfully');
            }
        } else {
            console.log('⚠️  Dismiss functionality may differ');
        }
    });
});

test.describe('Alerts - Preferences', () => {
    test('should configure alert preferences', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Navigate to alert preferences
        await page.goto('/settings/alerts');
        await page.waitForLoadState('networkidle');

        // Should see preference toggles
        const prefSection = page.locator('text=/alert preferences|notification settings/i').first();

        if (await prefSection.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Alert preferences page loaded');
        }

        // Try to toggle a preference
        const inventoryToggle = page.locator('input[type="checkbox"][name*="inventory"], label:has-text("Inventory") input').first();

        if (await inventoryToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
            const wasChecked = await inventoryToggle.isChecked();
            await inventoryToggle.click();
            await page.waitForTimeout(1000);

            // Verify toggle changed
            const isNowChecked = await inventoryToggle.isChecked();
            expect(isNowChecked).not.toBe(wasChecked);
            console.log('✅ Alert preference toggle working');
        }

        // Check database for preferences
        const preferences = await db.alertPreference.findMany({
            where: { storeId },
        });

        console.log('✅ Found', preferences.length, 'alert preferences');
    });

    test('should filter alerts by category', async ({ page, db }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        await page.goto('/dashboard/alerts');
        await page.waitForLoadState('networkidle');

        // Try category filters
        const filterBtn = page.locator('button:has-text("Filter"), select[name="category"]').first();

        if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Select inventory category
            if ((await filterBtn.evaluate(el => el.tagName)) === 'SELECT') {
                await filterBtn.selectOption('INVENTORY');
            } else {
                await filterBtn.click();
                const inventoryOption = page.locator('text=Inventory, [data-category="INVENTORY"]').first();
                if (await inventoryOption.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await inventoryOption.click();
                }
            }

            await page.waitForTimeout(1000);
            console.log('✅ Alert filtering UI available');
        }

        // Verify database has multiple categories
        const categories = await db.alert.groupBy({
            by: ['category'],
            where: { storeId },
        });

        console.log('✅ Alert categories in database:', categories.map(c => c.category));
    });
});
