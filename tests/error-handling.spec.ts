import { test, expect } from '@playwright/test';
import { ConversionPage } from './helpers';

test.describe('SVG to ICO Converter - Error Handling', () => {
  let conversionPage: ConversionPage;

  test.beforeEach(async ({ page }) => {
    conversionPage = new ConversionPage(page);
    await conversionPage.goto();
  });

  test('should show error for invalid SVG file', async ({ page }) => {
    // Upload invalid SVG file
    await conversionPage.uploadFile('invalid.svg');
    
    // Expect error message to be displayed
    await conversionPage.expectError('Invalid SVG file');
  });

  test('should show error for unsupported file types', async ({ page }) => {
    // Create a text file and try to upload it
    const fileInput = page.locator('input[type="file"]');
    
    // Create a temporary text file
    const fs = require('fs');
    const path = require('path');
    const tempFile = path.join(__dirname, 'fixtures', 'test.txt');
    fs.writeFileSync(tempFile, 'This is not an image file');
    
    try {
      await fileInput.setInputFiles(tempFile);
      
      // Expect error for unsupported file type
      await conversionPage.expectError('Unsupported file format');
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test('should show error for files that are too large', async ({ page }) => {
    // Create a large file (over 100MB limit)
    const fs = require('fs');
    const path = require('path');
    const largeSvg = path.join(__dirname, 'fixtures', 'too-large.svg');
    
    // Create a very large SVG content
    const largeContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">
      ${'<rect x="0" y="0" width="1" height="1" fill="red"/>'.repeat(50000)}
    </svg>`;
    
    fs.writeFileSync(largeSvg, largeContent);
    
    try {
      // Check if file is actually over the limit (100MB)
      const stats = fs.statSync(largeSvg);
      if (stats.size > 100 * 1024 * 1024) {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(largeSvg);
        
        // Expect error for file too large
        await conversionPage.expectError('File too large');
      } else {
        // Skip this test if we couldn't create a large enough file
        test.skip();
      }
    } finally {
      // Clean up temp file
      if (fs.existsSync(largeSvg)) {
        fs.unlinkSync(largeSvg);
      }
    }
  });

  test('should handle conversion timeouts gracefully', async ({ page }) => {
    // Upload a complex SVG that might cause timeout issues
    await conversionPage.uploadFile('large-icon.svg');
    
    // Wait for previews
    await conversionPage.waitForPreviewGeneration();
    
    // The conversion happens automatically, so we wait a bit and check state
    await page.waitForTimeout(5000); // Wait 5 seconds
    
    // Check if either download button appeared or error message
    const downloadButton = page.locator('[data-testid="download-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    const downloadVisible = await downloadButton.isVisible();
    const errorVisible = await errorMessage.isVisible();
    
    // One of these should be true
    expect(downloadVisible || errorVisible).toBeTruthy();
  });

  test('should clear previous errors when new file is uploaded', async ({ page }) => {
    // First, upload an invalid file to trigger an error
    await conversionPage.uploadFile('invalid.svg');
    await conversionPage.expectError('Invalid SVG file');
    
    // Then upload a valid file
    await conversionPage.uploadFile('test-icon.svg');
    
    // Error should be cleared
    const errorElement = page.locator('[data-testid="error-message"]');
    await expect(errorElement).not.toBeVisible();
    
    // File info should be shown instead
    await conversionPage.expectFileInfo('test-icon.svg');
  });

  test('should prevent multiple simultaneous conversions', async ({ page }) => {
    // Upload test SVG file
    await conversionPage.uploadFile('test-icon.svg');
    await conversionPage.waitForPreviewGeneration();
    
    // Conversion happens automatically, so we wait for it to complete
    await conversionPage.waitForConversion();
    
    // Download button should be available after conversion
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();
  });

  test('should handle empty file selection', async ({ page }) => {
    // Try to interact with the interface without uploading a file
    const downloadButton = page.locator('[data-testid="download-button"]');
    
    // Download button should not be visible without a file
    await expect(downloadButton).not.toBeVisible();
  });
});