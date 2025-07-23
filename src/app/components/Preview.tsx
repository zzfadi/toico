'use client';

import { useEffect, useState, useCallback } from 'react';
import { convertImageToIco, downloadIcoFile } from '../utils/imageToIco';
import { loadImageToCanvas, loadSvgToCanvas, resizeImageWithHighQuality } from '../utils/canvasHelpers';
import { detectImageFormat } from '../utils/imageFormats';

interface PreviewProps {
  imageFile: File | null;
  imageDataUrl: string | null;
  imageMetadata: { format: string; dimensions?: { width: number; height: number } } | null;
  onConversionComplete: (icoUrl: string) => void;
  icoDataUrl: string | null;
}

const PREVIEW_SIZES = [256, 128, 64, 48, 32, 16] as const;

export default function Preview({ imageFile, imageDataUrl, imageMetadata, onConversionComplete, icoDataUrl }: PreviewProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [hasConverted, setHasConverted] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Set<number>>(new Set([256, 64, 32, 16]));

  useEffect(() => {
    if (!imageFile || !imageDataUrl) {
      setPreviewImages({});
      setError(null);
      setHasConverted(false);
      return;
    }
    
    // Don't re-convert if we already have a successful conversion
    if (hasConverted && icoDataUrl) {
      return;
    }

    const generatePreviews = async () => {
      setIsConverting(true);
      setError(null);
      
      try {
        const formatDetection = detectImageFormat(imageFile);
        if (!formatDetection) {
          throw new Error('Unsupported image format');
        }

        const previews: Record<number, string> = {};
        
        if (formatDetection.formatKey === 'svg') {
          // Handle SVG files
          const svgContent = atob(imageDataUrl.split(',')[1]);
          
          // Generate preview images for each size with timeout
          const previewPromises = PREVIEW_SIZES.map(async (size) => {
            try {
              const canvas = await Promise.race([
                loadSvgToCanvas(svgContent, size),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Preview timeout')), 5000)
                )
              ]);
              const dataUrl = canvas.toDataURL('image/png');
              previews[size] = dataUrl;
            } catch (err) {
              console.warn(`Failed to generate ${size}x${size} preview:`, err);
            }
          });
          
          await Promise.allSettled(previewPromises);
        } else {
          // Handle raster images
          const sourceCanvas = await loadImageToCanvas(imageFile);
          
          // Generate preview images for each size
          const previewPromises = PREVIEW_SIZES.map(async (size) => {
            try {
              let canvas: HTMLCanvasElement;
              if (sourceCanvas.width === size && sourceCanvas.height === size) {
                canvas = sourceCanvas;
              } else {
                canvas = resizeImageWithHighQuality(sourceCanvas, size, size);
              }
              const dataUrl = canvas.toDataURL('image/png');
              previews[size] = dataUrl;
            } catch (err) {
              console.warn(`Failed to generate ${size}x${size} preview:`, err);
            }
          });
          
          await Promise.allSettled(previewPromises);
        }
        
        setPreviewImages(previews);
        
        // Convert to ICO with timeout using selected sizes
        try {
          const icoUrl = await Promise.race([
            convertImageToIco(imageFile, Array.from(selectedSizes)),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Conversion timeout after 15 seconds')), 15000)
            )
          ]);
          
          onConversionComplete(icoUrl);
          setHasConverted(true);
        } catch (conversionError) {
          console.error('ICO conversion failed:', conversionError);
          throw new Error('Failed to convert to ICO format');
        }
        
      } catch (err) {
        console.error('Conversion error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert image';
        setError(`Conversion failed: ${errorMessage}. Please try a different file.`);
        onConversionComplete(''); // Clear any previous conversion
        setHasConverted(false);
      } finally {
        setIsConverting(false);
      }
    };

    generatePreviews();
  }, [imageFile, imageDataUrl, selectedSizes, hasConverted, icoDataUrl, onConversionComplete]); // Re-run when sizes change

  const handleDownload = useCallback(() => {
    if (icoDataUrl) {
      downloadIcoFile(icoDataUrl);
    }
  }, [icoDataUrl]);

  if (!imageFile || !imageDataUrl) {
    return (
      <div className="space-y-6">
        {/* Preview Section Title */}
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
            ICO Preview
          </h2>
          <p className="text-sm opacity-75" style={{color: '#36454F'}}>
            Your converted icons will appear here
          </p>
        </div>

        <div className="text-center py-20 premium-gradient rounded-2xl border-2 border-dashed" style={{borderColor: 'rgba(164, 119, 100, 0.3)'}}>
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 glass-card floating-animation">
            <svg
              className="w-10 h-10"
              style={{color: '#A47764'}}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-serif font-bold mb-3 text-glow" style={{color: '#36454F'}}>
            Ready for Preview
          </h3>
          <p className="text-sm opacity-80" style={{color: '#36454F'}}>
            Upload an image to see your icon previews and download options
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Section Title */}
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
          ICO Preview
        </h2>
        <p className="text-sm opacity-75" style={{color: '#36454F'}}>
          Select sizes and preview your converted icons
        </p>
      </div>

      <div className="premium-gradient rounded-2xl overflow-hidden" style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="p-6 glass-card border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-classic-blue to-golden-terra pulse-glow"></div>
            <h3 className="text-lg font-serif font-bold text-glow" style={{color: '#36454F'}}>
              Conversion Preview
            </h3>
          </div>
          
          {imageMetadata && (
            <p className="text-sm font-medium mb-2" style={{color: '#36454F', opacity: 0.8}}>
              📄 {imageMetadata.format}
              {imageMetadata.dimensions && 
                ` • 📏 ${imageMetadata.dimensions.width} × ${imageMetadata.dimensions.height} pixels`
              }
            </p>
          )}
          
          {isConverting && (
            <div data-testid="loading-previews" className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-mocha-mousse/30 border-t-mocha-mousse rounded-full"></div>
              <p className="text-sm font-medium" style={{color: '#A47764'}}>
                Converting your image to ICO format...
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="text-center py-12 glass-card rounded-xl border border-red-300/50" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))'
            }}>
              <svg className="w-12 h-12 mx-auto mb-4" style={{color: '#DC2626'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium" style={{color: '#DC2626'}}>{error}</p>
            </div>
          ) : (
            <div data-testid="preview-container" className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PREVIEW_SIZES.map((size) => (
                <div
                  key={size}
                  className={`text-center p-4 rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
                    selectedSizes.has(size)
                      ? 'glass-card border-2 border-mocha-mousse/50 pulse-glow'
                      : 'premium-gradient border border-white/20 hover:glass-card'
                  }`}
                >
                  <div className="flex items-center justify-center mb-3">
                    <input
                      type="checkbox"
                      id={`size-${size}`}
                      data-testid={`size-checkbox-${size}`}
                      checked={selectedSizes.has(size)}
                      onChange={(e) => {
                        const newSizes = new Set(selectedSizes);
                        if (e.target.checked) {
                          newSizes.add(size);
                        } else if (newSizes.size > 1) { // Ensure at least one size is selected
                          newSizes.delete(size);
                        }
                        setSelectedSizes(newSizes);
                        setHasConverted(false); // Reset conversion state when sizes change
                      }}
                      className="w-5 h-5 rounded border-2 border-mocha-mousse/30 text-mocha-mousse focus:ring-2 focus:ring-golden-terra/50 transition-all duration-200"
                      style={{
                        backgroundColor: selectedSizes.has(size) ? '#A47764' : 'transparent',
                        accentColor: '#A47764'
                      }}
                    />
                    <label htmlFor={`size-${size}`} className="ml-3 text-sm font-semibold cursor-pointer" style={{color: '#36454F'}}>
                      {size} × {size}px
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-center mb-3 h-16">
                    {previewImages[size] ? (
                      <div className="relative">
                        <img
                          data-testid="preview-image"
                          src={previewImages[size]}
                          alt={`${size}x${size} preview`}
                          className="max-w-full max-h-full rounded-lg shadow-lg"
                          style={{
                            width: Math.min(size, 48),
                            height: Math.min(size, 48),
                            imageRendering: size <= 32 ? 'pixelated' : 'auto',
                            filter: selectedSizes.has(size) ? 'none' : 'grayscale(0.5) opacity(0.7)'
                          }}
                        />
                        {selectedSizes.has(size) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-classic-blue to-golden-terra rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg animate-pulse" style={{
                        background: 'linear-gradient(135deg, rgba(164, 119, 100, 0.2), rgba(184, 149, 106, 0.1))'
                      }} />
                    )}
                  </div>
                  
                  <p className="text-xs font-medium opacity-70" style={{color: '#36454F'}}>
                    {size <= 32 ? 'Small Icon' : size <= 64 ? 'Medium Icon' : 'Large Icon'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {icoDataUrl && !error && (
        <div className="space-y-4">
          <div className="text-center glass-card rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-serif font-bold text-glow" style={{color: '#36454F'}}>
                Conversion Complete!
              </h3>
            </div>
            <p className="text-sm opacity-80 mb-6" style={{color: '#36454F'}}>
              Your ICO file is ready with {selectedSizes.size} size{selectedSizes.size === 1 ? '' : 's'}: {Array.from(selectedSizes).sort((a, b) => b - a).join(', ')}px
            </p>
          <div data-testid="conversion-success">
            <button
              data-testid="download-button"
              onClick={handleDownload}
              disabled={isConverting}
              className="glass-button px-8 py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 pulse-glow"
            >
              {isConverting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                  Converting...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download ICO File
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}