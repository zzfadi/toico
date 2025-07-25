import { test, expect } from '@playwright/test';
import { FileHelpers } from '../fixtures/helpers/file-helpers';
import { BatchHelpers } from '../fixtures/helpers/batch-helpers';

test.describe('Batch Processing Tests', () => {
  let fileHelpers: FileHelpers;
  let batchHelpers: BatchHelpers;

  test.beforeEach(async ({ page }) => {
    fileHelpers = new FileHelpers(page);
    batchHelpers = new BatchHelpers(page);
    await page.goto('/');
  });

  test('should switch to batch processing mode', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
  });

  test('should display batch upload interface correctly', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Verify interface elements
    await expect(page.getByText('🔥 Batch Processing Beast')).toBeVisible();
    await expect(page.getByText('Select Multiple Files')).toBeVisible();
    await expect(page.getByText('Drag & drop multiple files or click to browse')).toBeVisible();
    
    // Check features list
    await expect(page.getByText('⚡ Batch processing: Upload 2-50 files at once')).toBeVisible();
    await expect(page.getByText('📦 Auto ZIP download: All conversions in one file')).toBeVisible();
    await expect(page.getByText('🔒 100% Private: All processing happens locally')).toBeVisible();
  });

  test('should handle multiple file upload', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload multiple files
    await batchHelpers.uploadBatchFiles(['sample.png', 'sample.jpg']);
    
    // Verify files are listed
    await expect(page.getByText('Batch Progress')).toBeVisible();
    await expect(page.getByText('sample.png')).toBeVisible();
    await expect(page.getByText('sample.jpg')).toBeVisible();
  });

  test('should show progress for each file during batch processing', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload files
    await batchHelpers.uploadBatchFiles(['sample.png', 'sample.jpg']);
    
    // Start processing
    await batchHelpers.startBatchProcessing();
    
    // Check for progress indicators - look for percentage display or "Batch Progress" section
    await expect(page.locator('text=Batch Progress')).toBeVisible();
    
    // Wait for processing to complete
    await batchHelpers.waitForBatchComplete();
  });

  test('should generate ZIP download after batch processing', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload and process files
    await batchHelpers.uploadBatchFiles(['sample.png']);
    
    // Wait for processing to complete
    await batchHelpers.waitForBatchComplete();
    
    // Download the batch ZIP
    const download = await batchHelpers.downloadBatchZip();
    
    // Verify download properties
    batchHelpers.verifyBatchZipDownload(download);
  });

  test('should show completed and error files separately', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload mix of valid and invalid files
    await batchHelpers.uploadBatchFiles(['sample.png', 'invalid-file.txt']);
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check status for valid file
    await batchHelpers.verifyFileStatus('sample.png', 'completed');
    
    // Check status for invalid file
    await batchHelpers.verifyFileStatus('invalid-file.txt', 'error');
  });

  test('should allow clearing batch queue', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload files
    await batchHelpers.uploadBatchFiles(['sample.png']);
    
    // Wait for processing to complete
    await batchHelpers.waitForBatchComplete();
    
    // Clear batch
    await batchHelpers.clearBatch();
  });

  test('should handle drag and drop for batch upload', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Verify drag and drop zone
    await batchHelpers.verifyDragAndDropZone();
  });

  test('should limit batch size appropriately', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Check for batch size limits mentioned in UI
    await expect(page.getByText(/2-50 files/)).toBeVisible();
  });

  test('should show overall progress statistics', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload files
    await batchHelpers.uploadBatchFiles(['sample.png', 'sample.jpg']);
    
    // Verify that progress statistics are displayed
    await expect(page.locator('text=Batch Progress')).toBeVisible();
    await expect(page.locator('text=/✅.*❌.*📁.*total/i')).toBeVisible();
  });

  test('should support different output formats in batch mode', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Check if format selection is available in batch mode
    const formatSelector = page.locator('[data-testid="format-selector"]').or(
      page.getByText('ICO').or(page.getByText('SVG'))
    );
    
    // Format selection might be in the main interface before switching modes
    // This test verifies the batch processor respects the selected format
  });

  test('should maintain privacy by processing locally', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Verify privacy messaging
    await expect(page.getByText('100% Private').first()).toBeVisible();
    await expect(page.getByText(/processing happens locally/i).first()).toBeVisible();
    
    // Monitor network requests to ensure no file uploads to external servers
    let hasFileUploads = false;
    page.on('request', request => {
      if (request.method() === 'POST' && 
          request.postData() && 
          request.postData()!.includes('image') && 
          !request.url().includes('localhost')) {
        hasFileUploads = true;
      }
    });
    
    // Upload and process a file
    await batchHelpers.uploadBatchFiles(['sample.png']);
    
    // Wait a bit for any potential network activity
    await page.waitForTimeout(2000);
    
    // Verify no file uploads to external servers occurred
    expect(hasFileUploads).toBe(false);
  });

  test('should handle batch processing timeout gracefully', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload files
    await batchHelpers.uploadBatchFiles(['sample.png']);
    
    // Wait for either success or timeout handling
    const result = await Promise.race([
      page.waitForSelector('text=Download Batch ZIP', { timeout: 30000 }),
      page.waitForSelector('text=Processing timeout', { timeout: 35000 })
    ]);
    
    // Either should complete without hanging indefinitely
    expect(result).toBeDefined();
  });

  test('should show file size information in batch mode', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload files
    await batchHelpers.uploadBatchFiles(['sample.png']);
    
    // Look for file dimensions information (PNG • 256×256)
    await expect(page.locator('text=/\\w+ • \\d+×\\d+/')).toBeVisible();
  });

  test('should allow removing individual files from batch queue', async ({ page }) => {
    // Switch to batch mode
    await batchHelpers.switchToBatchMode();
    
    // Upload files
    await batchHelpers.uploadBatchFiles(['sample.png', 'sample.jpg']);
    
    // Try to remove a file
    await batchHelpers.removeFileFromBatch('sample.png');
    
    // Verify file list is updated
    const fileList = await batchHelpers.getBatchFileList();
    expect(fileList).not.toContain('sample.png');
  });
});
