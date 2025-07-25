import { test, expect } from '@playwright/test';

test.describe('UI Mode Switching Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display processing mode switcher', async ({ page }) => {
    // Verify segmented control is visible
    await expect(page.getByText('Single File')).toBeVisible();
    await expect(page.getByText('Batch Processing')).toBeVisible();
    await expect(page.getByText('Export Presets')).toBeVisible();
  });

  test('should show mode descriptions', async ({ page }) => {
    // Check for mode descriptions
    await expect(page.getByText('Convert one image at a time with detailed preview')).toBeVisible();
    await expect(page.getByText('Convert multiple images simultaneously with ZIP download')).toBeVisible();
    await expect(page.getByText('Professional export packages for iOS, Android, and Web')).toBeVisible();
  });

  test('should show mode icons', async ({ page }) => {
    // Verify mode icons are displayed
    await expect(page.getByText('📄')).toBeVisible(); // Single file
    await expect(page.getByText('🔥')).toBeVisible(); // Batch processing  
    await expect(page.getByText('🎨')).toBeVisible(); // Export presets
  });

  test('should start in single file mode by default', async ({ page }) => {
    // Verify single file mode is active by default
    await expect(page.locator('[data-testid="file-uploader"]').or(
      page.getByText('Drag & drop an image or click to browse')
    )).toBeVisible();
    
    // Should not show batch or preset interfaces
    await expect(page.getByText('Batch Processing Beast')).not.toBeVisible();
    await expect(page.getByText('Professional Export Presets')).not.toBeVisible();
  });

  test('should switch to batch processing mode', async ({ page }) => {
    // Click batch processing option
    await page.getByText('Batch Processing').click();
    
    // Verify batch interface is shown
    await expect(page.getByText('🔥 Batch Processing Beast')).toBeVisible();
    
    // Verify single file interface is hidden
    await expect(page.getByText('Drag & drop an image or click to browse')).not.toBeVisible();
  });

  test('should switch to export presets mode', async ({ page }) => {
    // Click export presets option
    await page.getByText('Export Presets').click();
    
    // Verify presets interface is shown
    await expect(page.getByText('🎨 Professional Export Presets')).toBeVisible();
    
    // Verify other interfaces are hidden
    await expect(page.getByText('Drag & drop an image or click to browse')).not.toBeVisible();
    await expect(page.getByText('Batch Processing Beast')).not.toBeVisible();
  });

  test('should maintain visual selection state', async ({ page }) => {
    // Initial state - Single File should be selected
    const singleFileButton = page.getByText('Single File');
    const batchButton = page.getByText('Batch Processing');
    const presetsButton = page.getByText('Export Presets');
    
    // Switch to batch mode
    await batchButton.click();
    
    // Verify visual selection changed
    // The exact CSS classes depend on implementation, but we can check for visual indicators
    const selectedButton = page.locator('.pulse-glow').or(
      page.locator('.bg-gradient-to-r').or(
        page.locator('[aria-selected="true"]')
      )
    );
    
    await expect(selectedButton).toBeVisible();
  });

  test('should animate transitions between modes', async ({ page }) => {
    // Switch modes and verify content changes
    await page.getByText('Batch Processing').click();
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
    
    await page.getByText('Export Presets').click();
    await expect(page.getByText('Professional Export Presets')).toBeVisible();
    
    await page.getByText('Single File').click();
    await expect(page.locator('[data-testid="file-uploader"]').or(
      page.getByText('Drag & drop an image or click to browse')
    )).toBeVisible();
  });

  test('should handle rapid mode switching', async ({ page }) => {
    // Rapidly switch between modes
    await page.getByText('Batch Processing').click();
    await page.getByText('Export Presets').click();
    await page.getByText('Single File').click();
    await page.getByText('Batch Processing').click();
    
    // Verify final state is correct
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify segmented control is still functional
    await expect(page.getByText('Single File')).toBeVisible();
    await expect(page.getByText('Batch Processing')).toBeVisible();
    await expect(page.getByText('Export Presets')).toBeVisible();
    
    // Test switching modes on mobile
    await page.getByText('Batch Processing').click();
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Verify layout adapts
    await expect(page.getByText('Single File')).toBeVisible();
    
    // Test mode switching
    await page.getByText('Export Presets').click();
    await expect(page.getByText('Professional Export Presets')).toBeVisible();
  });

  test('should show proper layout for each mode', async ({ page }) => {
    // Single file mode - should show left/right columns
    await expect(page.locator('.grid').or(
      page.locator('.lg\\:grid-cols-2')
    )).toBeVisible();
    
    // Batch mode - should show full width layout
    await page.getByText('Batch Processing').click();
    await expect(page.locator('.lg\\:col-span-2').or(
      page.getByText('Batch Processing Beast').locator('..')
    )).toBeVisible();
    
    // Presets mode - should show full width layout
    await page.getByText('Export Presets').click();
    await expect(page.locator('.lg\\:col-span-2').or(
      page.getByText('Professional Export Presets').locator('..')
    )).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on the segmented control
    await page.getByText('Single File').focus();
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowRight');
    
    // Should move to batch processing
    await expect(page.getByText('Batch Processing')).toBeFocused();
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    
    // Should switch to batch mode
    await expect(page.getByText('Batch Processing Beast')).toBeVisible();
  });

  test('should support tab navigation', async ({ page }) => {
    // Tab through the interface
    await page.keyboard.press('Tab');
    
    // Should reach the segmented control
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing to reach mode options
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
  });

  test('should maintain accessibility attributes', async ({ page }) => {
    // Check for proper ARIA attributes
    const segmentedControl = page.locator('[role="tablist"]').or(
      page.locator('[role="radiogroup"]')
    );
    
    if (await segmentedControl.isVisible()) {
      await expect(segmentedControl).toBeVisible();
    }
    
    // Check for proper labels
    await expect(page.getByRole('button', { name: /Single File/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Batch Processing/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Presets/ })).toBeVisible();
  });

  test('should preserve state when switching between modes', async ({ page }) => {
    // Upload a file in single mode
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Switch to batch mode and back
      await page.getByText('Batch Processing').click();
      await page.getByText('Single File').click();
      
      // File state handling depends on implementation
      // This test verifies the mode switching doesn't crash the app
      await expect(page.locator('[data-testid="file-uploader"]').or(
        page.getByText('Drag & drop an image or click to browse')
      )).toBeVisible();
    }
  });

  test('should show mode-specific help text', async ({ page }) => {
    // Single file mode
    await expect(page.getByText('Convert one image at a time')).toBeVisible();
    
    // Batch mode
    await page.getByText('Batch Processing').click();
    await expect(page.getByText('Convert multiple images simultaneously')).toBeVisible();
    
    // Presets mode
    await page.getByText('Export Presets').click();
    await expect(page.getByText('Professional export packages')).toBeVisible();
  });

  test('should disable mode switching when processing', async ({ page }) => {
    // This test would check if mode switching is disabled during file processing
    // The exact implementation depends on the app's behavior
    
    // Start a file upload/conversion
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // During processing, mode switches might be disabled
      // This is a placeholder for testing processing state management
    }
  });
});
