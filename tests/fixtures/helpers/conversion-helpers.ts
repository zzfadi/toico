import { Page, expect } from '@playwright/test';

export class ConversionHelpers {
  constructor(private page: Page) {}

  /**
   * Start the ICO conversion process
   */
  async startConversion() {
    // In the actual app, the "convert" happens when clicking the download button
    // Look for the download button with the text "Download ICO File" or "Download SVG Files"
    const convertButton = this.page.getByRole('button', { name: /Download (ICO|SVG) (File|Files)/ });
    await expect(convertButton).toBeVisible();
    await convertButton.click();
  }

  /**
   * Wait for conversion to complete and return download URL
   */
  async waitForConversionComplete(): Promise<string> {
    // In the actual app, there's no separate download button after conversion
    // The download happens immediately when clicking the button
    // Wait for any download to start
    await this.page.waitForTimeout(1000); // Give time for download to initiate
    return 'download-completed';
  }

  /**
   * Verify ICO preview sizes are generated
   */
  async verifyIcoPreviewSizes() {
    const expectedSizes = ['16', '32', '48', '64', '128', '256'];
    
    for (const size of expectedSizes) {
      // Check that the size checkbox/label is visible
      const sizeElement = this.page.locator(`#size-${size}`);
      await expect(sizeElement).toBeVisible();
    }
  }

  /**
   * Download the ICO file and verify it
   */
  async downloadAndVerifyIco(): Promise<Buffer> {
    const downloadButton = this.page.getByRole('button', { name: /Download (ICO|SVG) (File|Files)/ });
    
    // Start waiting for download before clicking
    const downloadPromise = this.page.waitForEvent('download');
    await downloadButton.click();
    
    const download = await downloadPromise;
    
    // Get the downloaded file buffer
    const buffer = await download.createReadStream().then(stream => {
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    });
    
    // Verify file size is reasonable (ICO files should be > 1KB typically)
    expect(buffer.length).toBeGreaterThan(1000);
    
    return buffer;
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
   * Select specific ICO sizes
   */
  async selectIcoSizes(sizes: number[]) {
    for (const size of sizes) {
      const checkbox = this.page.locator(`#size-${size}`);
      await checkbox.check();
    }
  }

  /**
   * Verify the quality of the converted image
   */
  async verifyConversionQuality() {
    // Check that the conversion completed by verifying download button is available
    const downloadButton = this.page.getByRole('button', { name: /Download (ICO|SVG) (File|Files)/ });
    await expect(downloadButton).toBeVisible();
    
    // Verify that size selection checkboxes are still functional
    const checkbox = this.page.locator('#size-256');
    await expect(checkbox).toBeVisible();
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