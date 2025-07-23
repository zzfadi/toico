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
        <div className="text-center py-16 bg-champagne-gold/10 rounded-lg border-2 border-dashed border-mocha-mousse/30">
          <div className="mx-auto w-16 h-16 bg-mocha-mousse/10 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-mocha-mousse/60"
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
          <h3 className="text-lg font-semibold text-charcoal-gray mb-2">Preview</h3>
          <p className="text-charcoal-gray/70">
            Your icon previews will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-mocha-mousse/20 overflow-hidden">
        <div className="p-6 bg-champagne-gold/20 border-b border-mocha-mousse/20">
          <h3 className="text-lg font-semibold text-charcoal-gray">Preview</h3>
          {imageMetadata && (
            <p className="text-sm text-charcoal-gray/70 mt-1">
              {imageMetadata.format}
              {imageMetadata.dimensions && 
                ` • ${imageMetadata.dimensions.width} × ${imageMetadata.dimensions.height} pixels`
              }
            </p>
          )}
          {isConverting && (
            <p data-testid="loading-previews" className="text-sm text-charcoal-gray/70 mt-1">Converting...</p>
          )}
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div data-testid="preview-container" className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {PREVIEW_SIZES.map((size) => (
                <div
                  key={size}
                  data-testid={`preview-${size}`}
                  className={`text-center p-3 md:p-4 rounded-lg border transition-all ${
                    selectedSizes.has(size)
                      ? 'bg-mocha-mousse/10 border-mocha-mousse/40'
                      : 'bg-champagne-gold/10 border-mocha-mousse/10 disabled inactive unchecked'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
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
                      className="w-4 h-4 text-mocha-mousse bg-soft-cream border-mocha-mousse/30 rounded focus:ring-mocha-mousse focus:ring-2"
                    />
                    <label htmlFor={`size-${size}`} className="ml-2 text-sm font-medium text-charcoal-gray cursor-pointer">
                      {size} × {size}
                    </label>
                  </div>
                  <div className="flex items-center justify-center mb-2 h-12">
                    {previewImages[size] ? (
                      <img
                        data-testid="preview-image"
                        src={previewImages[size]}
                        alt={`${size}x${size} preview`}
                        className="max-w-full max-h-full"
                        style={{
                          width: Math.min(size, 40),
                          height: Math.min(size, 40),
                          imageRendering: size <= 32 ? 'pixelated' : 'auto'
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-mocha-mousse/20 rounded animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {icoDataUrl && !error && (
        <div data-testid="conversion-success">
          <button
            data-testid="download-button"
            onClick={handleDownload}
            disabled={isConverting}
            className="
              w-full px-6 py-4 rounded-lg font-semibold text-lg
              bg-mocha-mousse text-soft-cream primary prominent success
              hover:bg-golden-terra focus:bg-golden-terra
              focus:outline-none focus:ring-2 focus:ring-golden-terra focus:ring-offset-2 focus:ring-offset-soft-cream
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isConverting ? 'Converting...' : `Download .ICO (${selectedSizes.size} ${selectedSizes.size === 1 ? 'size' : 'sizes'})`}
          </button>
        </div>
      )}
    </div>
  );
}