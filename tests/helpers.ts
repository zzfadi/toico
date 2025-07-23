import { Page, expect } from '@playwright/test';
import path from 'path';

export class ConversionPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async uploadFile(filename: string) {
    const filePath = path.join(__dirname, 'fixtures', filename);
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async dragAndDropFile(filename: string) {
    const filePath = path.join(__dirname, 'fixtures', filename);
    
    // Create data transfer
    const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
    
    // Read file and create file object
    const file = await this.page.evaluateHandle(([filePath]) => {
      return fetch(filePath)
        .then(response => response.blob())
        .then(blob => new File([blob], filePath.split('/').pop() || 'test.svg', { type: 'image/svg+xml' }));
    }, [filePath] as const);
    
    // Add file to data transfer
    await dataTransfer.evaluate((dt, file) => {
      dt.items.add(file);
    }, file);

    // Find the drop zone and trigger drop
    const dropZone = this.page.locator('[data-testid="file-drop-zone"]');
    await dropZone.dispatchEvent('drop', { dataTransfer });
  }

  async waitForPreviewGeneration() {
    // Wait for preview images to be generated
    await this.page.waitForSelector('[data-testid="preview-image"]', { timeout: 10000 });
  }

  async waitForConversion() {
    // Wait for conversion to complete and download button to appear
    await this.page.waitForSelector('[data-testid="download-button"]', { timeout: 15000 });
  }

  async downloadIco() {
    // Start waiting for download before clicking
    const downloadPromise = this.page.waitForEvent('download');
    const downloadButton = this.page.locator('[data-testid="download-button"]');
    await downloadButton.click();
    const download = await downloadPromise;
    return download;
  }

  async expectError(errorMessage: string) {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    await expect(errorElement).toContainText(errorMessage);
  }

  async expectFileInfo(filename: string) {
    const fileInfoElement = this.page.locator('[data-testid="file-info"]');
    await expect(fileInfoElement).toContainText(filename);
  }

  async expectPreviewSizes(sizes: number[]) {
    for (const size of sizes) {
      const sizeElement = this.page.locator(`[data-testid="preview-${size}"]`);
      await expect(sizeElement).toBeVisible();
    }
  }

  async selectPreviewSizes(sizes: number[]) {
    // First, uncheck all checkboxes
    const checkboxes = this.page.locator('[data-testid^="size-checkbox-"]');
    const allCheckboxes = await checkboxes.all();
    
    for (const checkbox of allCheckboxes) {
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }

    // Then check only the sizes we want
    for (const size of sizes) {
      const checkbox = this.page.locator(`[data-testid="size-checkbox-${size}"]`);
      await checkbox.check();
    }
  }
}

export const PREVIEW_SIZES = [256, 128, 64, 48, 32, 16] as const;
export const DEFAULT_SELECTED_SIZES = [256, 64, 32, 16] as const;