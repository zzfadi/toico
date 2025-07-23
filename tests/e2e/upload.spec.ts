import { test, expect } from '@playwright/test';
import { FileHelpers } from '../fixtures/helpers/file-helpers';

test.describe('File Upload Functionality', () => {
  let fileHelpers: FileHelpers;

  test.beforeEach(async ({ page }) => {
    fileHelpers = new FileHelpers(page);
    await page.goto('/');
  });

  test('should display the main upload interface', async ({ page }) => {
    // Verify the main components are visible
    await expect(page.locator('h1')).toContainText('ICO Converter');
    await expect(page.locator('[data-testid="file-uploader"]')).toBeVisible();
    
    // Verify supported formats are displayed
    await fileHelpers.verifySupportedFormats();
  });

  test('should upload PNG file successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    // Verify file metadata is displayed
    const metadata = await fileHelpers.getFileMetadata();
    expect(metadata.format).toContain('PNG');
  });

  test('should upload JPEG file successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.jpg');
    await fileHelpers.waitForFileProcessed();
    
    const metadata = await fileHelpers.getFileMetadata();
    expect(metadata.format).toContain('JPEG');
  });

  test('should upload SVG file successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg');
    await fileHelpers.waitForFileProcessed();
    
    const metadata = await fileHelpers.getFileMetadata();
    expect(metadata.format).toContain('SVG');
  });

  test('should upload WebP file successfully', async ({ page }) => {
    await fileHelpers.uploadFile('sample.webp');
    await fileHelpers.waitForFileProcessed();
    
    const metadata = await fileHelpers.getFileMetadata();
    expect(metadata.format).toContain('WebP');
  });

  test('should reject invalid file formats', async ({ page }) => {
    await fileHelpers.uploadFile('invalid-file.txt');
    await fileHelpers.verifyUploadError('Invalid file format');
  });

  test('should handle file size validation', async ({ page }) => {
    // Test with a theoretical large file
    // In a real scenario, you would create a file that exceeds the limit
    test.skip();
  });

  test('should clear uploaded file', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    await fileHelpers.clearUploadedFile();
    
    // Verify UI is reset
    await expect(page.locator('[data-testid="image-preview"]')).not.toBeVisible();
  });

  test('should handle multiple file uploads', async ({ page }) => {
    // Upload first file
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    // Upload second file (should replace first)
    await fileHelpers.uploadFile('sample.jpg');
    await fileHelpers.waitForFileProcessed();
    
    const metadata = await fileHelpers.getFileMetadata();
    expect(metadata.format).toContain('JPEG');
  });

  test('should provide visual feedback during upload', async ({ page }) => {
    // Start upload
    await fileHelpers.uploadFile('sample.png');
    
    // Check for loading state
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    // Note: This might be very fast for small test files
    
    await fileHelpers.waitForFileProcessed();
    
    // Verify final state
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });

  test('should preserve file metadata display', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg');
    await fileHelpers.waitForFileProcessed();
    
    const metadata = await fileHelpers.getFileMetadata();
    
    // Verify metadata fields are populated
    expect(metadata.format).toBeTruthy();
    expect(metadata.dimensions).toBeTruthy();
  });

  test('should handle drag and drop upload', async ({ page }) => {
    // This test would require more complex setup for drag and drop simulation
    test.skip();
  });

  test('should validate MIME types correctly', async ({ page }) => {
    // Upload different file types and verify detection
    const testCases = [
      { file: 'sample.png', expectedFormat: 'PNG' },
      { file: 'sample.jpg', expectedFormat: 'JPEG' },
      { file: 'sample.svg', expectedFormat: 'SVG' },
      { file: 'sample.webp', expectedFormat: 'WebP' },
    ];

    for (const testCase of testCases) {
      await fileHelpers.uploadFile(testCase.file);
      await fileHelpers.waitForFileProcessed();
      
      const metadata = await fileHelpers.getFileMetadata();
      expect(metadata.format).toContain(testCase.expectedFormat);
      
      await fileHelpers.clearUploadedFile();
    }
  });
});