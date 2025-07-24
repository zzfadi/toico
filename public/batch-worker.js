// Batch Processing Web Worker
// Handles heavy image conversion operations in the background

self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'PROCESS_BATCH':
        await processBatch(data);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
};

async function processBatch({ files, outputFormat, selectedSizes, svgSelectedSizes }) {
  const totalFiles = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const fileData = files[i];
    
    try {
      // Notify start of processing for this file
      self.postMessage({
        type: 'FILE_PROGRESS',
        fileId: fileData.id,
        progress: 10,
        status: 'processing'
      });
      
      // Simulate processing time (replace with actual conversion logic)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
      
      // Processing complete
      self.postMessage({
        type: 'FILE_PROGRESS',
        fileId: fileData.id,
        progress: 100,
        status: 'completed'
      });
      
      // Update overall progress
      const overallProgress = Math.round(((i + 1) / totalFiles) * 100);
      self.postMessage({
        type: 'OVERALL_PROGRESS',
        progress: overallProgress
      });
      
    } catch (error) {
      self.postMessage({
        type: 'FILE_PROGRESS',
        fileId: fileData.id,
        progress: 0,
        status: 'error',
        error: error.message
      });
    }
  }
  
  self.postMessage({
    type: 'BATCH_COMPLETE',
    message: 'All files processed successfully'
  });
}

// Helper function to simulate processing delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}