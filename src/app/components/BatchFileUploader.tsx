'use client';

import { useCallback, useState, useRef } from 'react';
import { validateImageFile, getSupportedMimeTypes, getSupportedExtensions } from '../utils/imageFormats';
import { getImageDimensions } from '../utils/canvasHelpers';
import { convertImageToIco } from '../utils/imageToIco';
import { convertImageToIndividualSvgs } from '../utils/imageToSvg';
import JSZip from 'jszip';
import { OutputFormat } from './Preview';

export interface BatchFileInfo {
  id: string;
  file: File;
  name: string;
  format: string;
  dimensions?: { width: number; height: number };
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  results?: {
    ico?: string;
    svgs?: Array<{ size: number; url: string; filename: string }>;
  };
}

interface BatchFileUploaderProps {
  onBatchComplete: (results: BatchFileInfo[]) => void;
  outputFormat: OutputFormat;
  selectedSizes: number[];
  svgSelectedSizes: number[];
}

export default function BatchFileUploader({ 
  onBatchComplete, 
  outputFormat, 
  selectedSizes, 
  svgSelectedSizes 
}: BatchFileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<BatchFileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const processFiles = useCallback(async (fileList: File[]) => {
    if (fileList.length === 0) return;

    setIsProcessing(true);
    const batchFiles: BatchFileInfo[] = [];

    // Initial validation and setup
    for (const file of fileList) {
      const validation = validateImageFile(file);
      const id = generateId();
      
      if (!validation.isValid || !validation.format) {
        batchFiles.push({
          id,
          file,
          name: file.name,
          format: 'Unknown',
          status: 'error',
          progress: 0,
          error: validation.error || 'Invalid file format'
        });
        continue;
      }

      const format = validation.format;
      let dimensions: { width: number; height: number } | undefined;

      // Get dimensions for raster images
      if (format.formatKey !== 'svg') {
        try {
          dimensions = await getImageDimensions(file);
        } catch (error) {
          console.warn('Could not get dimensions for', file.name, error);
        }
      }

      batchFiles.push({
        id,
        file,
        name: file.name,
        format: format.format.name,
        dimensions,
        status: 'pending',
        progress: 0
      });
    }

    setFiles(batchFiles);

    // Process files with parallel processing and concurrency control
    const results: BatchFileInfo[] = [...batchFiles]; // Start with all files
    const totalFiles = batchFiles.length;
    const CONCURRENCY_LIMIT = 3; // Process max 3 files simultaneously for browser stability
    let completedFiles = 0;

    // Filter out files that already have errors
    const validFiles = batchFiles.filter(fileInfo => fileInfo.status !== 'error');
    
    // Create processing tasks for all valid files
    const processingTasks = validFiles.map((fileInfo) => async () => {
      // Update status to processing
      fileInfo.status = 'processing';
      fileInfo.progress = 10;
      setFiles([...results]);

      try {
        if (outputFormat === 'ico') {
          // Convert to ICO with timeout protection
          fileInfo.progress = 50;
          setFiles([...results]);
          
          const icoUrl = await Promise.race([
            convertImageToIco(fileInfo.file, selectedSizes),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('ICO conversion timeout after 30 seconds')), 30000)
            )
          ]);
          fileInfo.results = { ico: icoUrl };
          fileInfo.progress = 100;
          fileInfo.status = 'completed';
          
        } else {
          // Convert to individual SVGs with timeout protection
          fileInfo.progress = 50;
          setFiles([...results]);
          
          const svgFiles = await Promise.race([
            convertImageToIndividualSvgs(
              fileInfo.file, 
              svgSelectedSizes, 
              {
                embedHighQuality: true,
                includeMetadata: true,
                optimizeForWeb: true
              }
            ),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('SVG conversion timeout after 30 seconds')), 30000)
            )
          ]);
          fileInfo.results = { svgs: svgFiles };
          fileInfo.progress = 100;
          fileInfo.status = 'completed';
        }
      } catch (error) {
        fileInfo.status = 'error';
        fileInfo.progress = 0;
        fileInfo.error = error instanceof Error ? error.message : 'Conversion failed';
      }

      // Update overall progress
      completedFiles++;
      setOverallProgress(Math.round((completedFiles / totalFiles) * 100));
      setFiles([...results]);
    });

    // Process tasks with controlled concurrency
    const processWithConcurrency = async (tasks: Array<() => Promise<void>>, limit: number) => {
      let index = 0;
      
      const executeNext = async (): Promise<void> => {
        if (index >= tasks.length) return;
        
        const taskIndex = index++;
        await tasks[taskIndex]();
        
        // Process next task
        return executeNext();
      };
      
      // Start initial batch of concurrent tasks
      const workers = Array(Math.min(limit, tasks.length))
        .fill(null)
        .map(() => executeNext());
      
      // Wait for all workers to complete
      await Promise.all(workers);
    };

    await processWithConcurrency(processingTasks, CONCURRENCY_LIMIT);

    setIsProcessing(false);
    onBatchComplete(results);
  }, [outputFormat, selectedSizes, svgSelectedSizes, onBatchComplete]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(Array.from(selectedFiles));
    }
  }, [processFiles]);

  const downloadBatch = useCallback(async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.results);
    if (completedFiles.length === 0) return;

    const zip = new JSZip();
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (outputFormat === 'ico') {
      // Create ICO files folder
      const icoFolder = zip.folder(`batch-ico-${timestamp}`);
      
      for (const fileInfo of completedFiles) {
        if (fileInfo.results?.ico) {
          try {
            const response = await fetch(fileInfo.results.ico);
            const blob = await response.blob();
            const fileName = `${fileInfo.name.replace(/\.[^/.]+$/, '')}.ico`;
            icoFolder?.file(fileName, blob);
          } catch (error) {
            console.warn('Failed to add ICO file to ZIP:', error);
          }
        }
      }
    } else {
      // Create SVG files with organized folders
      const svgFolder = zip.folder(`batch-svg-${timestamp}`);
      
      for (const fileInfo of completedFiles) {
        if (fileInfo.results?.svgs) {
          const fileFolder = svgFolder?.folder(fileInfo.name.replace(/\.[^/.]+$/, ''));
          
          for (const svgFile of fileInfo.results.svgs) {
            try {
              const response = await fetch(svgFile.url);
              const blob = await response.blob();
              fileFolder?.file(svgFile.filename, blob);
            } catch (error) {
              console.warn('Failed to add SVG file to ZIP:', error);
            }
          }
        }
      }
    }

    // Generate and download ZIP
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `batch-${outputFormat}-conversion-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
    } catch (error) {
      console.error('Failed to create ZIP file:', error);
    }
  }, [files, outputFormat]);

  const clearBatch = () => {
    setFiles([]);
    setOverallProgress(0);
    setIsProcessing(false);
  };

  const supportedExtensions = getSupportedExtensions().join(',');
  const supportedMimeTypes = getSupportedMimeTypes().join(',');
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Batch Upload Section Title */}
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
          🔥 Batch Processing Beast
        </h2>
        <p className="text-sm opacity-75" style={{color: '#36454F'}}>
          Drop multiple images and convert them all at once!
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
          isDragOver ? 'glass-card scale-[1.02] pulse-glow' : 'premium-gradient'
        }`}
        style={{
          borderColor: isDragOver ? '#B8956A' : 'rgba(164, 119, 100, 0.3)',
          opacity: isProcessing ? 0.9 : 1,
          backdropFilter: isDragOver ? 'blur(20px)' : 'blur(10px)'
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={`${supportedMimeTypes},${supportedExtensions}`}
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isProcessing}
          multiple
          aria-label="Upload multiple image files"
        />
        
        <div className="space-y-6">
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isDragOver ? 'pulse-glow scale-110' : isProcessing ? 'animate-pulse' : ''
          }`} style={{
            background: isDragOver 
              ? 'linear-gradient(135deg, rgba(184, 149, 106, 0.8), rgba(164, 119, 100, 0.9))' 
              : 'linear-gradient(135deg, rgba(164, 119, 100, 0.3), rgba(184, 149, 106, 0.2))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mb-1"></div>
                <span className="text-xs font-bold text-white">{overallProgress}%</span>
              </div>
            ) : (
              <svg
                className="w-12 h-12 transition-transform duration-300"
                fill="none"
                stroke={isDragOver ? '#F7F5F0' : '#A47764'}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4M12 8v8"
                />
              </svg>
            )}
          </div>
          
          <div>
            <p className="text-xl md:text-2xl font-serif font-bold mb-3 text-glow" style={{color: '#36454F'}}>
              {isProcessing 
                ? `Processing ${files.length} Files...` 
                : isDragOver 
                  ? 'Drop Your Images Here' 
                  : 'Upload Multiple Images'
              }
            </p>
            <p className="text-sm md:text-base mb-6" style={{color: '#36454F', opacity: 0.8}}>
              {isDragOver 
                ? 'Release to start batch processing' 
                : 'Drag & drop multiple files or click to browse'
              }
            </p>
            
            {!isProcessing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="glass-button px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 pulse-glow"
              >
                Select Multiple Files
              </button>
            )}
          </div>
          
          <div className="pt-4 border-t border-white/20">
            <p className="text-sm font-medium" style={{color: '#36454F', opacity: 0.7}}>
              <span className="block mb-1">⚡ Batch processing: Upload 2-50 files at once</span>
              <span className="block mb-1">📦 Auto ZIP download: All conversions in one file</span>
              <span className="block">🔒 100% Private: All processing happens locally</span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {files.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-bold text-glow" style={{color: '#36454F'}}>
              Batch Progress
            </h3>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span style={{color: '#22C55E'}}>✅ {completedCount}</span>
              <span style={{color: '#EF4444'}}>❌ {errorCount}</span>
              <span style={{color: '#36454F', opacity: 0.7}}>📁 {files.length} total</span>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium" style={{color: '#36454F'}}>Overall Progress</span>
              <span className="text-sm font-medium" style={{color: '#36454F'}}>{overallProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-classic-blue to-golden-terra"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* File List */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {files.map((fileInfo) => (
              <div
                key={fileInfo.id}
                className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
                style={{
                  background: fileInfo.status === 'completed' 
                    ? 'rgba(34, 197, 94, 0.1)'
                    : fileInfo.status === 'error'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(164, 119, 100, 0.1)'
                }}
              >
                <div className="flex-shrink-0">
                  {fileInfo.status === 'completed' && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {fileInfo.status === 'error' && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {fileInfo.status === 'processing' && (
                    <div className="animate-spin w-6 h-6 border-2 border-mocha-mousse/30 border-t-mocha-mousse rounded-full"></div>
                  )}
                  {fileInfo.status === 'pending' && (
                    <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{color: '#36454F'}}>
                    {fileInfo.name}
                  </p>
                  <p className="text-xs opacity-70" style={{color: '#36454F'}}>
                    {fileInfo.format}
                    {fileInfo.dimensions && 
                      ` • ${fileInfo.dimensions.width}×${fileInfo.dimensions.height}`
                    }
                  </p>
                  {fileInfo.error && (
                    <p className="text-xs text-red-600 mt-1">{fileInfo.error}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xs font-medium" style={{color: '#36454F'}}>
                    {fileInfo.progress}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {completedCount > 0 && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-white/20">
              <button
                onClick={downloadBatch}
                className="flex-1 glass-button px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 pulse-glow"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Batch ZIP ({completedCount} files)
                </div>
              </button>
              
              <button
                onClick={clearBatch}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 glass-card"
                style={{color: '#36454F', opacity: 0.8}}
              >
                Clear Batch
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}