import { Page, expect } from '@playwright/test';
import * as path from 'path';

export class FileHelpers {
  constructor(private page: Page) {}

  /**
   * Upload a file using the file input
   */
  async uploadFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '..', 'fixtures', 'images', filePath));
  }

  /**
   * Upload a file using drag and drop
   */
  async dragAndDropFile(filePath: string, dropZoneSelector: string = '[data-testid="drop-zone"]') {
    const fullPath = path.join(__dirname, '..', 'fixtures', 'images', filePath);
    
    // Create a data transfer with the file
    const dataTransfer = await this.page.evaluateHandle((filePath) => {
      const dt = new DataTransfer();
      // Note: In real tests, we would need actual file objects
      // This is a simplified version for demonstration
      return dt;
    }, fullPath);

    const dropZone = this.page.locator(dropZoneSelector);
    await dropZone.dispatchEvent('drop', { dataTransfer });
  }

  /**
   * Wait for file to be processed and preview to be shown
   */
  async waitForFileProcessed() {
    await expect(this.page.locator('[data-testid="image-preview"]')).toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for conversion to complete
   */
  async waitForConversionComplete() {
    await expect(this.page.locator('[data-testid="download-button"]')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Verify file upload error message
   */
  async verifyUploadError(expectedMessage: string) {
    const errorMessage = this.page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(expectedMessage);
  }

  /**
   * Get file metadata from the UI
   */
  async getFileMetadata() {
    const metadata = {
      format: await this.page.locator('[data-testid="file-format"]').textContent(),
      dimensions: await this.page.locator('[data-testid="file-dimensions"]').textContent(),
      size: await this.page.locator('[data-testid="file-size"]').textContent(),
    };
    return metadata;
  }

  /**
   * Clear uploaded file and reset state
   */
  async clearUploadedFile() {
    const clearButton = this.page.locator('[data-testid="clear-file-button"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  /**
   * Verify supported file formats are displayed
   */
  async verifySupportedFormats() {
    const supportedFormats = ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'SVG'];
    for (const format of supportedFormats) {
      await expect(this.page.locator(`text=${format}`)).toBeVisible();
    }
  }
}