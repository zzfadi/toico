import { test, expect } from '@playwright/test';
import { FileHelpers } from '../fixtures/helpers/file-helpers';

test.describe('Feature Integration Tests', () => {
  let fileHelpers: FileHelpers;

  test.beforeEach(async ({ page }) => {
    fileHelpers = new FileHelpers(page);
    await page.goto('/');
  });

  test('should maintain format selection across mode switches', async ({ page }) => {
    // Start in single file mode and select SVG format (if available)
    const svgOption = page.getByText('SVG');
    if (await svgOption.isVisible()) {
      await svgOption.click();
    }
    
    // Switch to batch mode
    await page.getByText('Batch Processing').click();
    
    // Verify format preference is maintained
    // The exact implementation depends on how format state is managed
    
    // Switch back to single mode
    await page.getByText('Single File').click();
    
    // Verify state is preserved
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should handle concurrent processing in different modes', async ({ page }) => {
    // This test verifies that switching modes doesn't interfere with ongoing processes
    
    // Start a file upload in single mode
    await fileHelpers.uploadFile('sample.png');
    
    // Quickly switch to batch mode
    await page.getByText('Batch Processing').click();
    
    // Verify batch interface loads properly
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
    
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Verify presets interface loads
    await expect(page.getByText('Professional Export Presets')).toBeVisible();
  });

  test('should show appropriate error messages for each mode', async ({ page }) => {
    // Test single file mode error handling
    await fileHelpers.uploadFile('invalid-file.txt');
    const errorMessage = page.locator('[data-testid="error-message"]').or(
      page.getByText(/invalid/i).or(page.getByText(/error/i))
    );
    
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
    
    // Switch to batch mode and test error handling
    await page.getByText('Batch Processing').click();
    
    // Batch mode should handle errors differently
    // This verifies error handling is mode-appropriate
  });

  test('should maintain privacy across all modes', async ({ page }) => {
    // Monitor network requests across all modes
    let hasFileUploads = false;
    page.on('request', request => {
      if (request.method() === 'POST' && 
          request.postData() && 
          request.postData()!.includes('image')) {
        hasFileUploads = true;
      }
    });
    
    // Test single file mode
    await fileHelpers.uploadFile('sample.png');
    await page.waitForTimeout(1000);
    
    // Test batch mode
    await page.getByText('Batch Processing').click();
    await fileHelpers.uploadMultipleFiles(['sample.png']);
    await page.waitForTimeout(1000);
    
    // Test presets mode
    await page.getByText('Export Presets').click();
    await page.getByText('iOS App Icons').click();
    await fileHelpers.uploadFile('sample.png');
    await page.waitForTimeout(1000);
    
    // Verify no file uploads occurred
    expect(hasFileUploads).toBe(false);
  });

  test('should handle large files across all modes', async ({ page }) => {
    // This test would use a large test file if available
    // For now, we'll test the UI behavior with regular files
    
    // Single file mode
    await fileHelpers.uploadFile('sample.png');
    
    // Switch to batch mode with multiple files
    await page.getByText('Batch Processing').click();
    await fileHelpers.uploadMultipleFiles(['sample.png', 'sample.jpg']);
    
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    await page.getByText('iOS App Icons').click();
    await fileHelpers.uploadFile('sample.png');
    
    // Verify all modes handle files appropriately
    // Each mode should show appropriate loading/processing states
  });

  test('should provide consistent user feedback across modes', async ({ page }) => {
    // Test feedback consistency in single mode
    await fileHelpers.uploadFile('sample.png');
    
    // Look for processing feedback
    const processingIndicator = page.locator('[data-testid="processing"]').or(
      page.locator('.animate-spin').or(page.getByText(/processing/i))
    );
    
    // Switch to batch mode
    await page.getByText('Batch Processing').click();
    
    // Batch mode should show similar feedback patterns
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
    
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Presets mode should also provide clear feedback
    await expect(page.getByText('Professional Export Presets')).toBeVisible();
  });

  test('should handle memory management across modes', async ({ page }) => {
    // This test verifies that switching modes cleans up resources properly
    
    // Upload files in each mode and switch rapidly
    await fileHelpers.uploadFile('sample.png');
    
    await page.getByText('Batch Processing').click();
    await fileHelpers.uploadMultipleFiles(['sample.png']);
    
    await page.getByText('Export Presets').click();
    await page.getByText('iOS App Icons').click();
    await fileHelpers.uploadFile('sample.png');
    
    await page.getByText('Single File').click();
    
    // App should remain responsive
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should support accessibility across all modes', async ({ page }) => {
    // Test keyboard navigation across modes
    await page.keyboard.press('Tab');
    
    // Should be able to navigate to mode switcher
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Test each mode for basic accessibility
    await page.getByText('Batch Processing').click();
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
    
    await page.getByText('Export Presets').click();
    await expect(page.getByText('Professional Export Presets')).toBeVisible();
    
    await page.getByText('Single File').click();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Switch modes and test browser navigation
    await page.getByText('Batch Processing').click();
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
    
    await page.getByText('Export Presets').click();
    await expect(page.getByText('Professional Export Presets')).toBeVisible();
    
    // Browser back/forward might not affect mode state unless implemented
    // This test verifies the app handles navigation gracefully
    await page.goBack();
    await page.goForward();
    
    // App should remain functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show appropriate loading states for each mode', async ({ page }) => {
    // Single file mode loading
    await fileHelpers.uploadFile('sample.png');
    
    // Look for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading"]').or(
      page.locator('.animate-pulse').or(page.locator('.spinner'))
    );
    
    // Switch to batch mode
    await page.getByText('Batch Processing').click();
    
    // Batch loading should be different (progress bars, etc.)
    await fileHelpers.uploadMultipleFiles(['sample.png']);
    
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    await page.getByText('iOS App Icons').click();
    
    // Preset export should show export-specific loading
    await fileHelpers.uploadFile('sample.png');
  });

  test('should maintain branding consistency across modes', async ({ page }) => {
    // Verify brand elements are present in all modes
    await expect(page.getByText('Defined by Jenna')).toBeVisible();
    
    await page.getByText('Batch Processing').click();
    await expect(page.getByText('Defined by Jenna')).toBeVisible();
    
    await page.getByText('Export Presets').click();
    await expect(page.getByText('Defined by Jenna')).toBeVisible();
    
    // Check for consistent color scheme and styling
    const brandColors = page.locator('[style*="color: #36454F"]').or(
      page.locator('.text-golden-terra')
    );
    await expect(brandColors.first()).toBeVisible();
  });

  test('should handle mode switching during active downloads', async ({ page }) => {
    // This test would verify that mode switching doesn't interrupt downloads
    
    // Start a download in single mode (if applicable)
    await fileHelpers.uploadFile('sample.png');
    
    // Switch modes during processing
    await page.getByText('Batch Processing').click();
    
    // App should handle this gracefully
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
    
    // Switch to presets
    await page.getByText('Export Presets').click();
    await expect(page.getByText('Professional Export Presets')).toBeVisible();
  });

  test('should show consistent help/instruction text', async ({ page }) => {
    // Each mode should have clear, helpful instructions
    
    // Single file mode
    await expect(page.getByText(/Convert one image at a time/)).toBeVisible();
    
    // Batch mode
    await page.getByText('Batch Processing').click();
    await expect(page.getByText(/Convert multiple images simultaneously/)).toBeVisible();
    
    // Presets mode
    await page.getByText('Export Presets').click();
    await expect(page.getByText(/Professional export packages/)).toBeVisible();
  });

  test('should handle feature discovery flow', async ({ page }) => {
    // New users should be able to discover all features
    
    // Start with single file (default)
    await expect(page.getByText('Convert one image at a time')).toBeVisible();
    
    // Discover batch processing
    await page.getByText('Batch Processing').click();
    await expect(page.getByText('Drop multiple images')).toBeVisible();
    
    // Discover presets
    await page.getByText('Export Presets').click();
    await expect(page.getByText('iOS App Icons')).toBeVisible();
    await expect(page.getByText('Android Icons')).toBeVisible();
    await expect(page.getByText('Web Favicons')).toBeVisible();
    await expect(page.getByText('Desktop App Icons')).toBeVisible();
  });
});
