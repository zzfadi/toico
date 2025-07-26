/**
 * WebP Format Enhancement Tests
 * 
 * Tests for the new WebP-specific features and optimizations
 */

import { describe, it, expect } from '@jest/globals';
import { 
  getFormatSpecificMessage, 
  analyzeWebPFile, 
  getWebPCompatibilityInfo,
  isBrowserSupported 
} from '../src/app/utils/imageFormats';

describe('WebP Format Enhancements', () => {
  describe('getFormatSpecificMessage', () => {
    it('should return WebP-specific message', () => {
      const message = getFormatSpecificMessage('webp');
      expect(message).toBe(
        'Note: WebP format provides excellent compression with transparency support. Animated WebP files will use the first frame for conversion.'
      );
    });

    it('should maintain backward compatibility for other formats', () => {
      expect(getFormatSpecificMessage('gif')).toContain('animated GIFs');
      expect(getFormatSpecificMessage('jpg')).toContain('transparency');
      expect(getFormatSpecificMessage('svg')).toContain('rasterized');
      expect(getFormatSpecificMessage('unknown')).toBeNull();
    });
  });

  describe('getWebPCompatibilityInfo', () => {
    it('should return compatibility information', () => {
      const info = getWebPCompatibilityInfo();
      expect(info).toHaveProperty('supported');
      expect(typeof info.supported).toBe('boolean');
      expect(info).toHaveProperty('message');
      expect(typeof info.message).toBe('string');
    });

    it('should provide recommendations for unsupported browsers', () => {
      // Mock unsupported browser
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,test');
      
      const info = getWebPCompatibilityInfo();
      if (!info.supported) {
        expect(info.recommendation).toContain('Chrome');
        expect(info.recommendation).toContain('Firefox');
        expect(info.recommendation).toContain('Safari');
        expect(info.recommendation).toContain('Edge');
      }
      
      // Restore original method
      HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    });
  });

  describe('analyzeWebPFile', () => {
    it('should handle invalid files gracefully', async () => {
      const invalidFile = new File(['invalid'], 'test.webp', { type: 'image/webp' });
      const analysis = await analyzeWebPFile(invalidFile);
      
      expect(analysis).toHaveProperty('isAnimated');
      expect(analysis).toHaveProperty('hasTransparency');
      expect(analysis).toHaveProperty('estimatedQuality');
      expect(['high', 'medium', 'low']).toContain(analysis.estimatedQuality);
    });

    it('should analyze file characteristics', async () => {
      // Create a mock WebP file with proper header
      const webpHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // 'RIFF'
        0x20, 0x00, 0x00, 0x00, // File size (32 bytes)
        0x57, 0x45, 0x42, 0x50, // 'WEBP'
        // Add some padding
        ...new Array(20).fill(0)
      ]);
      
      const file = new File([webpHeader], 'test.webp', { type: 'image/webp' });
      const analysis = await analyzeWebPFile(file);
      
      expect(typeof analysis.isAnimated).toBe('boolean');
      expect(typeof analysis.hasTransparency).toBe('boolean');
      expect(['high', 'medium', 'low']).toContain(analysis.estimatedQuality);
    });

    it('should provide recommendations for low quality files', async () => {
      // Create a very small file to trigger low quality detection
      const smallFile = new File(['x'], 'small.webp', { type: 'image/webp' });
      const analysis = await analyzeWebPFile(smallFile);
      
      if (analysis.estimatedQuality === 'low') {
        expect(analysis.recommendation).toContain('quality');
      }
    });
  });

  describe('Browser Support Detection', () => {
    it('should detect WebP support capability', () => {
      const isSupported = isBrowserSupported('image/webp');
      expect(typeof isSupported).toBe('boolean');
    });

    it('should support standard image formats', () => {
      expect(isBrowserSupported('image/png')).toBe(true);
      expect(isBrowserSupported('image/jpeg')).toBe(true);
      expect(isBrowserSupported('image/gif')).toBe(true);
    });
  });
});