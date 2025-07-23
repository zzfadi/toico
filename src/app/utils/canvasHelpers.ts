// Canvas helpers for high-quality image processing

/**
 * High-quality image resampling using canvas
 */
export function resizeImageWithHighQuality(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // For very small sizes, use pixelated rendering
  if (targetWidth <= 32 || targetHeight <= 32) {
    ctx.imageSmoothingEnabled = false;
  }

  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/**
 * Detect if image has transparency
 */
export function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Check alpha channel
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }

  return false;
}

/**
 * Add white background to canvas if no transparency is needed
 */
export function addWhiteBackground(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const newCanvas = document.createElement('canvas');
  const ctx = newCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  newCanvas.width = canvas.width;
  newCanvas.height = canvas.height;

  // Fill with white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

  // Draw original image on top
  ctx.drawImage(canvas, 0, 0);

  return newCanvas;
}

/**
 * Load image file to canvas with proper error handling
 */
export function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    // Set timeout for loading
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Image loading timeout'));
    }, 10000);

    img.onload = () => {
      try {
        clearTimeout(timeout);
        
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        ctx.drawImage(img, 0, 0);
        
        URL.revokeObjectURL(url);
        resolve(canvas);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image - the file may be corrupted'));
    };

    img.src = url;
  });
}

/**
 * Load SVG content to canvas
 */
export function loadSvgToCanvas(svgContent: string, size: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    let url: string;

    try {
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      url = URL.createObjectURL(svgBlob);
    } catch {
      reject(new Error('Failed to create SVG blob'));
      return;
    }

    // Set timeout for SVG loading
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG loading timeout'));
    }, 10000);

    img.onload = () => {
      try {
        clearTimeout(timeout);
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, size, size);
        
        // Draw SVG
        ctx.drawImage(img, 0, 0, size, size);
        
        URL.revokeObjectURL(url);
        resolve(canvas);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG - the file may be corrupted or invalid'));
    };

    img.src = url;
  });
}

/**
 * Convert canvas to PNG data
 */
export function canvasToPngData(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        resolve(new Uint8Array(arrayBuffer));
      };
      reader.onerror = () => {
        reject(new Error('Failed to read blob as array buffer'));
      };
      reader.readAsArrayBuffer(blob);
    }, 'image/png');
  });
}

/**
 * Get image dimensions from file without loading full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Dimension detection timeout'));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension detection'));
    };

    img.src = url;
  });
}
