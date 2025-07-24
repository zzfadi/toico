'use client';

import { useState } from 'react';
import FileUploader from './components/FileUploader';
import BatchFileUploader, { BatchFileInfo } from './components/BatchFileUploader';
import Preview, { OutputFormat } from './components/Preview';
import FormatSupport from './components/FormatSupport';
import SegmentedControl from './components/SegmentedControl';
import ExportPresets from './components/ExportPresets';
import { ExportPreset } from './utils/exportPresets';
import { exportPresetFromFile, PresetExportProgress } from './utils/presetExporter';

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ format: string; dimensions?: { width: number; height: number } } | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [currentFormat, setCurrentFormat] = useState<OutputFormat>('ico');
  const [error, setError] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'single' | 'batch' | 'presets'>('single');
// Removed unused state setter for batch results
  const [selectedSizes] = useState<Set<number>>(new Set([256, 64, 32, 16]));
  const [svgSelectedSizes] = useState<Set<number>>(new Set([128, 64, 32]));
  
  // Preset export states
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | undefined>();
  const [isExportingPreset, setIsExportingPreset] = useState(false);
  const [presetProgress, setPresetProgress] = useState<PresetExportProgress | null>(null);
  const [presetExportResult, setPresetExportResult] = useState<{
    success: boolean;
    downloadUrl?: string;
    filename: string;
    filesGenerated: number;
    error?: string;
  } | null>(null);

  return (
    <div className="min-h-screen relative">
      {/* Premium Hero Section */}
      <section className="relative py-12 md:py-20 px-4 text-center overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-champagne-gold/20 to-transparent blur-xl floating-animation" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-gradient-to-br from-mocha-mousse/15 to-transparent blur-lg floating-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full bg-gradient-to-br from-golden-terra/10 to-transparent blur-lg floating-animation" style={{animationDelay: '4s'}}></div>
        
        {/* Main hero content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Brand badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 mb-8 glass-card rounded-full">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-classic-blue to-golden-terra pulse-glow"></div>
            <span className="text-sm font-medium" style={{color: '#36454F'}}>
              Free Tool by <span className="font-serif font-bold text-glow" style={{color: '#A47764'}}>Defined By Jenna</span>
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold mb-6 text-glow" style={{color: '#36454F'}}>
            Premium Image to
            <br />
            <span className="bg-gradient-to-r from-mocha-mousse via-golden-terra to-mocha-mousse bg-clip-text text-transparent">
              ICO & SVG Converter
            </span>
          </h1>
          
          {/* Processing Mode Toggle */}
          <div className="mb-8">
            <SegmentedControl
              options={[
                {
                  value: 'single',
                  label: 'Single File',
                  icon: '📄',
                  description: 'Convert one image at a time with detailed preview'
                },
                {
                  value: 'batch',
                  label: 'Batch Processing',
                  icon: '🔥',
                  description: 'Convert multiple images simultaneously with ZIP download'
                },
                {
                  value: 'presets',
                  label: 'Export Presets',
                  icon: '🎨',
                  description: 'Professional export packages for iOS, Android, and Web'
                }
              ]}
              value={processingMode}
              onChange={(mode) => setProcessingMode(mode as 'single' | 'batch' | 'presets')}
              className="max-w-2xl mx-auto"
            />
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed" style={{color: '#36454F', opacity: 0.85}}>
            Transform your images into professional ICO favicons or scalable SVG graphics with our 
            <span className="font-semibold text-classic-blue"> privacy-first converter</span>. 
            All processing happens locally on your device - your images never leave your browser.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
              <svg className="w-5 h-5" style={{color: '#0056B3'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium" style={{color: '#36454F'}}>100% Private</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
              <svg className="w-5 h-5" style={{color: '#A47764'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium" style={{color: '#36454F'}}>ICO & SVG</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
              <svg className="w-5 h-5" style={{color: '#B8956A'}} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium" style={{color: '#36454F'}}>Instant Processing</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
              <svg className="w-5 h-5" style={{color: '#F7E7CE'}} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium" style={{color: '#36454F'}}>Free Forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-7xl mx-auto">
          {processingMode === 'single' ? (
            <>
              {/* Left Column - Single File Uploader */}
              <div className="space-y-8">
                <div className="glass-card rounded-3xl p-8 md:p-10">
                  <FileUploader
                    onFileSelect={(file, dataUrl, metadata) => {
                      setImageFile(file);
                      setImageDataUrl(dataUrl);
                      setImageMetadata(metadata || null);
                      setError(null);
                      setConvertedUrl(null);
                    }}
                    onError={(errorMessage) => {
                      setError(errorMessage);
                      setImageFile(null);
                      setImageDataUrl(null);
                      setImageMetadata(null);
                      setConvertedUrl(null);
                    }}
                    error={error}
                  />
                </div>
              </div>

              {/* Right Column - Single File Preview */}
              <div className="space-y-8">
                <div className="glass-card rounded-3xl p-8 md:p-10">
                  <Preview
                    imageFile={imageFile}
                    imageDataUrl={imageDataUrl}
                    imageMetadata={imageMetadata}
                    onConversionComplete={(url: string, format: OutputFormat) => {
                      setConvertedUrl(url);
                      setCurrentFormat(format);
                    }}
                    convertedUrl={convertedUrl}
                    outputFormat={currentFormat}
                  />
                </div>
              </div>
            </>
          ) : processingMode === 'batch' ? (
            <>
              {/* Full Width - Batch Processing */}
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card rounded-3xl p-8 md:p-10">
                  <BatchFileUploader
                    onBatchComplete={(results) => {
                      setBatchResults(results);
                      console.log('Batch processing completed:', results.length, 'files');
                    }}
                    outputFormat={currentFormat}
                    selectedSizes={Array.from(selectedSizes)}
                    svgSelectedSizes={Array.from(svgSelectedSizes)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Full Width - Export Presets */}
              <div className="lg:col-span-2 space-y-8">
                {/* Preset Selection */}
                <div className="glass-card rounded-3xl p-8 md:p-10">
                  <ExportPresets
                    onPresetSelect={setSelectedPreset}
                    selectedPreset={selectedPreset}
                  />
                </div>

                {/* File Upload for Preset Export */}
                {selectedPreset && (
                  <div className="glass-card rounded-3xl p-8 md:p-10">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
                        🚀 Upload Image for {selectedPreset.name}
                      </h3>
                      <p className="text-sm opacity-75" style={{color: '#36454F'}}>
                        Upload your image to generate the complete {selectedPreset.name.toLowerCase()} package
                      </p>
                    </div>

                    <FileUploader
                      onFileSelect={async (file, dataUrl, metadata) => {
                        setImageFile(file);
                        setImageDataUrl(dataUrl);
                        setImageMetadata(metadata || null);
                        setError(null);
                        setPresetExportResult(null);

                        // Auto-start preset export when file is selected
                        if (selectedPreset && file) {
                          setIsExportingPreset(true);
                          try {
                            const result = await Promise.race([
                              exportPresetFromFile(
                                file,
                                selectedPreset,
                                (progress) => setPresetProgress(progress)
                              ),
                              new Promise<never>((_, reject) => 
                                setTimeout(() => reject(new Error('Preset export timeout after 60 seconds')), 60000)
                              )
                            ]);
                            setPresetExportResult(result);
                            
                            if (result.success && result.downloadUrl) {
                              // Auto-download the preset package
                              const link = document.createElement('a');
                              link.href = result.downloadUrl;
                              link.download = result.filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              // Cleanup
                              setTimeout(() => {
                                if (result.downloadUrl) {
                                  URL.revokeObjectURL(result.downloadUrl);
                                }
                              }, 2000);
                            }
                          } catch (error) {
                            console.error('Preset export failed:', error);
                            setPresetExportResult({
                              success: false,
                              filename: '',
                              filesGenerated: 0,
                              error: error instanceof Error ? error.message : 'Export failed'
                            });
                          } finally {
                            setIsExportingPreset(false);
                            setPresetProgress(null);
                          }
                        }
                      }}
                      onError={(errorMessage) => {
                        setError(errorMessage);
                        setImageFile(null);
                        setImageDataUrl(null);
                        setImageMetadata(null);
                        setPresetExportResult(null);
                      }}
                      error={error}
                    />

                    {/* Export Progress */}
                    {isExportingPreset && presetProgress && (
                      <div className="mt-6 glass-card rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-serif font-bold text-glow" style={{color: '#36454F'}}>
                            Exporting {selectedPreset.name}...
                          </h4>
                          <span className="text-sm font-medium" style={{color: '#36454F'}}>
                            {presetProgress.overallProgress}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden mb-3">
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-classic-blue to-golden-terra"
                            style={{ width: `${presetProgress.overallProgress}%` }}
                          />
                        </div>
                        
                        <p className="text-sm opacity-80" style={{color: '#36454F'}}>
                          {presetProgress.currentFile}
                        </p>
                        
                        {presetProgress.status === 'processing' && (
                          <p className="text-xs opacity-60 mt-1" style={{color: '#36454F'}}>
                            Size {presetProgress.currentSize} of {presetProgress.totalSizes} sizes
                          </p>
                        )}
                      </div>
                    )}

                    {/* Export Results */}
                    {presetExportResult && (
                      <div className={`mt-6 glass-card rounded-2xl p-6 ${
                        presetExportResult.success 
                          ? 'border-2 border-green-500/30' 
                          : 'border-2 border-red-500/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            presetExportResult.success ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {presetExportResult.success ? (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-serif font-bold text-glow" style={{color: '#36454F'}}>
                              {presetExportResult.success ? 'Export Complete!' : 'Export Failed'}
                            </h4>
                            <p className="text-sm opacity-75" style={{color: '#36454F'}}>
                              {presetExportResult.success 
                                ? `Generated ${presetExportResult.filesGenerated} professional icons`
                                : presetExportResult.error || 'Unknown error occurred'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {presetExportResult.success && (
                          <div className="space-y-2 text-sm opacity-80" style={{color: '#36454F'}}>
                            <p>📦 Package: {presetExportResult.filename}</p>
                            <p>🎯 Platform: {selectedPreset.category}</p>
                            <p>⚡ Download started automatically</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="relative mt-20 py-12 px-4">
        <div className="absolute inset-0 premium-gradient opacity-50"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mocha-mousse to-golden-terra flex items-center justify-center">
                  <span className="text-white font-serif font-bold text-lg">DJ</span>
                </div>
                <div className="text-left">
                  <p className="font-serif font-bold text-lg text-glow" style={{color: '#A47764'}}>
                    Defined By Jenna
                  </p>
                  <p className="text-sm opacity-75" style={{color: '#36454F'}}>
                    Premium Makeup Artistry
                  </p>
                </div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-mocha-mousse/30 to-transparent hidden sm:block"></div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium mb-1" style={{color: '#36454F'}}>
                  <span style={{color: '#0056B3'}}>🔒</span> Privacy-First Technology
                </p>
                <p className="text-xs opacity-75" style={{color: '#36454F'}}>
                  Your images never leave your device
                </p>
              </div>
            </div>
            
            <div className="h-px bg-gradient-to-r from-transparent via-mocha-mousse/20 to-transparent mb-6"></div>
            
            <p className="text-sm leading-relaxed max-w-2xl mx-auto mb-4" style={{color: '#36454F', opacity: 0.8}}>
              This professional image converter is our gift to the creative community. 
              <span className="font-medium" style={{color: '#A47764'}}> Completely free, forever.</span>
            </p>
            
            <p className="text-xs font-serif italic" style={{color: '#36454F', opacity: 0.6}}>
              Crafted with precision for artists, designers, and creators worldwide
            </p>
          </div>
        </div>
      </footer>
      
      <FormatSupport />
    </div>
  );
}