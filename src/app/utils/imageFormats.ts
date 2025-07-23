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
 * Get format-specific validation messages
 */
export function getFormatSpecificMessage(formatKey: string): string | null {
  switch (formatKey) {
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
