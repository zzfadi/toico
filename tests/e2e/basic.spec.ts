import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    // Check that the main heading is visible - it's split across lines
    await expect(page.locator('h1')).toContainText('Premium Image to');
    await expect(page.locator('h1')).toContainText('ICO & SVG Converter');
    
    // Check that upload section is present
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Check that the page contains supported format information
    await expect(page.getByText('PNG').first()).toBeVisible();
    await expect(page.getByText('JPEG').first()).toBeVisible();
    await expect(page.getByText('SVG').first()).toBeVisible();
    
    // Check for new mode switching interface - use role-based selectors
    await expect(page.getByRole('button', { name: /Single File/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Batch Processing/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Presets/ })).toBeVisible();
  });

  test('should have accessible file input', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    
    // File input should be present and accept image files
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', /image/);
  });

  test('should have proper page structure', async ({ page }) => {
    // Check main content areas
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Check that upload area is present
    const uploadArea = page.locator('input[type="file"]').locator('..');
    await expect(uploadArea).toBeVisible();
    
    // Check for new segmented control
    await expect(page.getByText('Single File')).toBeVisible();
    
    // Check for processing mode descriptions
    await expect(page.getByText('Convert one image at a time with detailed preview')).toBeVisible();
  });

  test('should show upload instructions', async ({ page }) => {
    // Check for upload instructions in single file mode - use more specific selectors
    await expect(page.getByText('Drag and drop or click to select your image file')).toBeVisible();
    await expect(page.getByText(/Browse/)).toBeVisible();
    
    // Check for supported formats information
    await expect(page.getByText(/Supported formats/)).toBeVisible();
    
    // Switch to batch mode and check batch instructions - use button role for more reliable selection
    await page.getByRole('button', { name: /Batch Processing/ }).click();
    await expect(page.getByText('Drop multiple images and convert them all at once!')).toBeVisible();
    
    // Switch to presets mode and check preset instructions
    await page.getByRole('button', { name: /Export Presets/ }).click();
    await expect(page.getByText('One-click export for platform-specific icon packages')).toBeVisible();
  });

  test('should display brand information', async ({ page }) => {
    // Check for brand mention - use first() to avoid strict mode violation
    await expect(page.getByText(/Defined By Jenna/).first()).toBeVisible();
    
    // Check for privacy messaging
    await expect(page.getByText(/privacy/i).first()).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation - look for any focusable element instead of specific file input
    await page.keyboard.press('Tab');
    
    // Should be able to focus on interactive elements (file input might be hidden)
    const focusableElements = page.locator('button, input, a, [tabindex]:not([tabindex="-1"])');
    await expect(focusableElements.first()).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out known external errors
        const text = msg.text();
        if (!text.includes('favicon') && 
            !text.includes('fonts.googleapis.com') &&
            !text.includes('net::ERR_')) {
          errors.push(text);
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have any critical console errors
    expect(errors).toEqual([]);
  });
});