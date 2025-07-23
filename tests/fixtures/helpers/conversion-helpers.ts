import { Page, expect } from '@playwright/test';

export class ConversionHelpers {
  constructor(private page: Page) {}

  /**
   * Start the ICO conversion process
   */
  async startConversion() {
    const convertButton = this.page.locator('[data-testid="convert-button"]');
    await expect(convertButton).toBeVisible();
    await convertButton.click();
  }

  /**
   * Wait for conversion to complete and return download URL
   */
  async waitForConversionComplete(): Promise<string> {
    // Wait for the download button to appear
    const downloadButton = this.page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible({ timeout: 15000 });
    
    // Get the download URL
    const downloadUrl = await downloadButton.getAttribute('href');
    return downloadUrl || '';
  }

  /**
   * Verify ICO preview sizes are generated
   */
  async verifyIcoPreviewSizes() {
    const expectedSizes = ['16', '32', '48', '64', '128', '256'];
    
    for (const size of expectedSizes) {
      const previewElement = this.page.locator(`[data-testid="ico-preview-${size}"]`);
      await expect(previewElement).toBeVisible();
      
      // Verify the image is loaded
      await expect(previewElement.locator('img')).toHaveAttribute('src', /.+/);
    }
  }

  /**
   * Download the ICO file and verify it
   */
  async downloadAndVerifyIco(): Promise<Buffer> {
    const downloadButton = this.page.locator('[data-testid="download-button"]');
    
    // Start waiting for download before clicking
    const downloadPromise = this.page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    
    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/\.ico$/);
    
    // Return the downloaded file buffer for further verification
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      return fs.readFileSync(path);
    }
    throw new Error('Download path not available');
  }

  /**
   * Verify conversion error handling
   */
  async verifyConversionError(expectedMessage: string) {
    const errorMessage = this.page.locator('[data-testid="conversion-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(expectedMessage);
  }

  /**
   * Verify conversion timeout handling
   */
  async verifyConversionTimeout() {
    // Wait for timeout error (should appear within 20 seconds for timeout)
    const timeoutError = this.page.locator('[data-testid="timeout-error"]');
    await expect(timeoutError).toBeVisible({ timeout: 25000 });
  }

  /**
   * Select specific ICO sizes for conversion
   */
  async selectIcoSizes(sizes: string[]) {
    // First, uncheck all sizes
    const allSizeCheckboxes = this.page.locator('[data-testid^="size-checkbox-"]');
    const count = await allSizeCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      const checkbox = allSizeCheckboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }
    
    // Then check only the requested sizes
    for (const size of sizes) {
      const checkbox = this.page.locator(`[data-testid="size-checkbox-${size}"]`);
      await checkbox.check();
    }
  }

  /**
   * Verify the quality of the converted image
   */
  async verifyConversionQuality() {
    // Check that images are rendered properly
    const previewImages = this.page.locator('[data-testid^="ico-preview-"] img');
    const count = await previewImages.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify each image has proper dimensions and is loaded
    for (let i = 0; i < count; i++) {
      const img = previewImages.nth(i);
      await expect(img).toHaveAttribute('src', /.+/);
      
      // Verify image is actually loaded (not broken)
      const naturalWidth = await img.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  }

  /**
   * Test conversion with different file formats
   */
  async testFormatSpecificConversion(format: string) {
    // Different formats may have different processing times
    const timeouts = {
      'PNG': 10000,
      'JPEG': 8000,
      'WebP': 12000,
      'GIF': 15000,
      'BMP': 8000,
      'SVG': 20000, // SVG takes longer due to rasterization
    };
    
    const timeout = timeouts[format as keyof typeof timeouts] || 10000;
    
    await this.waitForConversionComplete();
    await this.verifyIcoPreviewSizes();
    
    // Format-specific validations
    if (format === 'SVG') {
      // SVG should be rasterized properly
      await this.verifyConversionQuality();
    }
  }
}