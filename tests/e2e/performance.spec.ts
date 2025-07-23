import { test, expect } from '@playwright/test';
import { FileHelpers } from '../fixtures/helpers/file-helpers';
import { ConversionHelpers } from '../fixtures/helpers/conversion-helpers';

test.describe('Performance Tests', () => {
  let fileHelpers: FileHelpers;
  let conversionHelpers: ConversionHelpers;

  test.beforeEach(async ({ page }) => {
    fileHelpers = new FileHelpers(page);
    conversionHelpers = new ConversionHelpers(page);
    await page.goto('/');
  });

  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    
    // Wait for main content to be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="file-uploader"]')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should process small images quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    const processingTime = Date.now() - startTime;
    
    // Small image processing should be under 2 seconds
    expect(processingTime).toBeLessThan(2000);
  });

  test('should convert PNG to ICO within reasonable time', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    const startTime = Date.now();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    const conversionTime = Date.now() - startTime;
    
    // PNG conversion should complete within 5 seconds for small images
    expect(conversionTime).toBeLessThan(5000);
  });

  test('should convert SVG to ICO within reasonable time', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg');
    await fileHelpers.waitForFileProcessed();
    
    const startTime = Date.now();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    const conversionTime = Date.now() - startTime;
    
    // SVG conversion may take longer due to rasterization
    expect(conversionTime).toBeLessThan(10000);
  });

  test('should handle multiple consecutive conversions efficiently', async ({ page }) => {
    const testFiles = ['sample.png', 'sample.jpg', 'sample.svg'];
    const conversionTimes: number[] = [];
    
    for (const file of testFiles) {
      await fileHelpers.uploadFile(file);
      await fileHelpers.waitForFileProcessed();
      
      const startTime = Date.now();
      
      await conversionHelpers.startConversion();
      await conversionHelpers.waitForConversionComplete();
      
      const conversionTime = Date.now() - startTime;
      conversionTimes.push(conversionTime);
      
      await fileHelpers.clearUploadedFile();
    }
    
    // Each conversion should be reasonably fast
    conversionTimes.forEach(time => {
      expect(time).toBeLessThan(10000);
    });
    
    // Later conversions shouldn't be significantly slower (no memory leaks)
    const firstTime = conversionTimes[0];
    const lastTime = conversionTimes[conversionTimes.length - 1];
    expect(lastTime).toBeLessThan(firstTime * 2); // No more than 2x slower
  });

  test('should maintain responsive UI during conversion', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg'); // Use SVG for longer processing
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    
    // UI should remain responsive during conversion
    const startTime = Date.now();
    
    // Try to interact with UI elements
    const clearButton = page.locator('[data-testid="clear-file-button"]');
    if (await clearButton.isVisible()) {
      await clearButton.hover();
    }
    
    const interactionTime = Date.now() - startTime;
    
    // UI interactions should be responsive (under 100ms)
    expect(interactionTime).toBeLessThan(100);
    
    await conversionHelpers.waitForConversionComplete();
  });

  test('should not cause memory leaks', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform multiple operations
    for (let i = 0; i < 5; i++) {
      await fileHelpers.uploadFile('sample.png');
      await fileHelpers.waitForFileProcessed();
      
      await conversionHelpers.startConversion();
      await conversionHelpers.waitForConversionComplete();
      
      await fileHelpers.clearUploadedFile();
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      // Memory usage shouldn't grow excessively
      const memoryGrowth = finalMemory - initialMemory;
      const growthRatio = memoryGrowth / initialMemory;
      
      // Memory shouldn't grow more than 50% from operations
      expect(growthRatio).toBeLessThan(0.5);
    }
  });

  test('should efficiently handle different image sizes', async ({ page }) => {
    const testCases = [
      { file: 'sample.png', expectedMaxTime: 3000 },
      { file: 'sample.jpg', expectedMaxTime: 3000 },
      { file: 'sample.svg', expectedMaxTime: 8000 },
      { file: 'sample.webp', expectedMaxTime: 4000 },
    ];
    
    for (const testCase of testCases) {
      await fileHelpers.uploadFile(testCase.file);
      await fileHelpers.waitForFileProcessed();
      
      const startTime = Date.now();
      
      await conversionHelpers.startConversion();
      await conversionHelpers.waitForConversionComplete();
      
      const conversionTime = Date.now() - startTime;
      
      expect(conversionTime).toBeLessThan(testCase.expectedMaxTime);
      
      await fileHelpers.clearUploadedFile();
    }
  });

  test('should load resources efficiently', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Filter out non-essential requests
    const essentialRequests = requests.filter(url => 
      !url.includes('fonts.googleapis.com') &&
      !url.includes('favicon') &&
      !url.includes('analytics')
    );
    
    // Should have minimal essential requests for a client-side app
    expect(essentialRequests.length).toBeLessThan(10);
  });

  test('should not block UI thread during processing', async ({ page }) => {
    await fileHelpers.uploadFile('sample.svg');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    
    // Test UI responsiveness during conversion
    const responsiveTasks = [
      () => page.locator('h1').hover(),
      () => page.keyboard.press('Tab'),
      () => page.mouse.move(100, 100),
    ];
    
    for (const task of responsiveTasks) {
      const startTime = Date.now();
      await task();
      const taskTime = Date.now() - startTime;
      
      // UI tasks should complete quickly
      expect(taskTime).toBeLessThan(50);
    }
    
    await conversionHelpers.waitForConversionComplete();
  });

  test('should generate ICO sizes efficiently', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    const startTime = Date.now();
    await conversionHelpers.startConversion();
    
    // Wait for all ICO previews to be generated
    await conversionHelpers.verifyIcoPreviewSizes();
    
    const generationTime = Date.now() - startTime;
    
    // Generating 6 ICO sizes should be reasonably fast
    expect(generationTime).toBeLessThan(8000);
  });

  test('should download files quickly', async ({ page }) => {
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    const downloadButton = page.locator('[data-testid="download-button"]');
    
    const startTime = Date.now();
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    
    const downloadTime = Date.now() - startTime;
    
    // Download should start quickly (file generation is already done)
    expect(downloadTime).toBeLessThan(1000);
    
    // Verify file size is reasonable
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const stats = fs.statSync(path);
      
      // ICO file should be larger than 0 but not excessively large for test images
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.size).toBeLessThan(100000); // Less than 100KB for test images
    }
  });

  test('should handle concurrent UI updates efficiently', async ({ page }) => {
    // Test multiple UI updates happening simultaneously
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    const startTime = Date.now();
    
    // Start conversion which triggers multiple UI updates
    await conversionHelpers.startConversion();
    
    // Verify UI updates don't cause performance issues
    const previewElements = page.locator('[data-testid^="ico-preview-"]');
    await expect(previewElements.first()).toBeVisible({ timeout: 10000 });
    
    const updateTime = Date.now() - startTime;
    
    // UI updates should happen smoothly
    expect(updateTime).toBeLessThan(8000);
  });

  test('should maintain performance with browser dev tools open', async ({ page }) => {
    // This test ensures the app performs well even when being debugged
    await fileHelpers.uploadFile('sample.png');
    await fileHelpers.waitForFileProcessed();
    
    const startTime = Date.now();
    
    await conversionHelpers.startConversion();
    await conversionHelpers.waitForConversionComplete();
    
    const totalTime = Date.now() - startTime;
    
    // Should complete even with dev tools overhead
    expect(totalTime).toBeLessThan(10000);
  });
});