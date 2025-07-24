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

  /**
   * Upload multiple files for batch processing
   */
  async uploadMultipleFiles(filePaths: string[]) {
    const fileInput = this.page.locator('input[type="file"]');
    const fullPaths = filePaths.map(filePath => 
      path.join(__dirname, '..', 'images', filePath)
    );
    await fileInput.setInputFiles(fullPaths);
  }

  /**
   * Wait for batch processing to complete
   */
  async waitForBatchProcessingComplete() {
    await expect(this.page.getByText('Download Batch ZIP')).toBeVisible({ timeout: 30000 });
  }

  /**
   * Get batch processing progress information
   */
  async getBatchProgress() {
    const progressText = await this.page.locator('[data-testid="batch-progress"]').or(
      this.page.locator('text=/\\d+\\/\\d+ files/')
    ).textContent();
    return progressText;
  }

  /**
   * Verify batch file status
   */
  async verifyBatchFileStatus(fileName: string, expectedStatus: 'processing' | 'completed' | 'error') {
    const fileRow = this.page.locator(`[data-testid="batch-file-${fileName}"]`).or(
      this.page.locator(`text=${fileName}`).locator('..')
    );
    
    await expect(fileRow).toBeVisible();
    
    switch (expectedStatus) {
      case 'processing':
        await expect(fileRow.locator('[data-testid="status-processing"]').or(
          fileRow.locator('.animate-pulse')
        )).toBeVisible();
        break;
      case 'completed':
        await expect(fileRow.locator('[data-testid="status-completed"]').or(
          fileRow.locator('.text-green-500')
        )).toBeVisible();
        break;
      case 'error':
        await expect(fileRow.locator('[data-testid="status-error"]').or(
          fileRow.locator('.text-red-500')
        )).toBeVisible();
        break;
    }
  }

  /**
   * Clear batch processing queue
   */
  async clearBatchQueue() {
    const clearButton = this.page.getByText('Clear Batch');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  /**
   * Download batch ZIP file
   */
  async downloadBatchZip() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByText('Download Batch ZIP').click();
    return await downloadPromise;
  }
}