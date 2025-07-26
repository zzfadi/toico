'use client';

import { useCallback, useState, useRef } from 'react';
import { validateImageFile, getSupportedMimeTypes, getSupportedExtensions, getFormatSpecificMessage, analyzeWebPFile, getWebPCompatibilityInfo } from '../utils/imageFormats';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Special handling for WebP files
      if (format.formatKey === 'webp') {
        try {
          const webpAnalysis = await analyzeWebPFile(file);
          const compatibilityInfo = getWebPCompatibilityInfo();
          
          if (webpAnalysis.recommendation) {
            console.log('WebP Analysis:', webpAnalysis.recommendation);
          }
          
          if (!compatibilityInfo.supported && compatibilityInfo.recommendation) {
            console.log('WebP Compatibility:', compatibilityInfo.recommendation);
          }
          
          // Log WebP-specific info for debugging
          console.log('WebP file analysis:', {
            isAnimated: webpAnalysis.isAnimated,
            hasTransparency: webpAnalysis.hasTransparency,
            estimatedQuality: webpAnalysis.estimatedQuality,
            browserSupported: compatibilityInfo.supported
          });
        } catch (webpError) {
          console.warn('WebP analysis failed:', webpError);
        }
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
    <div className="space-y-6">
      {/* Upload Section Title */}
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
          Upload Your Image
        </h2>
        <p className="text-sm opacity-75" style={{color: '#36454F'}}>
          Drag and drop or click to select your image file
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ${
          isDragOver ? 'glass-card scale-[1.02]' : 'premium-gradient'
        }`}
        style={{
          borderColor: isDragOver ? '#B8956A' : 'rgba(164, 119, 100, 0.3)',
          opacity: isProcessing ? 0.7 : 1,
          pointerEvents: isProcessing ? 'none' : 'auto',
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
          aria-label="Upload image file"
          aria-describedby="file-upload-help"
        />
        
        <div className="space-y-6">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isDragOver ? 'pulse-glow scale-110' : ''
          }`} style={{
            background: isDragOver 
              ? 'linear-gradient(135deg, rgba(184, 149, 106, 0.8), rgba(164, 119, 100, 0.9))' 
              : 'linear-gradient(135deg, rgba(164, 119, 100, 0.3), rgba(184, 149, 106, 0.2))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {isProcessing ? (
              <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full"></div>
            ) : (
              <svg
                className="w-10 h-10 transition-transform duration-300"
                fill="none"
                stroke={isDragOver ? '#F7F5F0' : '#A47764'}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>
          
          <div>
            <p className="text-xl md:text-2xl font-serif font-bold mb-3 text-glow" style={{color: '#36454F'}}>
              {isProcessing ? 'Processing Your Image...' : isDragOver ? 'Drop Your Image Here' : 'Upload Your Image'}
            </p>
            <p className="text-sm md:text-base mb-6" style={{color: '#36454F', opacity: 0.8}}>
              {isDragOver ? 'Release to upload' : 'Drag & drop or click to browse'}
            </p>
            
            {fileInfo && (
              <div className="mb-6 p-4 glass-card rounded-xl">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-classic-blue to-golden-terra"></div>
                  <p className="text-sm font-semibold" style={{color: '#36454F'}}>
                    {fileInfo.format} • {fileInfo.name}
                  </p>
                </div>
                {fileInfo.dimensions && (
                  <p className="text-xs font-medium" style={{color: '#36454F', opacity: 0.7}}>
                    Resolution: {fileInfo.dimensions.width} × {fileInfo.dimensions.height} pixels
                  </p>
                )}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass-button px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Browse Files'}
            </button>
          </div>
          
          <div className="pt-4 border-t border-white/20">
            <p id="file-upload-help" className="text-sm font-medium" style={{color: '#36454F', opacity: 0.7}}>
              <span className="block mb-1">✨ Supported formats: PNG, JPEG, WebP, GIF, BMP, SVG</span>
              <span className="block">📦 Max size: 50MB (100MB for SVG files)</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-xl p-4 border border-red-300/50" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))'
        }} role="alert">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{color: '#DC2626'}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium" style={{color: '#DC2626'}}>{error}</p>
          </div>
        </div>
      )}

      {!error && fileInfo && (
        <button
          onClick={handleClear}
          className="w-full px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] glass-card"
          style={{color: '#36454F', opacity: 0.8}}
        >
          🗑️ Clear Selection
        </button>
      )}
    </div>
  );
}