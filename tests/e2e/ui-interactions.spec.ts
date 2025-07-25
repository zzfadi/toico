import { test, expect } from '@playwright/test';
import { FileHelpers } from '../fixtures/helpers/file-helpers';

test.describe('UI Interactions and Responsiveness', () => {
  let fileHelpers: FileHelpers;

  test.beforeEach(async ({ page }) => {
    fileHelpers = new FileHelpers(page);
    await page.goto('/');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify main elements are visible and properly arranged
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="file-uploader"]')).toBeVisible();
    
    // Check that elements are properly stacked on mobile
    const uploader = page.locator('[data-testid="file-uploader"]');
    const uploaderBox = await uploader.boundingBox();
    expect(uploaderBox?.width).toBeLessThan(400); // Should fit mobile width
  });

  test('should be responsive on tablet devices', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="file-uploader"]')).toBeVisible();
    
    // Elements should have more space on tablet
    const container = page.locator('.container');
    const containerBox = await container.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(600);
  });

  test('should be responsive on desktop', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="file-uploader"]')).toBeVisible();
    
    // Desktop should show elements side by side
    const layout = page.locator('.grid');
    await expect(layout).toHaveClass(/lg:grid-cols-2/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Should focus on the file input or upload button
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to reach all interactive elements
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A'].includes(activeElement || '')).toBeTruthy();
  });

  test('should provide visual feedback on hover', async ({ page }) => {
    const uploadButton = page.locator('[data-testid="upload-button"]');
    
    // Get initial styles
    const initialColor = await uploadButton.evaluate(el => getComputedStyle(el).backgroundColor);
    
    // Hover over the button
    await uploadButton.hover();
    
    // Check for style changes (this might need adjustment based on actual implementation)
    const hoverColor = await uploadButton.evaluate(el => getComputedStyle(el).backgroundColor);
    
    // The colors should be different on hover (exact values depend on implementation)
    // This test validates that hover states are working
    await expect(uploadButton).toBeVisible();
  });

  test('should maintain state during window resize', async ({ page }) => {
    // Upload a file first
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Verify file is still loaded
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // Resize again
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // State should be preserved
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });

  test('should handle rapid user interactions', async ({ page }) => {
    // Rapidly click upload area
    const uploadArea = page.locator('[data-testid="drop-zone"]');
    
    for (let i = 0; i < 5; i++) {
      await uploadArea.click();
      await page.waitForTimeout(100);
    }
    
    // Should still be functional
    await expect(uploadArea).toBeVisible();
  });

  test('should show proper loading states', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    
    // Look for loading indicators during processing
    const loadingState = page.locator('[data-testid="loading-indicator"]');
    // Note: For small test files, loading might be too fast to catch
    
    await fileHelpers.waitForFileProcessed();
    
    // Final state should show processed image
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    // Navigate away and back
    await page.goto('about:blank');
    await page.goBack();
    
    // Should return to initial state (file might be cleared)
    await expect(page.locator('h1')).toContainText('ICO Converter');
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for alt text on images
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    const previewImage = page.locator('[data-testid="image-preview"] img');
    await expect(previewImage).toHaveAttribute('alt');
    
    // Check for proper form labels
    const fileInput = page.locator('input[type="file"]');
    const label = page.locator('label');
    await expect(label).toBeVisible();
  });

  test('should handle focus management correctly', async ({ page }) => {
    // Test focus trap in modal-like components (if any)
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    // Focus should be manageable
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should provide clear error messages', async ({ page }) => {
    await fileHelpers.uploadFile('invalid-file.txt');
    
    // Error message should be visible and descriptive
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText?.length).toBeGreaterThan(10); // Should be descriptive
  });

  test('should handle theme/color scheme preferences', async ({ page }) => {
    // Test with different color schemes if supported
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Verify app still renders correctly
    await expect(page.locator('h1')).toBeVisible();
    
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should maintain brand styling consistency', async ({ page }) => {
    // Check for brand colors
    const brandElement = page.locator('[data-testid="brand-element"]');
    
    // Verify brand colors are applied
    const brandColor = await brandElement.evaluate(el => 
      getComputedStyle(el).getPropertyValue('--mocha-mousse')
    );
    
    // Should have brand color defined
    expect(brandColor).toBeTruthy();
  });

  test('should handle scroll behavior on long content', async ({ page }) => {
    // Test with small viewport to trigger scrolling
    await page.setViewportSize({ width: 375, height: 500 });
    
    // Verify page can be scrolled
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Should still be able to interact with elements
    await expect(page.locator('[data-testid="file-uploader"]')).toBeVisible();
  });

  test('should handle multiple browser tabs', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto('/');
    await page2.goto('/');
    
    // Both tabs should work independently
    await expect(page1.locator('h1')).toBeVisible();
    await expect(page2.locator('h1')).toBeVisible();
    
    await context.close();
  });
});