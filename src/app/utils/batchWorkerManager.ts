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
      this.worker = new Worker('/batch-worker.js');
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = (_error) => {
        console.error('Worker error:', _error);
        this.callbacks.onError?.('Worker error occurred');
      };
    } catch (error) {
      console.warn('Web Worker not supported, falling back to main thread');
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