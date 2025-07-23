'use client';

import { useCallback, useState } from 'react';
import { validateImageFile, getSupportedMimeTypes, getSupportedExtensions, getFormatSpecificMessage } from '../utils/imageFormats';
import { getImageDimensions } from '../utils/canvasHelpers';

interface FileUploaderProps {
  onFileSelect: (file: File | null, dataUrl: string, metadata?: { format: string; dimensions?: { width: number; height: number } }) => void;
  onError: (error: string) => void;
  error: string | null;
}

export default function FileUploader({ onFileSelect, onError, error }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; format: string; dimensions?: { width: number; height: number } } | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileInfo(null);
    
    try {
      // Validate the file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        onError(validation.error || 'Invalid file');
        setIsProcessing(false);
        return;
      }

      const format = validation.format!;
      
      // Get image dimensions for raster images
      let dimensions: { width: number; height: number } | undefined;
      if (format.formatKey !== 'svg') {
        try {
          dimensions = await getImageDimensions(file);
          
          // Check minimum resolution for better quality
          if (dimensions && (dimensions.width < 64 || dimensions.height < 64)) {
            const formatSpecificMsg = getFormatSpecificMessage(format.formatKey);
            const warning = `Image resolution is ${dimensions.width}x${dimensions.height}. For best results, use images of at least 256x256 pixels.`;
            onError(formatSpecificMsg ? `${warning} ${formatSpecificMsg}` : warning);
            setIsProcessing(false);
            return;
          }
        } catch (dimensionError) {
          console.warn('Could not detect image dimensions:', dimensionError);
        }
      }

      // Set file info for display
      setFileInfo({
        name: file.name,
        format: format.format.name,
        dimensions
      });

      // Show format-specific message if available
      const formatMessage = getFormatSpecificMessage(format.formatKey);
      if (formatMessage) {
        // This is informational, not an error
        console.log('Format info:', formatMessage);
      }

      // Read file for preview/processing
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onFileSelect(file, result, {
          format: format.format.name,
          dimensions
        });
        setIsProcessing(false);
      };
      reader.onerror = () => {
        onError('Error reading file. Please try again.');
        setIsProcessing(false);
      };
      
      if (format.formatKey === 'svg') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File processing error:', err);
      onError('Error processing file. Please try again.');
      setIsProcessing(false);
    }
  }, [onFileSelect, onError]);

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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClear = () => {
    onFileSelect(null, '', undefined);
    onError('');
    setFileInfo(null);
  };

  const supportedExtensions = getSupportedExtensions().join(',');
  const supportedMimeTypes = getSupportedMimeTypes().join(',');

  return (
    <div className="space-y-4">
      <div
        className="relative border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-all duration-200"
        style={{
          borderColor: isDragOver ? '#B8956A' : '#A47764',
          backgroundColor: isDragOver ? 'rgba(247, 231, 206, 0.2)' : 'rgba(247, 231, 206, 0.1)',
          opacity: isProcessing ? 0.5 : 1,
          pointerEvents: isProcessing ? 'none' : 'auto'
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={`${supportedMimeTypes},${supportedExtensions}`}
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isProcessing}
          aria-label="Upload image file"
          aria-describedby="file-upload-help"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(164, 119, 100, 0.2)'}}>
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="#A47764"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg md:text-xl font-semibold mb-2" style={{color: '#36454F'}}>
              {isProcessing ? 'Processing...' : 'Drag & Drop your image here'}
            </p>
            <p className="text-sm md:text-base mb-4" style={{color: '#36454F', opacity: 0.7}}>
              or click to browse your files
            </p>
            
            {fileInfo && (
              <div className="mb-4 p-3 rounded-lg" style={{backgroundColor: 'rgba(164, 119, 100, 0.1)'}}>
                <p className="text-sm font-medium" style={{color: '#36454F'}}>
                  {fileInfo.format} • {fileInfo.name}
                </p>
                {fileInfo.dimensions && (
                  <p className="text-xs" style={{color: '#36454F', opacity: 0.7}}>
                    {fileInfo.dimensions.width} × {fileInfo.dimensions.height} pixels
                  </p>
                )}
              </div>
            )}
            
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#A47764',
                color: '#F7F5F0'
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Select File'}
            </button>
          </div>
          
          <p id="file-upload-help" className="text-sm" style={{color: '#36454F', opacity: 0.6}}>
            Supported formats: PNG, JPEG, WebP, GIF, BMP, SVG • Max size: 50MB (100MB for SVG)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!error && (
        <button
          onClick={handleClear}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
          style={{color: '#36454F', opacity: 0.7}}
        >
          Clear Selection
        </button>
      )}
    </div>
  );
}