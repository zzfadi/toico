// Web Worker manager for image processing

let worker: Worker | null = null;
let isWorkerSupported = true;

export function initializeWorker(): boolean {
  if (typeof Worker === 'undefined') {
    console.warn('Web Workers not supported in this environment');
    isWorkerSupported = false;
    return false;
  }

  try {
    worker = new Worker('/image-worker.js');
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      isWorkerSupported = false;
      worker = null;
    };
    return true;
  } catch (error) {
    console.error('Failed to initialize worker:', error);
    isWorkerSupported = false;
    return false;
  }
}

export function isWorkerAvailable(): boolean {
  return isWorkerSupported && worker !== null;
}

export function resizeImageWithWorker(
  imageData: ImageData | Blob, 
  targetWidth: number, 
  targetHeight: number,
  quality: 'high' | 'medium' | 'pixelated' = 'high'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!isWorkerAvailable()) {
      reject(new Error('Worker not available'));
      return;
    }

    const messageHandler = (e: MessageEvent) => {
      const { type, blob, error } = e.data;
      
      worker!.removeEventListener('message', messageHandler);
      
      if (type === 'ERROR') {
        reject(new Error(error));
      } else if (type === 'RESIZE_COMPLETE') {
        resolve(blob);
      }
    };

    worker!.addEventListener('message', messageHandler);
    worker!.postMessage({
      type: 'RESIZE_IMAGE',
      data: { imageData, targetWidth, targetHeight, quality }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      worker!.removeEventListener('message', messageHandler);
      reject(new Error('Worker timeout'));
    }, 30000);
  });
}

export function processIcoWithWorker(
  imageSizes: Array<{ size: number; data: Blob }>,
  outputSizes: number[]
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (!isWorkerAvailable()) {
      reject(new Error('Worker not available'));
      return;
    }

    const messageHandler = (e: MessageEvent) => {
      const { type, data, error } = e.data;
      
      if (type === 'ERROR') {
        worker!.removeEventListener('message', messageHandler);
        reject(new Error(error));
      } else if (type === 'ICO_COMPLETE') {
        worker!.removeEventListener('message', messageHandler);
        resolve(data);
      } else if (type === 'ICO_PROCESSING') {
        console.log('ICO processing:', e.data.message);
      }
    };

    worker!.addEventListener('message', messageHandler);
    worker!.postMessage({
      type: 'PROCESS_ICO',
      data: { imageSizes, outputSizes }
    });

    // Timeout after 60 seconds for ICO processing
    setTimeout(() => {
      worker!.removeEventListener('message', messageHandler);
      reject(new Error('ICO processing timeout'));
    }, 60000);
  });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

// Auto-initialize worker when module loads
if (typeof window !== 'undefined') {
  initializeWorker();
}
