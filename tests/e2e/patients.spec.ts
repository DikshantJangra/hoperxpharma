import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
    test.beforeEach(async ({ page }) => {
        // Mock auth or login
        await page.goto('/login');
        await page.fill('input[name="email"]', 'pharmacist@hoperx.com');
        await page.fill('input[name="password"]', 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
    });

    test('should create a new patient via Quick Add', async ({ page }) => {
        await page.goto('/patients/list');

        // Open Quick Add (F3)
        await page.keyboard.press('F3');
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill form
        await page.fill('input[name="firstName"]', 'John');
        await page.fill('input[name="lastName"]', 'Doe');
        await page.fill('input[name="phoneNumber"]', '9876543210');

        // Submit
        await page.click('button:has-text("Create Patient")');

        // Verify redirect or success
        await expect(page.getByText('Patient created successfully')).toBeVisible();
    });

    test('should search for a patient', async ({ page }) => {
        await page.goto('/patients/list');

        // Search
        await page.fill('input[placeholder*="Search"]', 'John Doe');
        await page.waitForTimeout(500); // Debounce

        // Verify results
        await expect(page.getByText('John Doe')).toBeVisible();
        await expect(page.getByText('9876543210')).toBeVisible();
    });

    test('should process a refill', async ({ page }) => {
        // Go to patient profile
        await page.goto('/patients/list');
        await page.click('text=John Doe');

        // Open Refill Modal
        await page.click('button:has-text("Refill")');
        await expect(page.getByRole('dialog')).toBeVisible();

        // Select item
        await page.click('text=Metformin'); // Assuming mock data or seeded data

        // Process
        await page.click('button:has-text("Process Refill")');

        // Verify success (optimistic UI)
        await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('should upload a prescription', async ({ page }) => {
        await page.goto('/patients/list');
        await page.click('text=John Doe');

        await page.click('button:has-text("Upload Rx")');

        // Upload file
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Select File');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles('tests/fixtures/prescription.jpg');

        // Verify preview
        await expect(page.getByAltText('Preview')).toBeVisible();

        // Save
        await page.click('button:has-text("Save Prescription")');
        await expect(page.getByRole('dialog')).toBeHidden();
    });
});
