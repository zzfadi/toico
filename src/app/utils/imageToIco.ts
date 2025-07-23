import { loadImageToCanvas, loadSvgToCanvas, resizeImageWithHighQuality, hasTransparency, addWhiteBackground, canvasToPngData } from './canvasHelpers';
import { detectImageFormat } from './imageFormats';

// Multi-size ICO conversion
const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const;

export async function convertImageToIco(file: File, selectedSizes?: number[]): Promise<string> {
  try {
    // Detect image format
    const formatDetection = detectImageFormat(file);
    if (!formatDetection) {
      throw new Error('Unsupported image format');
    }

    // Use selected sizes or default to all sizes
    const sizesToUse = selectedSizes && selectedSizes.length > 0 ? selectedSizes : [...ICO_SIZES];
    
    let sourceCanvas: HTMLCanvasElement;

    // Handle different image formats
    if (formatDetection.formatKey === 'svg') {
      // For SVG files, we need to read the content and process each size separately
      const svgContent = await readFileAsText(file);
      const pngData: { size: number; data: Uint8Array }[] = [];

      for (const size of sizesToUse) {
        const canvas = await loadSvgToCanvas(svgContent, size);
        const data = await canvasToPngData(canvas);
        pngData.push({ size, data });
      }

      if (pngData.length === 0) {
        throw new Error('Failed to generate any PNG data from SVG');
      }

      const icoBuffer = createIcoFile(pngData);
      const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' });
      return URL.createObjectURL(icoBlob);
    } else {
      // For raster images, load once and resize for each size
      sourceCanvas = await loadImageToCanvas(file);
    }

    // Generate PNG data for selected sizes
    const pngData: { size: number; data: Uint8Array }[] = [];
    
    for (const size of sizesToUse) {
      let canvas: HTMLCanvasElement;
      
      if (sourceCanvas.width === size && sourceCanvas.height === size) {
        canvas = sourceCanvas;
      } else {
        canvas = resizeImageWithHighQuality(sourceCanvas, size, size);
      }

      // Handle transparency for formats that don't support it
      if (!formatDetection.format.supportsTransparency && hasTransparency(canvas)) {
        canvas = addWhiteBackground(canvas);
      }

      const data = await canvasToPngData(canvas);
      pngData.push({ size, data });
    }
    
    if (pngData.length === 0) {
      throw new Error('Failed to generate any PNG data');
    }
    
    // Create proper ICO file with multiple sizes
    const icoBuffer = createIcoFile(pngData);
    const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' });
    return URL.createObjectURL(icoBlob);
    
  } catch (error) {
    console.error('Image conversion failed:', error);
    throw new Error(`Failed to convert ${file.name} to ICO: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Legacy function for backward compatibility
export async function convertSvgToIco(svgDataUrl: string, selectedSizes?: number[]): Promise<string> {
  try {
    if (!svgDataUrl || !svgDataUrl.includes(',')) {
      throw new Error('Invalid SVG data URL');
    }
    
    const svgData = svgDataUrl.split(',')[1];
    if (!svgData) {
      throw new Error('No SVG data found');
    }
    
    const svgContent = atob(svgData);
    
    // Use selected sizes or default to all sizes
    const sizesToUse = selectedSizes && selectedSizes.length > 0 ? selectedSizes : [...ICO_SIZES];
    
    // Generate PNG data for selected sizes
    const pngData: { size: number; data: Uint8Array }[] = [];
    
    for (const size of sizesToUse) {
      const canvas = await loadSvgToCanvas(svgContent, size);
      const data = await canvasToPngData(canvas);
      pngData.push({ size, data });
    }
    
    if (pngData.length === 0) {
      throw new Error('Failed to generate any PNG data');
    }
    
    // Create proper ICO file with multiple sizes
    const icoBuffer = createIcoFile(pngData);
    const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' });
    return URL.createObjectURL(icoBlob);
    
  } catch (error) {
    console.error('SVG conversion failed:', error);
    throw new Error('Failed to convert SVG to ICO');
  }
}

// Helper function to read file as text
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Create a proper ICO file format with multiple PNG entries
function createIcoFile(pngData: { size: number; data: Uint8Array }[]): ArrayBuffer {
  const numImages = pngData.length;
  const headerSize = 6 + (numImages * 16); // ICO header + directory entries
  
  // Calculate total file size
  let totalSize = headerSize;
  for (const png of pngData) {
    totalSize += png.data.length;
  }
  
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);
  
  let offset = 0;
  
  // ICO header
  view.setUint16(0, 0, true); // Reserved, must be 0
  view.setUint16(2, 1, true); // Type: 1 for ICO
  view.setUint16(4, numImages, true); // Number of images
  offset = 6;
  
  // Directory entries
  let dataOffset = headerSize;
  for (let i = 0; i < numImages; i++) {
    const png = pngData[i];
    const size = png.size >= 256 ? 0 : png.size; // 0 means 256
    
    view.setUint8(offset, size); // Width
    view.setUint8(offset + 1, size); // Height
    view.setUint8(offset + 2, 0); // Color palette (0 for PNG)
    view.setUint8(offset + 3, 0); // Reserved
    view.setUint16(offset + 4, 1, true); // Color planes
    view.setUint16(offset + 6, 32, true); // Bits per pixel
    view.setUint32(offset + 8, png.data.length, true); // Image data size
    view.setUint32(offset + 12, dataOffset, true); // Offset to image data
    
    offset += 16;
    dataOffset += png.data.length;
  }
  
  // Image data
  dataOffset = headerSize;
  for (const png of pngData) {
    uint8View.set(png.data, dataOffset);
    dataOffset += png.data.length;
  }
  
  return buffer;
}

export function downloadIcoFile(icoUrl: string, filename: string = 'favicon.ico') {
  const link = document.createElement('a');
  link.href = icoUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL after download
  setTimeout(() => {
    URL.revokeObjectURL(icoUrl);
  }, 1000);
}