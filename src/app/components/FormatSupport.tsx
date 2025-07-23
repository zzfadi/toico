'use client';

import { useState } from 'react';
import { SUPPORTED_FORMATS } from '../utils/imageFormats';

export default function FormatSupport() {
  const [showInfo, setShowInfo] = useState(false);

  if (!showInfo) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowInfo(true)}
          className="glass-card px-4 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:scale-110 hover:glass-card pulse-glow"
          style={{color: '#36454F'}}
          title="Show supported formats"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Formats
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="glass-card rounded-2xl p-6 max-w-sm shadow-2xl" style={{
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mocha-mousse to-golden-terra flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-bold text-glow" style={{color: '#36454F'}}>
              Supported Formats
            </h3>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="w-8 h-8 rounded-full glass-card flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{color: '#36454F'}}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      
        <div className="space-y-3">
          {Object.entries(SUPPORTED_FORMATS).map(([key, format]) => (
            <div key={key} className="glass-card rounded-xl p-3 transition-all duration-200 hover:scale-[1.02]">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{color: '#36454F'}}>{format.name}</span>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"></div>
                  </div>
                  <span className="text-xs opacity-70" style={{color: '#36454F'}}>
                    {format.extensions.join(', ')}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" style={{color: '#B8956A'}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-serif font-bold" style={{color: '#36454F'}}>
              Pro Tips
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-medium" style={{color: '#36454F', opacity: 0.9}}>
              <span className="inline-block w-2 h-2 rounded-full bg-mocha-mousse mr-2"></span>
              <strong>PNG/WebP:</strong> Perfect for logos with transparency
            </div>
            <div className="text-xs font-medium" style={{color: '#36454F', opacity: 0.9}}>
              <span className="inline-block w-2 h-2 rounded-full bg-golden-terra mr-2"></span>
              <strong>SVG:</strong> Vector graphics scale perfectly at any size
            </div>
            <div className="text-xs font-medium" style={{color: '#36454F', opacity: 0.9}}>
              <span className="inline-block w-2 h-2 rounded-full bg-classic-blue mr-2"></span>
              <strong>JPEG:</strong> Great for photos (white background added)
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="glass-card rounded-lg p-3">
              <p className="text-xs font-semibold mb-1" style={{color: '#A47764'}}>
                🎯 Best Quality Tip
              </p>
              <p className="text-xs" style={{color: '#36454F', opacity: 0.8}}>
                Use images 256×256px or larger for crisp, professional icons
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
