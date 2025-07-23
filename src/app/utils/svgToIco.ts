// Multi-size ICO conversion
const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const;

export async function convertSvgToIco(svgDataUrl: string): Promise<string> {
  try {
    if (!svgDataUrl || !svgDataUrl.includes(',')) {
      throw new Error('Invalid SVG data URL');
    }
    
    const svgData = svgDataUrl.split(',')[1];
    if (!svgData) {
      throw new Error('No SVG data found');
    }
    
    const svgContent = atob(svgData);
    
    // Generate PNG data for multiple sizes
    const pngData: { size: number; data: Uint8Array }[] = [];
    
    for (const size of ICO_SIZES) {
      const pngDataUrl = await renderSvgToPng(svgContent, size);
      if (pngDataUrl) {
        const response = await fetch(pngDataUrl);
        const arrayBuffer = await response.arrayBuffer();
        pngData.push({ size, data: new Uint8Array(arrayBuffer) });
      }
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

async function renderSvgToPng(svgContent: string, size: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(null);
      return;
    }
    
    canvas.width = size;
    canvas.height = size;
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      reject(new Error('SVG rendering timeout after 10 seconds'));
    }, 10000); // 10 second timeout
    
    const img = new Image();
    let url: string;
    
    try {
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      url = URL.createObjectURL(svgBlob);
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error('Failed to create SVG blob'));
      return;
    }
    
    img.onload = () => {
      try {
        clearTimeout(timeout);
        
        // Fill with transparent background
        ctx.clearRect(0, 0, size, size);
        
        // Draw SVG
        ctx.drawImage(img, 0, 0, size, size);
        
        // Convert to PNG data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      if (url) {
        URL.revokeObjectURL(url);
      }
      reject(new Error('Failed to load SVG image - the SVG may be corrupted or invalid'));
    };
    
    img.src = url;
  });
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