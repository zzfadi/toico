import { test, expect } from '@playwright/test';
import { ConversionPage } from './helpers';

test.describe('SVG to ICO Converter - UI Interactions', () => {
  let conversionPage: ConversionPage;

  test.beforeEach(async ({ page }) => {
    conversionPage = new ConversionPage(page);
    await conversionPage.goto();
  });

  test('should support drag and drop file upload', async ({ page }) => {
    // Find the drop zone
    const dropZone = page.locator('[data-testid="file-drop-zone"]');
    await expect(dropZone).toBeVisible();
    
    // Simulate drag over
    await dropZone.dispatchEvent('dragover', {
      dataTransfer: await page.evaluateHandle(() => new DataTransfer())
    });
    
    // The drop zone should show visual feedback
    await expect(dropZone).toHaveClass(/drag.*over|active|highlight/i);
    
    // Simulate drag leave
    await dropZone.dispatchEvent('dragleave');
    
    // Visual feedback should be removed
    await expect(dropZone).not.toHaveClass(/drag.*over|active|highlight/i);
  });

  test('should show file picker when click on upload area', async ({ page }) => {
    // Click on the upload area
    const uploadArea = page.locator('[data-testid="file-drop-zone"]');
    await uploadArea.click();
    
    // File input should be triggered (we can't directly test file dialog, 
    // but we can verify the input element is properly set up)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', /image|svg/);
  });

  test('should display file information after upload', async ({ page }) => {
    await conversionPage.uploadFile('test-icon.svg');
    
    // Check file name is displayed
    await conversionPage.expectFileInfo('test-icon.svg');
    
    // Check that file format is detected
    const formatInfo = page.locator('[data-testid="file-format"]');
    await expect(formatInfo).toContainText('SVG');
  });

  test('should allow toggling preview sizes', async ({ page }) => {
    await conversionPage.uploadFile('test-icon.svg');
    await conversionPage.waitForPreviewGeneration();
    
    // All size checkboxes should be present
    const sizeCheckboxes = page.locator('[data-testid^="size-checkbox-"]');
    await expect(sizeCheckboxes).toHaveCount(6); // 6 different sizes
    
    // Toggle a specific size off
    const size64Checkbox = page.locator('[data-testid="size-checkbox-64"]');
    await size64Checkbox.uncheck();
    
    // Corresponding preview should be hidden or marked as disabled
    const preview64 = page.locator('[data-testid="preview-64"]');
    await expect(preview64).toHaveClass(/disabled|inactive|unchecked/i);
    
    // Toggle it back on
    await size64Checkbox.check();
    await expect(preview64).not.toHaveClass(/disabled|inactive|unchecked/i);
  });

  test('should show loading states during processing', async ({ page }) => {
    await conversionPage.uploadFile('test-icon.svg');
    
    // During preview generation, there should be loading indicators
    const loadingIndicator = page.locator('[data-testid="loading-previews"]');
    await expect(loadingIndicator).toBeVisible();
    
    // Wait for previews to complete
    await conversionPage.waitForPreviewGeneration();
    await expect(loadingIndicator).not.toBeVisible();
    
    // During conversion, convert button should show loading state
    const convertButton = page.locator('[data-testid="convert-button"]');
    await convertButton.click();
    
    await expect(convertButton).toContainText(/converting|processing/i);
    
    // Wait for conversion to complete
    await conversionPage.waitForConversion();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main header should still be visible and readable
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    
    // Upload area should be appropriately sized for touch
    const uploadArea = page.locator('[data-testid="file-drop-zone"]');
    await expect(uploadArea).toBeVisible();
    
    // Upload a file and check mobile layout
    await conversionPage.uploadFile('test-icon.svg');
    await conversionPage.waitForPreviewGeneration();
    
    // Preview images should be arranged appropriately for mobile
    const previewContainer = page.locator('[data-testid="preview-container"]');
    await expect(previewContainer).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through the interface
    await page.keyboard.press('Tab');
    
    // Should focus on the file input or upload area
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Upload a file
    await conversionPage.uploadFile('test-icon.svg');
    await conversionPage.waitForPreviewGeneration();
    
    // Tab to download button and activate with Enter (after conversion is complete)
    await conversionPage.uploadFile('test-icon.svg');
    await conversionPage.waitForPreviewGeneration();
    await conversionPage.waitForConversion();
    
    const downloadButton = page.locator('[data-testid="download-button"]');
    if (await downloadButton.isVisible()) {
      await downloadButton.focus();
      // We won't press Enter to avoid triggering download in test
      await expect(downloadButton).toBeFocused();
    }
  });

  test('should show preview images with correct dimensions', async ({ page }) => {
    await conversionPage.uploadFile('test-icon.svg');
    await conversionPage.waitForPreviewGeneration();
    
    // Check that each preview image has the correct display size
    const preview256 = page.locator('[data-testid="preview-256"] img');
    const preview64 = page.locator('[data-testid="preview-64"] img');
    const preview16 = page.locator('[data-testid="preview-16"] img');
    
    await expect(preview256).toBeVisible();
    await expect(preview64).toBeVisible();
    await expect(preview16).toBeVisible();
    
    // The previews should have different display sizes to show the scaling
    const bbox256 = await preview256.boundingBox();
    const bbox64 = await preview64.boundingBox();
    const bbox16 = await preview16.boundingBox();
    
    expect(bbox256?.width).toBeGreaterThan(bbox64?.width || 0);
    expect(bbox64?.width).toBeGreaterThan(bbox16?.width || 0);
  });

  test('should provide visual feedback for successful conversion', async ({ page }) => {
    await conversionPage.uploadFile('test-icon.svg');
    await conversionPage.waitForPreviewGeneration();
    
    await conversionPage.clickConvert();
    await conversionPage.waitForConversion();
    
    // Should show success message or indication
    const successIndicator = page.locator('[data-testid="conversion-success"]');
    await expect(successIndicator).toBeVisible();
    
    // Download button should be prominently displayed
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toHaveClass(/primary|prominent|success/i);
  });
});