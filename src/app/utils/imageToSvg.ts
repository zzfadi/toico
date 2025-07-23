import { loadImageToCanvas, resizeImageWithHighQuality, hasTransparency, addWhiteBackground } from './canvasHelpers';
import { detectImageFormat } from './imageFormats';

// SVG-optimized sizes for different use cases
export const SVG_SIZES = [24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768] as const;

// Common SVG size presets for different use cases
export const SVG_PRESETS = {
  icons: [16, 24, 32, 48], // UI icons
  web: [64, 96, 128, 192], // Web graphics  
  display: [256, 384, 512, 768], // Large displays
  all: [24, 48, 96, 192, 384] // Balanced selection
} as const;

export interface SvgConversionOptions {
  embedHighQuality?: boolean;
  includeMetadata?: boolean;
  optimizeForWeb?: boolean;
}

/**
 * Convert any supported image format to a multi-size SVG sprite
 * Maintains the premium quality and client-side processing of the existing ICO converter
 */
export async function convertImageToSvg(
  file: File, 
  selectedSizes?: number[], 
  options: SvgConversionOptions = {}
): Promise<string> {
  try {
    // Detect image format using existing utility
    const formatDetection = detectImageFormat(file);
    if (!formatDetection) {
      throw new Error('Unsupported image format for SVG conversion');
    }

    // Use selected sizes or intelligent defaults based on image type
    const sizesToUse = selectedSizes && selectedSizes.length > 0 
      ? selectedSizes 
      : getDefaultSvgSizes(formatDetection.formatKey);
    
    // Sort sizes for optimal SVG structure (largest first for better fallbacks)
    const sortedSizes = [...sizesToUse].sort((a, b) => b - a);

    let svgElements: Array<{ size: number; element: string; viewBox: string }> = [];

    if (formatDetection.formatKey === 'svg') {
      // Handle SVG → SVG (optimization and multi-size generation)
      svgElements = await processSvgToSvg(file, sortedSizes, options);
    } else {
      // Handle raster → SVG (high-quality embedding with optimization)
      svgElements = await processRasterToSvg(file, sortedSizes, options);
    }

    if (svgElements.length === 0) {
      throw new Error('Failed to generate SVG elements');
    }

    // Create comprehensive SVG sprite with premium structure
    const svgSprite = createSvgSprite(svgElements, {
      originalFormat: formatDetection.format.name,
      fileName: file.name,
      generatedAt: new Date().toISOString(),
      ...options
    });

    // Create blob URL for download
    const svgBlob = new Blob([svgSprite], { type: 'image/svg+xml' });
    return URL.createObjectURL(svgBlob);

  } catch (error) {
    console.error('SVG conversion failed:', error);
    throw new Error(`Failed to convert ${file.name} to SVG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process SVG files for optimization and multi-size generation
 */
async function processSvgToSvg(
  file: File, 
  sizes: number[], 
  _options: SvgConversionOptions
): Promise<Array<{ size: number; element: string; viewBox: string }>> {
  const svgContent = await readFileAsText(file);
  const elements: Array<{ size: number; element: string; viewBox: string }> = [];

  // Parse original SVG to extract viewBox and optimize
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');

  if (!svgElement) {
    throw new Error('Invalid SVG file structure');
  }

  // Extract or calculate viewBox
  let viewBox = svgElement.getAttribute('viewBox');
  if (!viewBox) {
    const width = parseFloat(svgElement.getAttribute('width') || '100');
    const height = parseFloat(svgElement.getAttribute('height') || '100');
    viewBox = `0 0 ${width} ${height}`;
  }

  // For SVG input, we create optimized versions at each size
  for (const size of sizes) {
    // Clean up the SVG content and optimize for the target size
    const optimizedContent = optimizeSvgForSize(svgElement.innerHTML, size);
    
    elements.push({
      size,
      element: optimizedContent,
      viewBox
    });
  }

  return elements;
}

/**
 * Process raster images (PNG, JPEG, WebP, GIF, BMP) to SVG with high-quality embedding
 */
async function processRasterToSvg(
  file: File, 
  sizes: number[], 
  options: SvgConversionOptions
): Promise<Array<{ size: number; element: string; viewBox: string }>> {
  const sourceCanvas = await loadImageToCanvas(file);
  const elements: Array<{ size: number; element: string; viewBox: string }> = [];
  
  const formatDetection = detectImageFormat(file);
  const needsBackground = formatDetection && !formatDetection.format.supportsTransparency && hasTransparency(sourceCanvas);

  for (const size of sizes) {
    try {
      // Generate high-quality canvas at target size
      let canvas: HTMLCanvasElement;
      if (sourceCanvas.width === size && sourceCanvas.height === size) {
        canvas = sourceCanvas;
      } else {
        canvas = resizeImageWithHighQuality(sourceCanvas, size, size);
      }

      // Add white background if needed (for JPEG, BMP)
      if (needsBackground) {
        canvas = addWhiteBackground(canvas);
      }

      // Convert to high-quality data URL
      const quality = options.embedHighQuality !== false ? 0.95 : 0.8;
      const dataUrl = canvas.toDataURL('image/png', quality);

      // Create SVG image element with proper scaling and optimization
      const imageElement = createOptimizedImageElement(dataUrl, size, {
        preserveAspectRatio: 'xMidYMid meet',
        className: `icon-${size}px`,
        alt: `${file.name} at ${size}px`
      });

      elements.push({
        size,
        element: imageElement,
        viewBox: `0 0 ${size} ${size}`
      });

    } catch (sizeError) {
      console.warn(`Failed to process size ${size}px:`, sizeError);
      // Continue with other sizes
    }
  }

  return elements;
}

/**
 * Create a comprehensive SVG sprite with premium structure and metadata
 */
function createSvgSprite(
  elements: Array<{ size: number; element: string; viewBox: string }>,
  metadata: {
    originalFormat: string;
    fileName: string;
    generatedAt: string;
    includeMetadata?: boolean;
    optimizeForWeb?: boolean;
  }
): string {
  const { originalFormat, fileName, generatedAt, includeMetadata = true, optimizeForWeb = true } = metadata;
  
  // Create symbol definitions for each size
  const symbols = elements.map(({ size, element, viewBox }) => 
    `  <symbol id="icon-${size}" viewBox="${viewBox}" class="size-${size}px">
    ${element.split('\n').map(line => `    ${line}`).join('\n')}
  </symbol>`
  ).join('\n');

  // Create usage examples (commented)
  const usageExamples = elements.map(({ size }) => 
    `    <use href="#icon-${size}" width="${size}" height="${size}" />`
  ).join(' <!-- or -->\n');

  // Premium SVG structure with comprehensive metadata
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"${optimizeForWeb ? ' role="img"' : ''}>
  ${includeMetadata ? `<!-- 
    Universal Image to ICO Converter - Premium SVG Sprite
    Generated by: Defined by Jenna's Privacy-First Converter
    Original: ${fileName} (${originalFormat})
    Generated: ${generatedAt}
    Sizes: ${elements.map(e => e.size + 'px').join(', ')}
    
    Usage Examples:
${usageExamples}
  -->` : ''}
  
  <defs>
${symbols}
  </defs>
  
  ${optimizeForWeb ? `<style>
    .icon-sprite { display: none; }
    .size-24px { --icon-size: 24px; }
    .size-48px { --icon-size: 48px; }
    .size-96px { --icon-size: 96px; }
    .size-192px { --icon-size: 192px; }
    .size-384px { --icon-size: 384px; }
    .size-768px { --icon-size: 768px; }
  </style>` : ''}
  
  <!-- Default display: largest size -->
  <use href="#icon-${elements[0].size}" width="100%" height="100%" class="icon-default" />
  
</svg>`;
}

/**
 * Create optimized image element for raster-to-SVG conversion
 */
function createOptimizedImageElement(
  dataUrl: string, 
  size: number, 
  options: {
    preserveAspectRatio?: string;
    className?: string;
    alt?: string;
  }
): string {
  const { preserveAspectRatio = 'xMidYMid meet', className = '', alt = '' } = options;
  
  return `<image 
      href="${dataUrl}" 
      width="${size}" 
      height="${size}" 
      x="0" 
      y="0"${preserveAspectRatio ? `\n      preserveAspectRatio="${preserveAspectRatio}"` : ''}${className ? `\n      class="${className}"` : ''}${alt ? `\n      alt="${alt}"` : ''} />`;
}

/**
 * Optimize SVG content for specific target size
 */
function optimizeSvgForSize(svgContent: string, targetSize: number): string {
  // Basic SVG optimization for target size
  // This could be expanded with more sophisticated optimization
  let optimized = svgContent;
  
  // Remove unnecessary whitespace while preserving structure
  optimized = optimized.replace(/\s+/g, ' ').trim();
  
  // Optimize for smaller sizes (remove very fine details)
  if (targetSize <= 48) {
    // Remove very small elements or thin strokes that won't be visible
    optimized = optimized.replace(/stroke-width="0\.[0-9]+"/, 'stroke-width="1"');
  }
  
  return optimized;
}

/**
 * Get intelligent default sizes based on image format and intended use
 */
function getDefaultSvgSizes(formatKey: string): number[] {
  switch (formatKey) {
    case 'svg':
      // For SVG sources, include comprehensive sizes since we maintain vector quality
      return [32, 64, 128, 256, 512];
    
    case 'png':
      // For PNG (often logos/icons), focus on icon and web sizes
      return [32, 64, 128, 256];
    
    case 'jpeg':
    case 'webp':
      // For photos, focus on larger display sizes with some web sizes
      return [128, 256, 384, 512];
    
    case 'gif':
      // For GIFs (often small graphics), focus on smaller to medium sizes
      return [32, 64, 128, 192];
    
    case 'bmp':
      // For BMP (legacy format), conservative sizes
      return [32, 64, 128, 192];
    
    default:
      // Balanced default covering common use cases
      return [64, 128, 256];
  }
}

/**
 * Helper function to read file as text (for SVG files)
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as text'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Convert image to individual SVG files (one per size)
 */
export async function convertImageToIndividualSvgs(
  file: File, 
  selectedSizes: number[], 
  _options: SvgConversionOptions = {}
): Promise<Array<{ size: number; url: string; filename: string }>> {
  try {
    const formatDetection = detectImageFormat(file);
    if (!formatDetection) {
      throw new Error('Unsupported image format for SVG conversion');
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const results: Array<{ size: number; url: string; filename: string }> = [];

    for (const size of selectedSizes) {
      let svgContent: string;

      if (formatDetection.formatKey === 'svg') {
        // For SVG input, create optimized single-size version
        const originalSvg = await readFileAsText(file);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');

        if (!svgElement) {
          throw new Error('Invalid SVG file structure');
        }

        // Set specific dimensions and optimize
        svgElement.setAttribute('width', size.toString());
        svgElement.setAttribute('height', size.toString());
        svgElement.setAttribute('viewBox', `0 0 ${size} ${size}`);

        // Optimize content for the specific size
        const optimizedContent = optimizeSvgForSize(svgElement.innerHTML, size);
        svgElement.innerHTML = optimizedContent;

        svgContent = new XMLSerializer().serializeToString(svgElement);
      } else {
        // For raster images, create embedded SVG
        const canvas = await loadImageToCanvas(file);
        const resized = resizeImageWithHighQuality(canvas, size, size);
        
        // Add white background if needed
        const needsBackground = !formatDetection.format.supportsTransparency && hasTransparency(resized);
        const finalCanvas = needsBackground ? addWhiteBackground(resized) : resized;
        
        const dataUrl = finalCanvas.toDataURL('image/png', 0.95);
        
        svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <title>${baseName} - ${size}x${size}px</title>
  <image href="${dataUrl}" width="${size}" height="${size}" />
</svg>`;
      }

      // Create blob and URL for this size
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const filename = `${baseName}-${size}px.svg`;

      results.push({ size, url, filename });
    }

    return results;

  } catch (error) {
    console.error('Individual SVG conversion failed:', error);
    throw new Error(`Failed to convert ${file.name} to individual SVGs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download multiple SVG files (one per size)
 */
export function downloadIndividualSvgFiles(svgFiles: Array<{ size: number; url: string; filename: string }>): void {
  svgFiles.forEach((svgFile, index) => {
    // Stagger downloads to avoid browser blocking
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = svgFile.url;
      link.download = svgFile.filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up after download
      setTimeout(() => {
        URL.revokeObjectURL(svgFile.url);
      }, 2000);
    }, index * 300); // 300ms delay between downloads
  });
}

/**
 * Download SVG file with proper naming and cleanup (legacy sprite version)
 */
export function downloadSvgFile(svgUrl: string, originalFileName: string = 'image'): void {
  // Generate smart filename
  const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
  const filename = `${baseName}-sprite.svg`;
  
  const link = document.createElement('a');
  link.href = svgUrl;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(svgUrl);
  }, 1000);
}

/**
 * Get preview SVG for UI display (simplified version)
 */
export async function generateSvgPreview(
  file: File, 
  previewSize: number = 192
): Promise<string> {
  try {
    const formatDetection = detectImageFormat(file);
    if (!formatDetection) {
      throw new Error('Unsupported format for preview');
    }

    if (formatDetection.formatKey === 'svg') {
      // For SVG, return optimized version at preview size
      const svgContent = await readFileAsText(file);
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (svgElement) {
        svgElement.setAttribute('width', previewSize.toString());
        svgElement.setAttribute('height', previewSize.toString());
        return new XMLSerializer().serializeToString(svgElement);
      }
    } else {
      // For raster, create simple embedded SVG
      const canvas = await loadImageToCanvas(file);
      const resized = resizeImageWithHighQuality(canvas, previewSize, previewSize);
      const dataUrl = resized.toDataURL('image/png', 0.9);
      
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${previewSize}" height="${previewSize}" viewBox="0 0 ${previewSize} ${previewSize}">
        <image href="${dataUrl}" width="${previewSize}" height="${previewSize}" />
      </svg>`;
    }
    
    throw new Error('Failed to generate preview');
  } catch (error) {
    console.error('SVG preview generation failed:', error);
    throw error;
  }
}