/**
 * Quick Sale Flow
 * 
 * Performs a complete OTC sale through the POS interface
 * with full backend verification
 */

import { Page, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { waitForAPIResponse } from '../../utils/wait.util';

export interface QuickSaleOptions {
    /** Drug name to search */
    drugName: string;
    /** Quantity to sell */
    quantity: number;
    /** Payment method */
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
    /** Customer info (optional for walk-in) */
    customer?: {
        id?: string;
        name?: string;
        phone?: string;
    };
    /** Cash received (for CASH payment) */
    cashReceived?: number;
}

export interface QuickSaleResult {
    success: boolean;
    saleId?: string;
    invoiceNumber?: string;
    total?: number;
    error?: string;
}

/**
 * Perform a quick OTC sale
 */
export async function performQuickSale(
    page: Page,
    options: QuickSaleOptions
): Promise<QuickSaleResult> {
    const { drugName, quantity, paymentMethod, customer, cashReceived } = options;

    try {
        // Navigate to POS
        await page.goto('/pos');
        await page.waitForLoadState('networkidle');

        // Search for drug
        const searchInput = page.locator('input[placeholder*="Search"], input[name="search"]').first();
        await searchInput.fill(drugName);
        await page.waitForTimeout(500); // Debounce

        // Click on drug in results
        const drugOption = page.locator(`text=${drugName}`).first();
        await drugOption.click({ timeout: 5000 });

        // Set quantity if there's a quantity input
        const quantityInput = page.locator('input[name="quantity"], input[type="number"]').first();
        if (await quantityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await quantityInput.fill(quantity.toString());
        }

        // Add to cart
        const addButton = page.locator('button:has-text("Add"), button:has-text("Add to Cart")').first();
        if (await addButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await addButton.click();
        }

        // Verify item in cart
        await expect(page.locator(`text=${drugName}`)).toBeVisible({ timeout: 3000 });

        // Select customer if provided
        if (customer?.name || customer?.phone) {
            const customerSearch = page.locator('input[placeholder*="Customer"], input[name="customer"]').first();
            if (await customerSearch.isVisible({ timeout: 1000 }).catch(() => false)) {
                await customerSearch.fill(customer.name || customer.phone || '');
                await page.waitForTimeout(300);

                const customerOption = page.locator(`text=${customer.name || customer.phone}`).first();
                if (await customerOption.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await customerOption.click();
                }
            }
        }

        // Proceed to payment
        const proceedButton = page.locator('button:has-text("Proceed"), button:has-text("Checkout"), button:has-text("Pay")').first();
        await proceedButton.click();

        // Select payment method
        const paymentSelect = page.locator('select[name="paymentMethod"], [name="payment"]').first();
        if (await paymentSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
            await paymentSelect.selectOption(paymentMethod);
        } else {
            // Try clicking payment method button
            const paymentButton = page.locator(`button:has-text("${paymentMethod}"), [data-payment="${paymentMethod}"]`).first();
            if (await paymentButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                await paymentButton.click();
            }
        }

        // Enter cash received if CASH payment
        if (paymentMethod === 'CASH' && cashReceived) {
            const cashInput = page.locator('input[name="cashReceived"], input[name="received"]').first();
            if (await cashInput.isVisible({ timeout: 1000 }).catch(() => false)) {
                await cashInput.fill(cashReceived.toString());
            }
        }

        // Complete sale
        const completeButton = page.locator('button:has-text("Complete"), button:has-text("Finish"), button:has-text("Done")').first();
        await completeButton.click();

        // Wait for API response
        const saleResponse = await waitForAPIResponse(page, '/api/v1/sales', 10000);

        if (!saleResponse?.data?.id) {
            return {
                success: false,
                error: 'Sale response missing ID',
            };
        }

        // Verify success message
        await expect(page.locator('text=/Success|Completed|Invoice/i')).toBeVisible({ timeout: 5000 });

        return {
            success: true,
            saleId: saleResponse.data.id,
            invoiceNumber: saleResponse.data.invoiceNumber,
            total: saleResponse.data.total,
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Verify sale in database
 */
export async function verifySaleInDatabase(
    db: PrismaClient,
    saleId: string,
    expectedData: {
        status?: string;
        itemCount?: number;
        total?: number;
    }
): Promise<void> {
    const sale = await db.sale.findUnique({
        where: { id: saleId },
        include: {
            items: true,
            paymentSplits: true,
        },
    });

    if (!sale) {
        throw new Error(`Sale ${saleId} not found in database`);
    }

    if (expectedData.status && sale.status !== expectedData.status) {
        throw new Error(`Expected sale status "${expectedData.status}", got "${sale.status}"`);
    }

    if (expectedData.itemCount !== undefined && sale.items.length !== expectedData.itemCount) {
        throw new Error(`Expected ${expectedData.itemCount} items, got ${sale.items.length}`);
    }

    if (expectedData.total !== undefined) {
        const actualTotal = parseFloat(sale.total.toString());
        if (actualTotal !== expectedData.total) {
            throw new Error(`Expected total ${expectedData.total}, got ${actualTotal}`);
        }
    }
}

/**
 * Verify inventory was deducted
 */
export async function verifyInventoryDeduction(
    db: PrismaClient,
    drugId: string,
    expectedQuantityDeducted: number,
    initialQuantity: number
): Promise<void> {
    const batches = await db.inventoryBatch.findMany({
        where: { drugId },
        orderBy: { expiryDate: 'asc' },
    });

    const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
    const expectedTotal = initialQuantity - expectedQuantityDeducted;

    if (totalQuantity !== expectedTotal) {
        throw new Error(
            `Inventory mismatch: expected ${expectedTotal} (${initialQuantity} - ${expectedQuantityDeducted}), ` +
            `got ${totalQuantity}`
        );
    }
}
