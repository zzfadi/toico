'use client';

import { useState } from 'react';

export default function DebugConverter() {
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState<string | null>(null);

  const testSvgConversion = async () => {
    setStatus('Starting conversion...');
    setError(null);

    try {
      // Create a simple test SVG
      const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#A47764" />
      </svg>`;

      setStatus('Creating SVG blob...');
      const svgBlob = new Blob([testSvg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      setStatus('Creating canvas...');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      canvas.width = 64;
      canvas.height = 64;

      setStatus('Loading image...');
      const img = new Image();
      
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          setStatus('Drawing image...');
          
          try {
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(img, 0, 0, 64, 64);
            setStatus('Image drawn successfully');
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Image load error'));
        };
      });

      img.src = svgUrl;
      await imageLoadPromise;

      setStatus('Converting to PNG...');
      const dataUrl = canvas.toDataURL('image/png');
      
      setStatus('Creating download blob...');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      setStatus('Success! Creating download link...');
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'test-icon.png';
      link.click();

      URL.revokeObjectURL(svgUrl);
      URL.revokeObjectURL(downloadUrl);
      
      setStatus('Completed successfully!');

    } catch (err) {
      console.error('Debug conversion error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('Failed');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-300 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Debug SVG Conversion</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Status:</p>
          <p className="font-medium">{status}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={testSvgConversion}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={status.includes('...')}
        >
          Test SVG Conversion
        </button>
      </div>
    </div>
  );
}