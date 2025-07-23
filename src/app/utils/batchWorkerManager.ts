// Batch Processing Worker Manager
// Manages Web Worker lifecycle and communication for batch operations

export interface BatchWorkerMessage {
  type: 'PROCESS_BATCH' | 'FILE_PROGRESS' | 'OVERALL_PROGRESS' | 'BATCH_COMPLETE' | 'ERROR';
  data?: {
    files: File[];
    outputFormat: string;
    selectedSizes: number[];
    svgSelectedSizes: number[];
  };
  fileId?: string;
  progress?: number;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  message?: string;
}

export interface BatchWorkerCallbacks {
  onFileProgress?: (fileId: string, progress: number, status: string, error?: string) => void;
  onOverallProgress?: (progress: number) => void;
  onBatchComplete?: (message: string) => void;
  onError?: (error: string) => void;
}

export class BatchWorkerManager {
  private worker: Worker | null = null;
  private callbacks: BatchWorkerCallbacks = {};

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    if (typeof window === 'undefined') return; // SSR safety
    
    try {
      // Try multiple worker paths for different deployment environments
      const workerPaths = [
        '/batch-worker.js',          // Standard public path
        './batch-worker.js',         // Relative path
        `${window.location.origin}/batch-worker.js`, // Absolute URL
        new URL('/batch-worker.js', window.location.origin).href // Explicit URL construction
      ];

      let workerCreated = false;
      
      for (const workerPath of workerPaths) {
        try {
          this.worker = new Worker(workerPath);
          workerCreated = true;
          break;
        } catch (pathError) {
          console.warn(`Failed to load worker from ${workerPath}:`, pathError);
          continue;
        }
      }

      if (!workerCreated) {
        throw new Error('Unable to load Web Worker from any known path');
      }

      this.worker!.onmessage = this.handleMessage.bind(this);
      this.worker!.onerror = (error) => {
        console.error('Worker runtime error:', error);
        this.callbacks.onError?.(`Web Worker error: ${error.message || 'Unknown worker error'}. Batch processing may be slower.`);
      };

      // Test worker communication
      this.worker!.postMessage({ type: 'HEALTH_CHECK' });
      
    } catch (error) {
      console.warn('Web Worker initialization failed:', error);
      this.callbacks.onError?.('Web Worker not available in this environment. Batch processing will use main thread and may be slower.');
      this.worker = null;
    }
  }

  private handleMessage(e: MessageEvent<BatchWorkerMessage>) {
    const { type, fileId, progress, status, error, message } = e.data;

    switch (type) {
      case 'FILE_PROGRESS':
        if (fileId && typeof progress === 'number' && status) {
          this.callbacks.onFileProgress?.(fileId, progress, status, error);
        }
        break;
      case 'OVERALL_PROGRESS':
        if (typeof progress === 'number') {
          this.callbacks.onOverallProgress?.(progress);
        }
        break;
      case 'BATCH_COMPLETE':
        if (message) {
          this.callbacks.onBatchComplete?.(message);
        }
        break;
      case 'ERROR':
        if (e.data.error) {
          this.callbacks.onError?.(e.data.error);
        }
        break;
    }
  }

  public setCallbacks(callbacks: BatchWorkerCallbacks) {
    this.callbacks = callbacks;
  }

  public processBatch(files: File[], outputFormat: string, selectedSizes: number[], svgSelectedSizes: number[]) {
    if (!this.worker) {
      this.callbacks.onError?.('Web Worker not available');
      return;
    }

    this.worker.postMessage({
      type: 'PROCESS_BATCH',
      data: {
        files,
        outputFormat,
        selectedSizes,
        svgSelectedSizes
      }
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  public isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }
}

// Singleton instance for global use
let workerManager: BatchWorkerManager | null = null;

export function getBatchWorkerManager(): BatchWorkerManager {
  if (!workerManager) {
    workerManager = new BatchWorkerManager();
  }
  return workerManager;
}

export function terminateBatchWorker() {
  if (workerManager) {
    workerManager.terminate();
    workerManager = null;
  }
}