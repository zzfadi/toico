# AGENTS.md

This file describes the agents, tools, and automated systems in the Universal Image Converter codebase to help AI assistants understand the architecture and generate relevant code completions.

## 🤖 Core Processing Agents

### ImageToIcoAgent
**Location**: `src/app/utils/imageToIco.ts`  
**Purpose**: Universal image-to-ICO conversion agent that handles all supported input formats

**Input Conventions**:
- `File` object (any supported image format: PNG, JPEG, WebP, GIF, BMP, SVG)
- Optional `selectedSizes: number[]` (subset of [16, 32, 48, 64, 128, 256])

**Output Conventions**:
- Returns `Promise<string>` - Blob URL for downloadable ICO file
- ICO file contains multiple PNG entries for each selected size
- Size 256 encoded as 0 in ICO headers (ICO format limitation)

**Key Features**:
- Format-specific processing (SVG rasterized per-size, raster images use high-quality resampling)
- Automatic transparency handling (white background for JPEG/BMP)
- Defensive timeout patterns (10-15 seconds max processing)

### ImageToSvgAgent
**Location**: `src/app/utils/imageToSvg.ts`  
**Purpose**: Converts raster images to scalable SVG format with intelligent sizing

**Input Conventions**:
- `File` object (PNG, JPEG, WebP, GIF, BMP supported)
- Optional target sizes array for optimization hints

**Output Conventions**:
- Returns `Promise<string>` - Blob URL for downloadable SVG file
- SVG contains embedded base64 image data
- Preserves transparency where supported

**Key Features**:
- Intelligent viewBox calculation based on original dimensions
- Format-specific optimization for different image types
- Scalable output suitable for modern web applications

### BatchProcessingAgent
**Location**: `src/app/utils/batchWorkerManager.ts`  
**Purpose**: Coordinates parallel processing of multiple files with progress tracking

**Input Conventions**:
```typescript
interface BatchFileInfo {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  result?: string; // Blob URL
  error?: string;
}
```

**Output Conventions**:
- Real-time progress updates via callback functions
- ZIP package containing all converted files
- Individual file status tracking with error handling

**Key Features**:
- Web Worker coordination for non-blocking UI
- Memory management for large batch operations
- Graceful error handling with partial success support

### PresetExportAgent
**Location**: `src/app/utils/presetExporter.ts`  
**Purpose**: Generates platform-specific icon packages with professional naming conventions

**Input Conventions**:
- `File` object (source image)
- `ExportPreset` object defining platform requirements
- Progress callback function for UI updates

**Output Conventions**:
```typescript
interface PresetExportResult {
  success: boolean;
  downloadUrl?: string;
  filename: string;
  filesGenerated: number;
  error?: string;
}
```

**Key Features**:
- Platform-specific size sets (iOS: 20×20 to 1024×1024, Android: 36×36 to 512×512, etc.)
- Professional naming conventions (`icon-20@1x.png`, `ic_launcher_foreground.png`)
- ZIP packaging with proper folder structures
- Progress tracking for complex export operations

## 🔧 Utility Agents

### FormatDetectionAgent
**Location**: `src/app/utils/imageFormats.ts`  
**Purpose**: Intelligent image format detection and validation

**Input Conventions**:
- `File` object with any extension
- Optional validation rules

**Output Conventions**:
```typescript
interface FormatDetectionResult {
  isValid: boolean;
  format?: ImageFormat;
  error?: string;
}
```

**Key Features**:
- MIME type validation with file extension fallback
- Format-specific size limits (50MB raster, 100MB SVG)
- Supports 6 major formats with detailed metadata

### CanvasProcessingAgent
**Location**: `src/app/utils/canvasHelpers.ts`  
**Purpose**: High-quality image processing and manipulation utilities

**Input Conventions**:
- Image files, Canvas elements, or ImageData objects
- Target dimensions and quality parameters

**Output Conventions**:
- Processed Canvas elements or ImageData
- PNG/ICO binary data for download
- Transparency-aware processing results

**Key Features**:
- High-quality resampling algorithms
- Transparency detection and handling
- Memory-efficient processing with cleanup
- Timeout protection for complex operations

## 🖥️ UI State Agents

### ModeManagementAgent
**Location**: `src/app/page.tsx` (state management section)  
**Purpose**: Orchestrates complex multi-mode application state

**Input Conventions**:
```typescript
type ProcessingMode = 'single' | 'batch' | 'presets';
type OutputFormat = 'ico' | 'svg';
```

**State Management**:
- **Single File State**: `imageFile`, `imageDataUrl`, `imageMetadata`, `convertedUrl`
- **Mode State**: `processingMode`, `currentFormat`, `selectedSizes`
- **Preset State**: `selectedPreset`, `isExportingPreset`, `presetProgress`

**Key Features**:
- Unidirectional state flow patterns
- Mode-specific state isolation
- Error state propagation and recovery
- Memory cleanup between mode switches

### ProgressTrackingAgent
**Location**: Multiple components with progress interfaces  
**Purpose**: Real-time progress monitoring for long-running operations

**Input Conventions**:
```typescript
interface ProgressUpdate {
  currentFile: string;
  currentSize: number;
  totalSizes: number;
  overallProgress: number;
  status: 'processing' | 'complete' | 'error';
}
```

**Output Conventions**:
- Real-time UI updates via callback functions
- Progress bars and status indicators
- Error state communication

## 🧪 Testing Agents

### PlaywrightTestAgent
**Location**: `tests/e2e/` directory  
**Purpose**: Comprehensive E2E testing across all application modes

**Test Coverage**:
- **154 unique test cases** across 10 test files
- **Multi-browser testing**: Chrome, Firefox, Safari, Edge, Mobile
- **Cross-mode testing**: Single, Batch, and Preset export workflows

**Helper Agents**:
- `file-helpers.ts`: File upload and validation utilities
- `conversion-helpers.ts`: Image conversion test utilities  
- `preset-helpers.ts`: Export preset testing utilities
- `batch-helpers.ts`: Batch processing test utilities

**Input/Output Conventions**:
- Page object pattern for reliable element selection
- Async/await patterns for all operations
- Screenshot and video capture on failures
- Comprehensive assertion patterns

## 🔄 Worker Agents

### ImageProcessingWorker
**Location**: `public/image-worker.js`  
**Purpose**: Background image processing to prevent UI blocking

**Communication Protocol**:
```typescript
// Input message format
interface WorkerMessage {
  type: 'process' | 'batch' | 'cancel';
  data: ImageProcessingData;
  id: string;
}

// Output message format
interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  id: string;
  result?: ProcessingResult;
  error?: string;
}
```

### BatchProcessingWorker
**Location**: `public/batch-worker.js`  
**Purpose**: Specialized worker for batch file processing operations

**Key Features**:
- Parallel file processing coordination
- Memory management for large batches
- Progress reporting for individual files
- Error isolation and recovery

## 🎯 Integration Patterns

### Agent Communication Patterns
1. **Timeout Protection**: All Canvas operations use 5-15 second timeouts
2. **Error Propagation**: Structured error handling with user-friendly messages
3. **Memory Management**: Proper cleanup of Blob URLs and Canvas contexts
4. **Progress Callbacks**: Real-time UI updates for long operations

### State Flow Patterns
- **Single Mode**: FileUploader → Preview → Download
- **Batch Mode**: BatchFileUploader → Progress Tracking → ZIP Download
- **Preset Mode**: PresetSelector → FileUploader → Automated Export → Download

### Testing Integration
- All agents have corresponding E2E test coverage
- Helper utilities abstract common testing patterns
- Cross-browser compatibility validation
- Performance and timeout testing

## 🔐 Privacy & Security Agents

### PrivacyEnforcementAgent
**Location**: Throughout application architecture  
**Purpose**: Ensures 100% client-side processing with no data leakage

**Key Principles**:
- No server endpoints for file processing
- All operations use File API, Canvas API, and Web Workers
- Blob URLs for downloads with proper cleanup
- No external service dependencies

This architecture ensures that all image processing agents maintain user privacy while providing professional-grade functionality across all supported workflows.