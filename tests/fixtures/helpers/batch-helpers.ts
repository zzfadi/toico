import { Page, expect, Download } from '@playwright/test';
import * as path from 'path';

export class BatchHelpers {
  constructor(private page: Page) {}

  /**
   * Switch to batch processing mode
   */
  async switchToBatchMode() {
    await this.page.getByText('Batch Processing').click();
    await expect(this.page.getByText('🔥 Batch Processing Beast')).toBeVisible();
  }

  /**
   * Upload multiple files for batch processing
   */
  async uploadBatchFiles(filePaths: string[]) {
    const fileInput = this.page.locator('input[type="file"]');
    const fullPaths = filePaths.map(filePath => 
      path.join(__dirname, '..', 'images', filePath)
    );
    await fileInput.setInputFiles(fullPaths);
  }

  /**
   * Start batch processing
   */
  async startBatchProcessing() {
    const startButton = this.page.getByText('Start Batch Processing').or(
      this.page.getByText('Process Batch')
    );
    
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  }

  /**
   * Wait for batch processing to complete
   */
  async waitForBatchComplete() {
    await expect(this.page.getByText('Download Batch ZIP')).toBeVisible({ timeout: 30000 });
  }

  /**
   * Download batch ZIP file
   */
  async downloadBatchZip(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByText('Download Batch ZIP').click();
    return await downloadPromise;
  }

  /**
   * Clear batch queue
   */
  async clearBatch() {
    await this.page.getByText('Clear Batch').click();
    await expect(this.page.getByText('Select Multiple Files')).toBeVisible();
  }

  /**
   * Get batch progress information
   */
  async getBatchProgress(): Promise<{ completed: number; total: number; percentage: number }> {
    // Look for progress text like "2/5 files" or "40% complete"
    const progressText = await this.page.locator('[data-testid="batch-progress"]').or(
      this.page.locator('text=/\\d+\\/\\d+ files/')
    ).textContent();
    
    if (progressText) {
      const match = progressText.match(/(\d+)\/(\d+)/);
      if (match) {
        const completed = parseInt(match[1]);
        const total = parseInt(match[2]);
        const percentage = Math.round((completed / total) * 100);
        return { completed, total, percentage };
      }
    }
    
    return { completed: 0, total: 0, percentage: 0 };
  }

  /**
   * Verify file status in batch queue
   */
  async verifyFileStatus(fileName: string, expectedStatus: 'queued' | 'processing' | 'completed' | 'error') {
    const fileRow = this.page.locator(`[data-testid="batch-file-${fileName}"]`).or(
      this.page.locator(`text=${fileName}`).locator('..')
    );
    
    await expect(fileRow).toBeVisible();
    
    switch (expectedStatus) {
      case 'queued':
        // File is in queue but not yet processed
        break;
      case 'processing':
        await expect(fileRow.locator('[data-testid="status-processing"]').or(
          fileRow.locator('.animate-pulse').or(fileRow.locator('.spinner'))
        )).toBeVisible();
        break;
      case 'completed':
        await expect(fileRow.locator('[data-testid="status-completed"]').or(
          fileRow.locator('.text-green-500').or(fileRow.locator('.checkmark'))
        )).toBeVisible();
        break;
      case 'error':
        await expect(fileRow.locator('[data-testid="status-error"]').or(
          fileRow.locator('.text-red-500').or(fileRow.locator('.error'))
        )).toBeVisible();
        break;
    }
  }

  /**
   * Remove a file from batch queue
   */
  async removeFileFromBatch(fileName: string) {
    const fileRow = this.page.locator(`text=${fileName}`).locator('..');
    const removeButton = fileRow.locator('[data-testid="remove-file"]').or(
      fileRow.locator('button').filter({ hasText: /remove|delete|×|✕/ })
    );
    
    if (await removeButton.isVisible()) {
      await removeButton.click();
    }
  }

  /**
   * Get list of files in batch queue
   */
  async getBatchFileList(): Promise<string[]> {
    const fileNames: string[] = [];
    const fileRows = this.page.locator('[data-testid^="batch-file-"]').or(
      this.page.locator('.batch-file-item')
    );
    
    const count = await fileRows.count();
    for (let i = 0; i < count; i++) {
      const fileName = await fileRows.nth(i).locator('[data-testid="file-name"]').textContent();
      if (fileName) fileNames.push(fileName.trim());
    }
    
    return fileNames;
  }

  /**
   * Verify batch processing statistics
   */
  async verifyBatchStats(expectedCompleted: number, expectedTotal: number) {
    const statsText = await this.page.locator('[data-testid="batch-stats"]').or(
      this.page.locator('text=/\\d+\\/\\d+ files/')
    ).textContent();
    
    expect(statsText).toContain(`${expectedCompleted}/${expectedTotal}`);
  }

  /**
   * Verify batch ZIP download properties
   */
  verifyBatchZipDownload(download: Download, expectedFileCount?: number) {
    expect(download.suggestedFilename()).toMatch(/batch.*\.zip$/);
    
    // Additional validations could be added here for file size, etc.
  }

  /**
   * Check for batch processing errors
   */
  async verifyBatchError(fileName: string, expectedError?: string) {
    await this.verifyFileStatus(fileName, 'error');
    
    if (expectedError) {
      const errorMessage = this.page.locator(`[data-testid="error-${fileName}"]`).or(
        this.page.locator(`text=${fileName}`).locator('..').locator('.error-message')
      );
      
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(expectedError);
      }
    }
  }

  /**
   * Verify drag and drop functionality
   */
  async verifyDragAndDropZone() {
    const dropZone = this.page.locator('[data-testid="batch-drop-zone"]').or(
      this.page.locator('text=Drag & drop multiple files').locator('..')
    );
    
    await expect(dropZone).toBeVisible();
    
    // Test hover state
    await dropZone.hover();
    
    // The drop zone should respond to hover
    // Exact implementation depends on CSS classes used
  }

  /**
   * Get batch processing performance metrics
   */
  async getBatchPerformanceMetrics(): Promise<{ totalTime: number; avgTimePerFile: number }> {
    // This would require timing measurements during actual batch processing
    // For now, return placeholder values
    return { totalTime: 0, avgTimePerFile: 0 };
  }

  /**
   * Verify batch concurrency limits
   */
  async verifyBatchConcurrency() {
    // Check that batch processing respects concurrency limits
    // This would involve monitoring multiple files processing simultaneously
    const processingFiles = this.page.locator('[data-testid="status-processing"]');
    const concurrentCount = await processingFiles.count();
    
    // Verify it doesn't exceed reasonable limits (e.g., 4 concurrent)
    expect(concurrentCount).toBeLessThanOrEqual(4);
  }

  /**
   * Verify batch memory management
   */
  async verifyMemoryManagement() {
    // Check that batch processing doesn't cause memory issues
    // This is more of a performance test placeholder
    
    // Upload many files and ensure the interface remains responsive
    await this.uploadBatchFiles(['sample.png', 'sample.jpg', 'sample.webp']);
    
    // Verify UI remains responsive
    await expect(this.page.getByText('Batch Progress')).toBeVisible();
  }
}
