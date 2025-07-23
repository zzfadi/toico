// Image processing Web Worker
self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'RESIZE_IMAGE':
        resizeImage(data);
        break;
      case 'PROCESS_ICO':
        processIco(data);
        break;
      default:
        self.postMessage({ 
          type: 'ERROR', 
          error: `Unknown message type: ${type}` 
        });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error.message || 'Worker processing error' 
    });
  }
};

function resizeImage({ imageData, targetWidth, targetHeight, quality = 'high' }) {
  // Create canvas in worker context
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context in worker');
  }

  // Configure image quality
  ctx.imageSmoothingEnabled = quality !== 'pixelated';
  ctx.imageSmoothingQuality = quality === 'high' ? 'high' : 'medium';

  // For very small sizes, use pixelated rendering
  if (targetWidth <= 32 || targetHeight <= 32) {
    ctx.imageSmoothingEnabled = false;
  }

  // Create ImageBitmap from the data and draw to canvas
  createImageBitmap(imageData).then(bitmap => {
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    
    // Convert to blob and send back
    canvas.convertToBlob({ type: 'image/png' }).then(blob => {
      self.postMessage({
        type: 'RESIZE_COMPLETE',
        blob: blob,
        width: targetWidth,
        height: targetHeight
      });
    });
  }).catch(error => {
    self.postMessage({ 
      type: 'ERROR', 
      error: `Image resize failed: ${error.message}` 
    });
  });
}

function processIco({ imageSizes, outputSizes }) {
  // Process multiple image sizes for ICO creation
  // This would be a more complex implementation for batch processing
  self.postMessage({
    type: 'ICO_PROCESSING',
    message: 'ICO processing started...'
  });
  
  // For now, just send a completion message
  // In a real implementation, this would handle the ICO file creation
  setTimeout(() => {
    self.postMessage({
      type: 'ICO_COMPLETE',
      message: 'ICO processing completed'
    });
  }, 100);
}
