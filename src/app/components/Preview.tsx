'use client';

import { useEffect, useState } from 'react';
import { convertSvgToIco, downloadIcoFile } from '../utils/svgToIco';

interface PreviewProps {
  svgDataUrl: string | null;
  onConversionComplete: (icoUrl: string) => void;
  icoDataUrl: string | null;
}

const PREVIEW_SIZES = [256, 64, 32, 16] as const;

export default function Preview({ svgDataUrl, onConversionComplete, icoDataUrl }: PreviewProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgDataUrl) {
      setPreviewImages({});
      setError(null);
      return;
    }

    const generatePreviews = async () => {
      setIsConverting(true);
      setError(null);
      
      try {
        const svgContent = atob(svgDataUrl.split(',')[1]);
        const previews: Record<number, string> = {};
        
        // Generate preview images for each size with timeout
        const previewPromises = PREVIEW_SIZES.map(async (size) => {
          try {
            const previewUrl = await Promise.race([
              renderSvgToDataUrl(svgContent, size),
              new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Preview timeout')), 5000)
              )
            ]);
            if (previewUrl) {
              previews[size] = previewUrl;
            }
          } catch (err) {
            console.warn(`Failed to generate ${size}x${size} preview:`, err);
          }
        });
        
        await Promise.allSettled(previewPromises);
        setPreviewImages(previews);
        
        // Convert to ICO with timeout
        try {
          const icoUrl = await Promise.race([
            convertSvgToIco(svgDataUrl),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Conversion timeout after 10 seconds')), 10000)
            )
          ]);
          
          onConversionComplete(icoUrl);
        } catch (conversionError) {
          console.error('ICO conversion failed:', conversionError);
          throw new Error('Failed to convert to ICO format');
        }
        
      } catch (err) {
        console.error('Conversion error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert SVG';
        setError(`Conversion failed: ${errorMessage}. Please try a different file.`);
        onConversionComplete(''); // Clear any previous conversion
      } finally {
        setIsConverting(false);
      }
    };

    generatePreviews();
  }, [svgDataUrl, onConversionComplete]);

  const renderSvgToDataUrl = (svgContent: string, size: number): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }
      
      canvas.width = size;
      canvas.height = size;
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Preview rendering timeout'));
      }, 3000); // 3 second timeout for previews
      
      const img = new Image();
      let url: string;
      
      try {
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        url = URL.createObjectURL(svgBlob);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
        return;
      }
      
      img.onload = () => {
        try {
          clearTimeout(timeout);
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          
          const dataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for preview'));
      };
      
      img.src = url;
    });
  };

  const handleDownload = () => {
    if (icoDataUrl) {
      downloadIcoFile(icoDataUrl);
    }
  };

  if (!svgDataUrl) {
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
          {isConverting && (
            <p className="text-sm text-charcoal-gray/70 mt-1">Converting...</p>
          )}
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3 md:gap-4">
              {PREVIEW_SIZES.map((size) => (
                <div
                  key={size}
                  className="text-center p-3 md:p-4 bg-champagne-gold/10 rounded-lg border border-mocha-mousse/10"
                >
                  <div className="flex items-center justify-center mb-3 h-16">
                    {previewImages[size] ? (
                      <img
                        src={previewImages[size]}
                        alt={`${size}x${size} preview`}
                        className="max-w-full max-h-full"
                        style={{
                          width: Math.min(size, 48),
                          height: Math.min(size, 48),
                          imageRendering: size <= 32 ? 'pixelated' : 'auto'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-mocha-mousse/20 rounded animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-charcoal-gray">
                    {size} × {size}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {icoDataUrl && !error && (
        <button
          onClick={handleDownload}
          disabled={isConverting}
          className="
            w-full px-6 py-4 rounded-lg font-semibold text-lg
            bg-mocha-mousse text-soft-cream
            hover:bg-golden-terra focus:bg-golden-terra
            focus:outline-none focus:ring-2 focus:ring-golden-terra focus:ring-offset-2 focus:ring-offset-soft-cream
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isConverting ? 'Converting...' : 'Download .ICO'}
        </button>
      )}
    </div>
  );
}