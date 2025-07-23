// Simplified SVG to ICO conversion
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
    
    // Create a single PNG at 256x256 for simplicity
    // This avoids complex ICO format issues
    const pngDataUrl = await renderSvgToPng(svgContent, 256);
    if (!pngDataUrl) {
      throw new Error('Failed to render SVG');
    }
    
    // Convert PNG data URL to blob for download
    const response = await fetch(pngDataUrl);
    const blob = await response.blob();
    
    // Create a new blob with ICO mime type (browsers will handle it as PNG)
    const icoBlob = new Blob([blob], { type: 'image/x-icon' });
    return URL.createObjectURL(icoBlob);
    
  } catch (error) {
    console.error('SVG conversion failed:', error);
    throw new Error('Failed to convert SVG to ICO');
  }
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
}