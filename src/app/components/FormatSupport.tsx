'use client';

import { useState } from 'react';
import { SUPPORTED_FORMATS } from '../utils/imageFormats';

export default function FormatSupport() {
  const [showInfo, setShowInfo] = useState(false);

  if (!showInfo) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowInfo(true)}
          className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg border text-gray-600 transition-colors"
          title="Show supported formats"
        >
          Formats
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Supported Formats</h3>
        <button
          onClick={() => setShowInfo(false)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        {Object.entries(SUPPORTED_FORMATS).map(([key, format]) => (
          <div key={key} className="flex justify-between items-center py-1">
            <div>
              <span className="font-medium text-gray-800">{format.name}</span>
              <span className="text-gray-500 ml-1">({format.extensions.join(', ')})</span>
            </div>
            <span className="text-green-600 text-sm">✓</span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">
          Quick Tips:
        </p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>PNG/WebP:</strong> Best for logos with transparency</li>
          <li>• <strong>JPEG:</strong> Good for photos (no transparency)</li>
          <li>• <strong>SVG:</strong> Vector graphics, scales perfectly</li>
          <li>• <strong>GIF:</strong> First frame used for conversion</li>
          <li>• <strong>BMP:</strong> Simple bitmap format</li>
        </ul>
        
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong>Recommended:</strong> Use 256×256 or larger images for best quality
          </p>
        </div>
      </div>
    </div>
  );
}
