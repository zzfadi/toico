'use client';

import { useState } from 'react';
import FileUploader from './components/FileUploader';
import Preview from './components/Preview';

export default function Home() {
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [icoDataUrl, setIcoDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F7F5F0'}}>
      {/* Header */}
      <header className="py-6 md:py-8 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-2" style={{color: '#36454F'}}>
          SVG to ICO Converter
        </h1>
        <p className="text-base md:text-lg max-w-2xl mx-auto" style={{color: '#36454F', opacity: 0.8}}>
          Convert your SVG files to ICO format instantly in your browser
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Left Column - File Uploader */}
          <div className="space-y-6">
            <FileUploader
              onFileSelect={(file, dataUrl) => {
                setSvgFile(file);
                setSvgDataUrl(dataUrl);
                setError(null);
                setIcoDataUrl(null);
              }}
              onError={(errorMessage) => {
                setError(errorMessage);
                setSvgFile(null);
                setSvgDataUrl(null);
                setIcoDataUrl(null);
              }}
              error={error}
            />
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Preview
              svgDataUrl={svgDataUrl}
              onConversionComplete={(icoUrl) => setIcoDataUrl(icoUrl)}
              icoDataUrl={icoDataUrl}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 px-4 text-center border-t border-charcoal-gray/10">
        <p className="text-sm text-charcoal-gray/70 mb-2">
          <span className="text-classic-blue font-semibold">Secure & Private:</span> All conversions happen in your browser.
        </p>
        <p className="text-sm text-charcoal-gray/60 font-serif italic">
          A tool by Defined by Jenna
        </p>
      </footer>
    </div>
  );
}