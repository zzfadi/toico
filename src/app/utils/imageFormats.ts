// Image format definitions and validation utilities

export interface ImageFormat {
  name: string;
  mimeTypes: string[];
  extensions: string[];
  maxSize: number; // in bytes
  supportsTransparency: boolean;
  description: string;
}

export const SUPPORTED_FORMATS: Record<string, ImageFormat> = {
  png: {
    name: 'PNG',
    mimeTypes: ['image/png'],
    extensions: ['.png'],
    maxSize: 50 * 1024 * 1024, // 50MB
    supportsTransparency: true,
    description: 'Portable Network Graphics'
  },
  jpg: {
    name: 'JPEG',
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['.jpg', '.jpeg'],
    maxSize: 50 * 1024 * 1024, // 50MB
    supportsTransparency: false,
    description: 'Joint Photographic Experts Group'
  },
  webp: {
    name: 'WebP',
    mimeTypes: ['image/webp'],
    extensions: ['.webp'],
    maxSize: 50 * 1024 * 1024, // 50MB
    supportsTransparency: true,
    description: 'Web Picture format'
  },
  gif: {
    name: 'GIF',
    mimeTypes: ['image/gif'],
    extensions: ['.gif'],
    maxSize: 50 * 1024 * 1024, // 50MB
    supportsTransparency: true,
    description: 'Graphics Interchange Format'
  },
  bmp: {
    name: 'BMP',
    mimeTypes: ['image/bmp', 'image/x-bmp'],
    extensions: ['.bmp'],
    maxSize: 50 * 1024 * 1024, // 50MB
    supportsTransparency: false,
    description: 'Bitmap Image File'
  },
  svg: {
    name: 'SVG',
    mimeTypes: ['image/svg+xml'],
    extensions: ['.svg'],
    maxSize: 100 * 1024 * 1024, // 100MB
    supportsTransparency: true,
    description: 'Scalable Vector Graphics'
  }
};

export interface DetectedFormat {
  format: ImageFormat;
  formatKey: string;
  isSupported: boolean;
  dimensions?: { width: number; height: number };
}

/**
 * Get all supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  return Object.values(SUPPORTED_FORMATS)
    .flatMap(format => format.mimeTypes);
}

/**
 * Get all supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return Object.values(SUPPORTED_FORMATS)
    .flatMap(format => format.extensions);
}

/**
 * Detect image format from file
 */
export function detectImageFormat(file: File): DetectedFormat | null {
  // Check MIME type first
  for (const [key, format] of Object.entries(SUPPORTED_FORMATS)) {
    if (format.mimeTypes.includes(file.type)) {
      return {
        format,
        formatKey: key,
        isSupported: true
      };
    }
  }

  // Fallback to file extension if MIME type is generic or missing
  const fileName = file.name.toLowerCase();
  for (const [key, format] of Object.entries(SUPPORTED_FORMATS)) {
    if (format.extensions.some(ext => fileName.endsWith(ext))) {
      return {
        format,
        formatKey: key,
        isSupported: true
      };
    }
  }

  return null;
}

/**
 * Validate file against format constraints
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string; format?: DetectedFormat } {
  const detectedFormat = detectImageFormat(file);
  
  if (!detectedFormat) {
    return {
      isValid: false,
      error: `Unsupported file format. Supported formats: ${Object.values(SUPPORTED_FORMATS).map(f => f.name).join(', ')}`
    };
  }

  // Check file size
  if (file.size > detectedFormat.format.maxSize) {
    const maxSizeMB = Math.round(detectedFormat.format.maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File too large. ${detectedFormat.format.name} files must be smaller than ${maxSizeMB}MB.`,
      format: detectedFormat
    };
  }

  return {
    isValid: true,
    format: detectedFormat
  };
}

/**
 * Check if browser supports a specific image format
 */
export function isBrowserSupported(mimeType: string): boolean {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return false;
  
  // For WebP support check
  if (mimeType === 'image/webp') {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  // Most modern browsers support PNG, JPEG, GIF, BMP
  const supportedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/svg+xml'];
  return supportedTypes.includes(mimeType);
}

/**
 * Get WebP-specific browser compatibility information
 */
export function getWebPCompatibilityInfo(): {
  supported: boolean;
  message?: string;
  recommendation?: string;
} {
  const isSupported = isBrowserSupported('image/webp');
  
  if (isSupported) {
    return {
      supported: true,
      message: 'Your browser fully supports WebP format processing.'
    };
  }
  
  return {
    supported: false,
    message: 'Your browser has limited WebP support. Conversion will still work, but preview quality may be reduced.',
    recommendation: 'For best results with WebP files, use Chrome 32+, Firefox 65+, Safari 14+, or Edge 18+.'
  };
}

/**
 * Analyze WebP file characteristics
 */
export async function analyzeWebPFile(file: File): Promise<{
  isAnimated: boolean;
  hasTransparency: boolean;
  estimatedQuality: 'high' | 'medium' | 'low';
  recommendation?: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve({
          isAnimated: false,
          hasTransparency: true, // Default assumption for WebP
          estimatedQuality: 'medium'
        });
        return;
      }

      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Basic WebP header analysis
      // WebP file signature: 'RIFF' + size + 'WEBP'
      const isValidWebP = 
        uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && // 'RI'
        uint8Array[2] === 0x46 && uint8Array[3] === 0x46 && // 'FF'
        uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && // 'WE'
        uint8Array[10] === 0x42 && uint8Array[11] === 0x50; // 'BP'

      if (!isValidWebP) {
        resolve({
          isAnimated: false,
          hasTransparency: true,
          estimatedQuality: 'medium'
        });
        return;
      }

      // Check for animation (ANIM chunk)
      const hasAnimChunk = arrayBuffer.byteLength > 100 && 
        new TextDecoder().decode(uint8Array.slice(12, 100)).includes('ANIM');

      // Estimate quality based on file size vs dimensions
      const fileSizeKB = file.size / 1024;
      let estimatedQuality: 'high' | 'medium' | 'low' = 'medium';
      
      if (fileSizeKB > 500) {
        estimatedQuality = 'high';
      } else if (fileSizeKB < 50) {
        estimatedQuality = 'low';
      }

      const result = {
        isAnimated: hasAnimChunk,
        hasTransparency: true, // WebP supports transparency
        estimatedQuality,
        recommendation: hasAnimChunk 
          ? 'Animated WebP detected. Only the first frame will be used for ICO conversion.'
          : estimatedQuality === 'low' 
            ? 'Low quality WebP detected. Consider using a higher quality source for better results.'
            : undefined
      };

      resolve(result);
    };

    reader.onerror = () => {
      resolve({
        isAnimated: false,
        hasTransparency: true,
        estimatedQuality: 'medium'
      });
    };

    // Read first 1KB for analysis
    reader.readAsArrayBuffer(file.slice(0, 1024));
  });
}

/**
 * Get format-specific validation messages
 */
export function getFormatSpecificMessage(formatKey: string): string | null {
  switch (formatKey) {
    case 'webp':
      return 'Note: WebP format provides excellent compression with transparency support. Animated WebP files will use the first frame for conversion.';
    case 'gif':
      return 'Note: For animated GIFs, only the first frame will be used for ICO conversion.';
    case 'jpg':
      return 'Note: JPEG images don\'t support transparency. A white background will be added if needed.';
    case 'bmp':
      return 'Note: BMP images don\'t support transparency. A white background will be added if needed.';
    case 'svg':
      return 'Note: SVG files will be rasterized to create the ICO. Complex SVGs may take longer to process.';
    default:
      return null;
  }
}
