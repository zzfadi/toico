import { test, expect } from '@playwright/test';
import { ConversionPage, DEFAULT_SELECTED_SIZES } from './helpers';

test.describe('SVG to ICO Converter - Happy Path', () => {
  let conversionPage: ConversionPage;

  test.beforeEach(async ({ page }) => {
    conversionPage = new ConversionPage(page);
    await conversionPage.goto();
  });

  test('should load the page with correct title and header', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Image to ICO Converter/);
    
    // Check main header
    const header = page.locator('h1');
    await expect(header).toContainText('Image to ICO Converter');
    
    // Check subtitle
    const subtitle = page.locator('p').first();
    await expect(subtitle).toContainText('Convert your images to ICO format instantly');
  });

  test('should upload SVG file and generate previews', async ({ page }) => {
    // Upload test SVG file
    await conversionPage.uploadFile('test-icon.svg');
    
    // Expect file info to be displayed
    await conversionPage.expectFileInfo('test-icon.svg');
    
    // Wait for previews to be generated
    await conversionPage.waitForPreviewGeneration();
    
    // Check that default preview sizes are shown
    await conversionPage.expectPreviewSizes(DEFAULT_SELECTED_SIZES);
  });

  test('should convert SVG to ICO and allow download', async ({ page }) => {
    // Upload test SVG file
    await conversionPage.uploadFile('test-icon.svg');
    
    // Wait for previews and automatic conversion
    await conversionPage.waitForPreviewGeneration();
    await conversionPage.waitForConversion();
    
    // Download the ICO file
    const download = await conversionPage.downloadIco();
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/\.ico$/);
    expect(await download.path()).toBeTruthy();
    
    // Verify file size is reasonable (should be > 1KB)
    const downloadPath = await download.path();
    if (downloadPath) {
      const fs = require('fs');
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB
    }
  });

  test('should handle large SVG files', async ({ page }) => {
    // Upload large SVG file
    await conversionPage.uploadFile('large-icon.svg');
    
    // Wait for previews and automatic conversion
    await conversionPage.waitForPreviewGeneration();
    await conversionPage.waitForConversion();
    
    const download = await conversionPage.downloadIco();
    expect(download.suggestedFilename()).toMatch(/\.ico$/);
  });

  test('should allow custom size selection', async ({ page }) => {
    // Upload test SVG file
    await conversionPage.uploadFile('test-icon.svg');
    
    // Wait for initial previews and conversion
    await conversionPage.waitForPreviewGeneration();
    await conversionPage.waitForConversion();
    
    // Select only specific sizes (this will trigger re-conversion)
    const customSizes = [256, 48, 16];
    await conversionPage.selectPreviewSizes(customSizes);
    
    // Wait for new conversion with custom sizes
    await conversionPage.waitForConversion();
    
    const download = await conversionPage.downloadIco();
    expect(download.suggestedFilename()).toMatch(/\.ico$/);
  });

  test('should maintain state during conversion process', async ({ page }) => {
    // Upload test SVG file
    await conversionPage.uploadFile('test-icon.svg');
    
    // Wait for previews
    await conversionPage.waitForPreviewGeneration();
    
    // Check that conversion starts automatically
    const loadingIndicator = page.locator('[data-testid="loading-previews"]');
    // The loading indicator might be gone by now, so we check if download button appears
    
    // After conversion, download button should be available
    await conversionPage.waitForConversion();
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();
  });
});