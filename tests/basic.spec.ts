import { test, expect } from '@playwright/test';

test.describe('Basic Page Load Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Image to ICO Converter/);
    
    // Check main header is visible
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Image to ICO Converter');
  });

  test('should show upload area', async ({ page }) => {
    await page.goto('/');
    
    // Check that file drop zone exists
    const dropZone = page.locator('[data-testid="file-drop-zone"]');
    await expect(dropZone).toBeVisible();
    
    // Check that it contains expected text
    await expect(page.getByText('Drag & Drop your image here')).toBeVisible();
  });
});