'use client';

import { useEffect, useState, useCallback } from 'react';
import { convertImageToIco, downloadIcoFile } from '../utils/imageToIco';
import { convertImageToSvg, generateSvgPreview, convertImageToIndividualSvgs, downloadIndividualSvgFiles, SVG_SIZES } from '../utils/imageToSvg';
import { loadImageToCanvas, loadSvgToCanvas, resizeImageWithHighQuality } from '../utils/canvasHelpers';
import { detectImageFormat } from '../utils/imageFormats';
import SegmentedControl from './SegmentedControl';

export type OutputFormat = 'ico' | 'svg';

interface PreviewProps {
  imageFile: File | null;
  imageDataUrl: string | null;
  imageMetadata: { format: string; dimensions?: { width: number; height: number } } | null;
  onConversionComplete: (url: string, format: OutputFormat) => void;
  convertedUrl: string | null;
  outputFormat?: OutputFormat;
}

const ICO_SIZES = [256, 128, 64, 48, 32, 16] as const;
const SVG_DISPLAY_SIZES = SVG_SIZES.slice().reverse(); // Use imported sizes, reversed for better display

export default function Preview({ 
  imageFile, 
  imageDataUrl, 
  imageMetadata, 
  onConversionComplete, 
  convertedUrl,
  outputFormat = 'ico'
}: PreviewProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [previewImages, setPreviewImages] = useState<Record<number, string>>({});
  const [svgPreview, setSvgPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasConverted, setHasConverted] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<OutputFormat>(outputFormat);
  const [selectedSizes, setSelectedSizes] = useState<Set<number>>(new Set([256, 64, 32, 16]));
  const [svgSelectedSizes, setSvgSelectedSizes] = useState<Set<number>>(new Set([128, 64, 32]));

  // Helper functions for format-specific size selection logic
  const getCurrentSelectedSizes = useCallback(() => {
    return currentFormat === 'ico' ? selectedSizes : svgSelectedSizes;
  }, [currentFormat, selectedSizes, svgSelectedSizes]);

  const getCurrentSizeSetter = useCallback(() => {
    return currentFormat === 'ico' ? setSelectedSizes : setSvgSelectedSizes;
  }, [currentFormat]);

  const isCurrentSizeSelected = useCallback((size: number) => {
    return getCurrentSelectedSizes().has(size);
  }, [getCurrentSelectedSizes]);

  const updateSelectedSizes = useCallback((updater: (sizes: Set<number>) => Set<number>) => {
    const currentSizes = getCurrentSelectedSizes();
    const setSizes = getCurrentSizeSetter();
    setSizes(updater(currentSizes));
  }, [getCurrentSelectedSizes, getCurrentSizeSetter]);

  useEffect(() => {
    if (!imageFile || !imageDataUrl) {
      setPreviewImages({});
      setError(null);
      setHasConverted(false);
      return;
    }
    
    // Don't re-convert if we already have a successful conversion for the current format
    if (hasConverted && convertedUrl) {
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
        const currentSizes = currentFormat === 'ico' ? ICO_SIZES : SVG_DISPLAY_SIZES;
        
        if (formatDetection.formatKey === 'svg') {
          // Handle SVG files
          const svgContent = atob(imageDataUrl.split(',')[1]);
          
          // Generate preview images for each size with timeout
          const previewPromises = currentSizes.map(async (size) => {
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
          const previewPromises = currentSizes.map(async (size) => {
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
        
        // Generate SVG preview if needed
        if (currentFormat === 'svg') {
          try {
            const svgPreviewContent = await generateSvgPreview(imageFile, 192);
            setSvgPreview(svgPreviewContent);
          } catch (svgPreviewError) {
            console.warn('SVG preview generation failed:', svgPreviewError);
          }
        }
        
        // Convert to selected format with timeout
        try {
          const activeSelectedSizes = getCurrentSelectedSizes();
          
          const conversionPromise = currentFormat === 'ico'
            ? convertImageToIco(imageFile, Array.from(activeSelectedSizes))
            : convertImageToSvg(imageFile, Array.from(activeSelectedSizes), {
                embedHighQuality: true,
                includeMetadata: true,
                optimizeForWeb: true
              });
          
          const convertedUrl = await Promise.race([
            conversionPromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error(`${currentFormat.toUpperCase()} conversion timeout after 15 seconds`)), 15000)
            )
          ]);
          
          onConversionComplete(convertedUrl, currentFormat);
          setHasConverted(true);
        } catch (conversionError) {
          console.error(`${currentFormat.toUpperCase()} conversion failed:`, conversionError);
          throw new Error(`Failed to convert to ${currentFormat.toUpperCase()} format`);
        }
        
      } catch (err) {
        console.error('Conversion error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert image';
        setError(`Conversion failed: ${errorMessage}. Please try a different file.`);
        onConversionComplete('', currentFormat); // Clear any previous conversion
        setHasConverted(false);
      } finally {
        setIsConverting(false);
      }
    };

    generatePreviews();
  }, [imageFile, imageDataUrl, selectedSizes, svgSelectedSizes, currentFormat, hasConverted, convertedUrl, onConversionComplete, getCurrentSelectedSizes]); // Re-run when sizes or format change

  // Handle format change
  const handleFormatChange = useCallback((newFormat: string) => {
    const format = newFormat as OutputFormat;
    setCurrentFormat(format);
    setHasConverted(false); // Reset conversion state
    setError(null);
    setSvgPreview(null);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!imageFile) return;

    if (currentFormat === 'ico') {
      if (convertedUrl) {
        downloadIcoFile(convertedUrl);
      }
    } else {
      // For SVG, generate individual files for each selected size
      try {
        const selectedSizesArray = Array.from(svgSelectedSizes);
        const svgFiles = await convertImageToIndividualSvgs(imageFile, selectedSizesArray, {
          embedHighQuality: true,
          includeMetadata: true,
          optimizeForWeb: true
        });
        
        downloadIndividualSvgFiles(svgFiles);
      } catch (error) {
        console.error('SVG download failed:', error);
        setError('Failed to download SVG files. Please try again.');
      }
    }
  }, [convertedUrl, currentFormat, imageFile, svgSelectedSizes]);

  if (!imageFile || !imageDataUrl) {
    return (
      <div className="space-y-6">
        {/* Preview Section Title with Format Toggle */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
            {currentFormat === 'ico' ? 'ICO Preview' : 'SVG Preview'}
          </h2>
          
          <SegmentedControl
            options={[
              {
                value: 'ico',
                label: 'ICO Format',
                icon: '🎯',
                description: 'Multi-size favicon format for browsers and applications'
              },
              {
                value: 'svg',
                label: 'SVG Format', 
                icon: '📐',
                description: 'Scalable vector graphics for modern web applications'
              }
            ]}
            value={currentFormat}
            onChange={handleFormatChange}
            className="max-w-md mx-auto"
          />
          
          <p className="text-sm opacity-75" style={{color: '#36454F'}}>
            {currentFormat === 'ico' 
              ? 'Your favicon icons will appear here'
              : 'Your scalable vector graphics will appear here'
            }
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
      {/* Preview Section Title with Format Toggle */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
          {currentFormat === 'ico' ? 'ICO Preview' : 'SVG Preview'}
        </h2>
        
        <SegmentedControl
          options={[
            {
              value: 'ico',
              label: 'ICO Format',
              icon: '🎯',
              description: 'Multi-size favicon format for browsers and applications'
            },
            {
              value: 'svg',
              label: 'SVG Format', 
              icon: '📐',
              description: 'Scalable vector graphics for modern web applications'
            }
          ]}
          value={currentFormat}
          onChange={handleFormatChange}
          className="max-w-md mx-auto"
        />
        
        <p className="text-sm opacity-75" style={{color: '#36454F'}}>
          {currentFormat === 'ico' 
            ? 'Select sizes and preview your favicon icons'
            : 'Select sizes and preview your scalable graphics'
          }
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
              {currentFormat === 'ico' ? 'ICO Conversion' : 'SVG Conversion'}
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
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-mocha-mousse/30 border-t-mocha-mousse rounded-full"></div>
              <p className="text-sm font-medium" style={{color: '#A47764'}}>
                Converting your image to {currentFormat.toUpperCase()} format...
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
            <div className="space-y-6">
              {/* SVG Preview Display */}
              {currentFormat === 'svg' && svgPreview && (
                <div className="glass-card rounded-xl p-6 text-center">
                  <h4 className="text-sm font-serif font-bold mb-4 text-glow" style={{color: '#36454F'}}>
                    SVG Preview (Interactive)
                  </h4>
                  <div 
                    className="flex items-center justify-center p-4 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      minHeight: '200px'
                    }}
                    dangerouslySetInnerHTML={{ __html: svgPreview }}
                  />
                  <p className="text-xs opacity-70 mt-2" style={{color: '#36454F'}}>
                    SVG graphics scale perfectly at any size
                  </p>
                </div>
              )}
              
              {/* Size Selection Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Standard sizes */}
                {(currentFormat === 'ico' ? ICO_SIZES : SVG_DISPLAY_SIZES).map((size) => (
                <div
                  key={size}
                  className={`text-center p-4 rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
                    isCurrentSizeSelected(size)
                      ? 'glass-card border-2 border-mocha-mousse/50 pulse-glow'
                      : 'premium-gradient border border-white/20 hover:glass-card'
                  }`}
                >
                  <div className="flex items-center justify-center mb-3">
                    <input
                      type="checkbox"
                      id={`size-${size}`}
                      checked={isCurrentSizeSelected(size)}
                      onChange={(e) => {
                        updateSelectedSizes((currentSizes) => {
                          const newSizes = new Set(currentSizes);
                          if (e.target.checked) {
                            newSizes.add(size);
                          } else if (newSizes.size > 1) { // Ensure at least one size is selected
                            newSizes.delete(size);
                          }
                          return newSizes;
                        });
                        setHasConverted(false); // Reset conversion state when sizes change
                      }}
                      className="w-5 h-5 rounded border-2 border-mocha-mousse/30 text-mocha-mousse focus:ring-2 focus:ring-golden-terra/50 transition-all duration-200"
                      style={{
                        backgroundColor: isCurrentSizeSelected(size) ? '#A47764' : 'transparent',
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewImages[size]}
                          alt={`${size}x${size} preview`}
                          className="max-w-full max-h-full rounded-lg shadow-lg"
                          style={{
                            width: Math.min(size, 48),
                            height: Math.min(size, 48),
                            imageRendering: size <= 32 ? 'pixelated' : 'auto',
                            filter: isCurrentSizeSelected(size) ? 'none' : 'grayscale(0.5) opacity(0.7)'
                          }}
                        />
                        {isCurrentSizeSelected(size) && (
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
                    {currentFormat === 'ico'
                      ? (size <= 32 ? 'Small Icon' : size <= 64 ? 'Medium Icon' : 'Large Icon')
                      : (size <= 48 ? 'UI Icon' : size <= 192 ? 'Web Icon' : 'Display Icon')
                    }
                  </p>
                </div>
                ))}
                
                {/* Custom sizes */}
                {Array.from(getCurrentSelectedSizes())
                  .filter(size => {
                    const standardSizes = currentFormat === 'ico' ? ICO_SIZES : SVG_DISPLAY_SIZES;
                    return !standardSizes.some(standardSize => standardSize === size);
                  })
                  .sort((a, b) => a - b)
                  .map((size) => (
                <div
                  key={`custom-${size}`}
                  className="text-center p-4 rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 glass-card border-2 border-golden-terra/50 pulse-glow relative"
                >
                  <div className="flex items-center justify-center mb-3">
                    <input
                      type="checkbox"
                      id={`custom-size-${size}`}
                      checked={true}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          updateSelectedSizes((currentSizes) => {
                            const newSizes = new Set(currentSizes);
                            if (newSizes.size > 1) { // Ensure at least one size is selected
                              newSizes.delete(size);
                              setHasConverted(false);
                              return newSizes;
                            }
                            return currentSizes;
                          });
                        }
                      }}
                      className="w-5 h-5 rounded border-2 border-golden-terra/30 text-golden-terra focus:ring-2 focus:ring-golden-terra/50 transition-all duration-200"
                      style={{
                        backgroundColor: '#B8956A',
                        accentColor: '#B8956A'
                      }}
                    />
                    <label htmlFor={`custom-size-${size}`} className="ml-3 text-sm font-semibold cursor-pointer" style={{color: '#36454F'}}>
                      {size} × {size}px
                    </label>
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gradient-to-r from-golden-terra to-mocha-mousse text-white">
                      Custom
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center mb-3 h-16">
                    {previewImages[size] ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewImages[size]}
                          alt={`${size}x${size} preview`}
                          className="max-w-full max-h-full rounded-lg shadow-lg"
                          style={{
                            width: Math.min(size, 48),
                            height: Math.min(size, 48),
                            imageRendering: size <= 32 ? 'pixelated' : 'auto'
                          }}
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-golden-terra to-mocha-mousse rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg animate-pulse" style={{
                        background: 'linear-gradient(135deg, rgba(184, 149, 106, 0.2), rgba(164, 119, 100, 0.1))'
                      }} />
                    )}
                  </div>
                  
                  <p className="text-xs font-medium opacity-70" style={{color: '#36454F'}}>
                    Custom Size
                  </p>
                </div>
                ))}
              </div>
              
              {/* Custom Size Input */}
              <div className="glass-card rounded-xl p-4 mt-6">
                <h4 className="text-sm font-serif font-bold mb-3 text-glow" style={{color: '#36454F'}}>
                  ✨ Add Custom Size
                </h4>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="2048"
                    placeholder="Enter size (1-2048px)"
                    className="flex-1 px-4 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-filter backdrop-blur-sm text-sm"
                    style={{color: '#36454F'}}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const customSize = parseInt(input.value);
                        if (customSize >= 1 && customSize <= 2048) {
                          updateSelectedSizes((currentSizes) => {
                            const newSizes = new Set(currentSizes);
                            newSizes.add(customSize);
                            setHasConverted(false);
                            input.value = '';
                            return newSizes;
                          });
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                      const customSize = parseInt(input.value);
                      if (customSize >= 1 && customSize <= 2048) {
                        updateSelectedSizes((currentSizes) => {
                          const newSizes = new Set(currentSizes);
                          newSizes.add(customSize);
                          setHasConverted(false);
                          input.value = '';
                          return newSizes;
                        });
                      }
                    }}
                    className="px-4 py-2 glass-button text-white text-sm rounded-lg hover:scale-105 transition-all duration-200"
                  >
                    Add Size
                  </button>
                </div>
                <p className="text-xs opacity-70 mt-2" style={{color: '#36454F'}}>
                  Enter a custom size between 1-2048 pixels and press Enter or click Add Size
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {convertedUrl && !error && (
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
              Your {currentFormat.toUpperCase()} {currentFormat === 'ico' ? 'file is' : 'files are'} ready with {getCurrentSelectedSizes().size} size{getCurrentSelectedSizes().size === 1 ? '' : 's'}: {Array.from(getCurrentSelectedSizes()).sort((a, b) => b - a).join(', ')}px
            </p>
            
            <button
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
                  Download {currentFormat.toUpperCase()} {currentFormat === 'ico' ? 'File' : 'Files'}
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}