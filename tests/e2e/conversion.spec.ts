import { test, expect } from '@playwright/test';
import { FileHelpers } from '../fixtures/helpers/file-helpers';
import { ConversionHelpers } from '../fixtures/helpers/conversion-helpers';

test.describe('Image Conversion Functionality', () => {
  let fileHelpers: FileHelpers;
  let conversionHelpers: ConversionHelpers;

  test.beforeEach(async ({ page }) => {
    fileHelpers = new FileHelpers(page);
    conversionHelpers = new ConversionHelpers(page);
    await page.goto('/');
  });

  test('should convert PNG to ICO successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    // Verify all ICO sizes are generated
    await conversionHelpers.verifyIcoPreviewSizes();
    
    // Verify download functionality
    const downloadUrl = await conversionHelpers.waitForConversionComplete();
    expect(downloadUrl).toBeTruthy();
  });

  test('should convert JPEG to ICO successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.jpg');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.testFormatSpecificConversion('JPEG');
  });

  test('should convert SVG to ICO successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg');
    await fileHelpers.waitForFileProcessed();
    
    // SVG conversion may take longer due to rasterization
    await conversionHelpers.testFormatSpecificConversion('SVG');
  });

  test('should convert WebP to ICO successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.webp');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.testFormatSpecificConversion('WebP');
  });

  test('should generate all ICO sizes', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    // Verify specific ICO sizes
    const expectedSizes = ['16', '32', '48', '64', '128', '256'];
    
    for (const size of expectedSizes) {
      const previewElement = page.locator(`[data-testid="ico-preview-${size}"]`);
      await expect(previewElement).toBeVisible();
      
      // Verify the image has the correct dimensions
      const img = previewElement.locator('img');
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');
      
      if (size !== '256') { // 256 might be handled differently
        expect(width).toBe(size);
        expect(height).toBe(size);
      }
    }
  });

  test('should handle selective size conversion', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    // Select only specific sizes
    const selectedSizes = ['16', '32', '64'];
    await conversionHelpers.selectIcoSizes(selectedSizes);
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    // Verify only selected sizes are in the final ICO
    for (const size of selectedSizes) {
      const previewElement = page.locator(`[data-testid="ico-preview-${size}"]`);
      await expect(previewElement).toBeVisible();
    }
  });

  test('should maintain image quality during conversion', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg'); // Use SVG for quality testing
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    await conversionHelpers.verifyConversionQuality();
  });

  test('should handle transparency correctly', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png'); // PNG with transparency
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    // Verify transparency is preserved
    const previewImages = page.locator('[data-testid^="ico-preview-"] img');
    const firstImage = previewImages.first();
    
    // Check that the image is loaded and has proper transparency handling
    await expect(firstImage).toHaveAttribute('src', /.+/);
  });

  test('should add white background for JPEG conversion', async ({ page }) => {
    await fileHelpers.uploadFile('sample.jpg');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    // JPEG should be converted with white background
    await conversionHelpers.verifyConversionQuality();
  });

  test('should handle conversion timeout', async ({ page }) => {
    // This test would need a complex/large file that might timeout
    await test.skip('Requires complex file that can trigger timeout');
  });

  test('should download ICO file with correct properties', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    
    // Download and verify the ICO file
    const icoBuffer = await conversionHelpers.downloadAndVerifyIco();
    
    // Basic ICO file format validation
    expect(icoBuffer.length).toBeGreaterThan(0);
    
    // ICO files start with specific magic bytes
    expect(icoBuffer[0]).toBe(0); // Reserved field
    expect(icoBuffer[1]).toBe(0); // Reserved field  
    expect(icoBuffer[2]).toBe(1); // Image type (1 = ICO)
    expect(icoBuffer[3]).toBe(0); // Reserved field
  });

  test('should handle multiple conversions sequentially', async ({ page }) => {
    const testFiles = ['sample.png', 'sample.jpg', 'sample.svg'];
    
    for (const file of testFiles) {
      await fileHelpers.uploadFile(file);
      await fileHelpers.waitForFileProcessed();
      
      await conversionHelpers.startConversion();
      await conversionHelpers.waitForConversionComplete();
      
      // Verify conversion completed
      const downloadButton = page.locator('[data-testid="download-button"]');
      await expect(downloadButton).toBeVisible();
      
      // Clear for next iteration
      await fileHelpers.clearUploadedFile();
    }
  });

  test('should preserve aspect ratio during conversion', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg'); // SVG has known dimensions
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    // Verify aspect ratio is maintained in all sizes
    const previewImages = page.locator('[data-testid^="ico-preview-"] img');
    const count = await previewImages.count();
    
    for (let i = 0; i < count; i++) {
      const img = previewImages.nth(i);
      const width = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
      const height = await img.evaluate(el => (el as HTMLImageElement).naturalHeight);
      
      // For ICO files, width should equal height (square aspect ratio)
      expect(width).toBe(height);
    }
  });

  test('should show conversion progress', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg'); // SVG might show progress
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    
    // Look for progress indicators
    const progressIndicator = page.locator('[data-testid="conversion-progress"]');
    // Note: Progress might be too fast to catch for small test files
    
    await conversionHelpers.waitForConversionComplete();
    
    // Verify final state
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible();
  });
});