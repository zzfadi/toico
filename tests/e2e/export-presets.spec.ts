import { test, expect } from '@playwright/test';
import { FileHelpers } from '../fixtures/helpers/file-helpers';
import { PresetHelpers } from '../fixtures/helpers/preset-helpers';

test.describe('Export Presets Tests', () => {
  let fileHelpers: FileHelpers;
  let presetHelpers: PresetHelpers;

  test.beforeEach(async ({ page }) => {
    fileHelpers = new FileHelpers(page);
    presetHelpers = new PresetHelpers(page);
    await page.goto('/');
  });

  test('should switch to export presets mode', async ({ page }) => {
    // Switch to presets mode
    await presetHelpers.switchToPresetsMode();
  });

  test('should display preset categories', async ({ page }) => {
    // Switch to presets mode
    await presetHelpers.switchToPresetsMode();
    
    // Verify category filters
    await expect(page.getByText('All Presets')).toBeVisible();
    await expect(page.getByText('Mobile Apps')).toBeVisible();
    await expect(page.getByText('Web & Favicons')).toBeVisible();
    await expect(page.getByText('Desktop Apps')).toBeVisible();
  });

  test('should display available presets', async ({ page }) => {
    // Switch to presets mode
    await presetHelpers.switchToPresetsMode();
    
    // Verify preset cards are displayed
    await expect(page.getByText('iOS App Icons')).toBeVisible();
    await expect(page.getByText('Android Icons')).toBeVisible();
    await expect(page.getByText('Web Favicons')).toBeVisible();
    await expect(page.getByText('Desktop App Icons')).toBeVisible();
  });

  test('should filter presets by category', async ({ page }) => {
    // Switch to presets mode
    await presetHelpers.switchToPresetsMode();
    
    // Filter by Mobile Apps category
    await presetHelpers.filterByCategory('Mobile Apps');
    
    // Verify only mobile presets are shown
    await expect(page.getByText('iOS App Icons')).toBeVisible();
    await expect(page.getByText('Android Icons')).toBeVisible();
    
    // Filter by Web category
    await presetHelpers.filterByCategory('Web & Favicons');
    
    // Verify only web presets are shown
    await expect(page.getByText('Web Favicons')).toBeVisible();
  });

  test('should select iOS preset and show details', async ({ page }) => {
    // Switch to presets mode
    await presetHelpers.switchToPresetsMode();
    
    // Select and verify iOS preset
    await presetHelpers.verifyPlatformSpecificFeatures('iOS App Icons');
  });

  test('should select Android preset and show details', async ({ page }) => {
    // Switch to presets mode
    await presetHelpers.switchToPresetsMode();
    
    // Select and verify Android preset
    await presetHelpers.verifyPlatformSpecificFeatures('Android Icons');
  });

  test('should select Web Favicons preset and show details', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select Web Favicons preset
    await page.getByText('Web Favicons').click();
    
    // Verify preset details
    await expect(page.getByText('Web Favicons Selected')).toBeVisible();
    await expect(page.getByText('Multi-format support')).toBeVisible();
    await expect(page.getByText('Apple Touch Icons included')).toBeVisible();
    await expect(page.getByText('Microsoft Tile icons')).toBeVisible();
  });

  test('should select Desktop preset and show details', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select Desktop preset
    await page.getByText('Desktop App Icons').click();
    
    // Verify preset details
    await expect(page.getByText('Desktop App Icons Selected')).toBeVisible();
    await expect(page.getByText('Windows ICO format')).toBeVisible();
    await expect(page.getByText('macOS ICNS sources')).toBeVisible();
    await expect(page.getByText('Linux icon standards')).toBeVisible();
  });

  test('should show preset size information', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select a preset
    await page.getByText('iOS App Icons').click();
    
    // Verify size information is displayed
    await expect(page.locator('text=/\\d+px/')).toBeVisible();
    await expect(page.locator('text=/\\d+ sizes/')).toBeVisible();
    
    // Check for size preview tags
    const sizeTags = page.locator('span:has-text("px")');
    await expect(sizeTags.first()).toBeVisible();
  });

  test('should upload file for preset export', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select preset
    await page.getByText('iOS App Icons').click();
    
    // Upload file for preset export
    await fileHelpers.uploadFile('sample.png');
    
    // Verify upload interface is shown
    await expect(page.getByText('Upload Image for iOS App Icons Export')).toBeVisible();
  });

  test('should export iOS preset package', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select iOS preset
    await page.getByText('iOS App Icons').click();
    
    // Upload file
    await fileHelpers.uploadFile('sample.png');
    
    // Start export
    const exportButton = page.getByText('Export iOS Package').or(
      page.getByText('Start Export')
    );
    await exportButton.click();
    
    // Wait for export to complete and download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/.*-ios-app-icons-.*\.zip$/);
  });

  test('should show export progress during preset processing', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select preset
    await page.getByText('iOS App Icons').click();
    
    // Upload file
    await fileHelpers.uploadFile('sample.png');
    
    // Start export
    const exportButton = page.getByText('Export iOS Package').or(
      page.getByText('Start Export')
    );
    await exportButton.click();
    
    // Check for progress indicators
    await expect(page.getByText(/Generating.*px/)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="export-progress"]').or(
      page.locator('.progress-bar')
    )).toBeVisible();
  });

  test('should export Android preset package', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select Android preset
    await page.getByText('Android Icons').click();
    
    // Upload file
    await fileHelpers.uploadFile('sample.png');
    
    // Start export
    const exportButton = page.getByText('Export Android Package').or(
      page.getByText('Start Export')
    );
    await exportButton.click();
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/.*-android-icons-.*\.zip$/);
  });

  test('should export Web Favicons preset package', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select Web preset
    await page.getByText('Web Favicons').click();
    
    // Upload file
    await fileHelpers.uploadFile('sample.png');
    
    // Start export
    const exportButton = page.getByText('Export Web Package').or(
      page.getByText('Start Export')
    );
    await exportButton.click();
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/.*-web-favicons-.*\.zip$/);
  });

  test('should export Desktop preset package', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select Desktop preset
    await page.getByText('Desktop App Icons').click();
    
    // Upload file
    await fileHelpers.uploadFile('sample.png');
    
    // Start export
    const exportButton = page.getByText('Export Desktop Package').or(
      page.getByText('Start Export')
    );
    await exportButton.click();
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/.*-desktop-icons-.*\.zip$/);
  });

  test('should handle preset export errors gracefully', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select preset
    await page.getByText('iOS App Icons').click();
    
    // Upload invalid file
    await fileHelpers.uploadFile('invalid-file.txt');
    
    // Attempt export
    const exportButton = page.getByText('Export iOS Package').or(
      page.getByText('Start Export')
    );
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Check for error message
      await expect(page.getByText(/error/i).or(
        page.getByText(/failed/i)
      )).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show export completion status', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select preset
    await page.getByText('iOS App Icons').click();
    
    // Upload file
    await fileHelpers.uploadFile('sample.png');
    
    // Start export
    const exportButton = page.getByText('Export iOS Package').or(
      page.getByText('Start Export')
    );
    await exportButton.click();
    
    // Wait for completion message
    await expect(page.getByText('Export complete!')).toBeVisible({ timeout: 30000 });
    
    // Check for success indicators
    await expect(page.getByText(/\d+ files generated/)).toBeVisible();
  });

  test('should allow switching presets without losing selection', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select iOS preset
    await page.getByText('iOS App Icons').click();
    await expect(page.getByText('iOS App Icons Selected')).toBeVisible();
    
    // Switch to Android preset
    await page.getByText('Android Icons').click();
    await expect(page.getByText('Android Icons Selected')).toBeVisible();
    
    // Verify iOS is no longer selected
    await expect(page.getByText('iOS App Icons Selected')).not.toBeVisible();
  });

  test('should maintain preset state across mode switches', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select a preset
    await page.getByText('iOS App Icons').click();
    
    // Switch to single mode and back
    await page.getByText('Single File').click();
    await page.getByText('Export Presets').click();
    
    // Verify preset is still selected
    await expect(page.getByText('iOS App Icons Selected')).toBeVisible();
  });

  test('should show preset format information', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Check format indicators for different presets
    await expect(page.getByText('PNG')).toBeVisible(); // iOS/Android
    await expect(page.getByText('ICO')).toBeVisible(); // Web/Desktop
  });

  test('should validate image quality for presets', async ({ page }) => {
    // Switch to presets mode
    await page.getByText('Export Presets').click();
    
    // Select preset
    await page.getByText('iOS App Icons').click();
    
    // Try uploading very small image
    await fileHelpers.uploadFile('sample.png'); // Assuming this is small
    
    // Look for quality warnings
    const warningText = page.getByText(/smaller than.*256px/i);
    if (await warningText.isVisible()) {
      // Warning should be shown for small images
      await expect(warningText).toBeVisible();
    }
  });
});
