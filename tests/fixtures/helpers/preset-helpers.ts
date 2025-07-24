import { Page, expect, Download } from '@playwright/test';

export class PresetHelpers {
  constructor(private page: Page) {}

  /**
   * Switch to export presets mode
   */
  async switchToPresetsMode() {
    await this.page.getByText('Export Presets').click();
    await expect(this.page.getByText('🎨 Professional Export Presets')).toBeVisible();
  }

  /**
   * Select a specific preset by name
   */
  async selectPreset(presetName: 'iOS App Icons' | 'Android Icons' | 'Web Favicons' | 'Desktop App Icons') {
    await this.page.getByText(presetName).click();
    await expect(this.page.getByText(`${presetName} Selected`)).toBeVisible();
  }

  /**
   * Filter presets by category
   */
  async filterByCategory(category: 'All Presets' | 'Mobile Apps' | 'Web & Favicons' | 'Desktop Apps') {
    await this.page.getByText(category).click();
  }

  /**
   * Upload file for preset export
   */
  async uploadFileForPreset(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    const fullPath = require('path').join(__dirname, '..', 'images', filePath);
    await fileInput.setInputFiles(fullPath);
  }

  /**
   * Start preset export and wait for download
   */
  async exportPresetPackage(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    
    // Look for export button with various possible texts
    const exportButton = this.page.getByText('Export').first().or(
      this.page.getByText('Start Export').or(
        this.page.getByText(/Export.*Package/)
      )
    );
    
    await exportButton.click();
    return await downloadPromise;
  }

  /**
   * Wait for export progress to complete
   */
  async waitForExportComplete() {
    await expect(this.page.getByText('Export complete!')).toBeVisible({ timeout: 30000 });
  }

  /**
   * Verify export progress is shown
   */
  async verifyExportProgress() {
    await expect(this.page.getByText(/Generating.*px/).or(
      this.page.locator('[data-testid="export-progress"]')
    )).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get preset size information
   */
  async getPresetSizes(): Promise<string[]> {
    const sizeTags = this.page.locator('span:has-text("px")');
    const count = await sizeTags.count();
    const sizes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const size = await sizeTags.nth(i).textContent();
      if (size) sizes.push(size);
    }
    
    return sizes;
  }

  /**
   * Verify preset details are shown
   */
  async verifyPresetDetails(presetName: string, expectedFeatures: string[]) {
    await expect(this.page.getByText(`${presetName} Selected`)).toBeVisible();
    
    for (const feature of expectedFeatures) {
      await expect(this.page.getByText(feature)).toBeVisible();
    }
  }

  /**
   * Verify download filename matches expected pattern
   */
  verifyDownloadFilename(download: Download, expectedPattern: RegExp) {
    expect(download.suggestedFilename()).toMatch(expectedPattern);
  }

  /**
   * Get preset category count
   */
  async getPresetCount(): Promise<number> {
    const presetCards = this.page.locator('[data-testid="preset-card"]').or(
      this.page.locator('text=Icons').locator('..')
    );
    return await presetCards.count();
  }

  /**
   * Verify preset export error handling
   */
  async verifyExportError(expectedError: string) {
    await expect(this.page.getByText(expectedError).or(
      this.page.getByText(/error/i).or(this.page.getByText(/failed/i))
    )).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if preset is platform-specific
   */
  async verifyPlatformSpecificFeatures(presetName: string) {
    await this.selectPreset(presetName as any);
    
    switch (presetName) {
      case 'iOS App Icons':
        await expect(this.page.getByText('iPhone & iPad optimized sizes')).toBeVisible();
        await expect(this.page.getByText('App Store ready 1024px icon')).toBeVisible();
        break;
      case 'Android Icons':
        await expect(this.page.getByText('Adaptive icon support')).toBeVisible();
        await expect(this.page.getByText('Legacy icon compatibility')).toBeVisible();
        break;
      case 'Web Favicons':
        await expect(this.page.getByText('Multi-format support')).toBeVisible();
        await expect(this.page.getByText('Apple Touch Icons included')).toBeVisible();
        break;
      case 'Desktop App Icons':
        await expect(this.page.getByText('Windows ICO format')).toBeVisible();
        await expect(this.page.getByText('macOS ICNS sources')).toBeVisible();
        break;
    }
  }
}
