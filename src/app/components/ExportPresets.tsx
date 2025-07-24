'use client';

import { useState } from 'react';
import { EXPORT_PRESETS, ExportPreset, getAllPresetSizes } from '../utils/exportPresets';

interface ExportPresetsProps {
  onPresetSelect: (preset: ExportPreset) => void;
  selectedPreset?: ExportPreset;
}

export default function ExportPresets({ onPresetSelect, selectedPreset }: ExportPresetsProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mobile' | 'web' | 'desktop'>('all');

  const filteredPresets = selectedCategory === 'all' 
    ? EXPORT_PRESETS 
    : EXPORT_PRESETS.filter(preset => preset.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All Presets', icon: '🚀' },
    { id: 'mobile', name: 'Mobile Apps', icon: '📱' },
    { id: 'web', name: 'Web & Favicons', icon: '🌐' },
    { id: 'desktop', name: 'Desktop Apps', icon: '🖥️' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-serif font-bold mb-2 text-glow" style={{color: '#36454F'}}>
          🎨 Professional Export Presets
        </h3>
        <p className="text-sm opacity-75" style={{color: '#36454F'}}>
          One-click export for platform-specific icon packages
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedCategory === category.id
                ? 'glass-button text-white pulse-glow scale-105'
                : 'glass-card hover:scale-105'
            }`}
            style={{
              color: selectedCategory === category.id ? '#FFFFFF' : '#36454F'
            }}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredPresets.map((preset) => {
          const allSizes = getAllPresetSizes(preset);
          const isSelected = selectedPreset?.id === preset.id;
          
          return (
            <div
              key={preset.id}
              className={`glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                isSelected ? 'pulse-glow ring-2 ring-golden-terra/50' : ''
              }`}
              onClick={() => onPresetSelect(preset)}
              style={{
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(184, 149, 106, 0.15), rgba(164, 119, 100, 0.1))' 
                  : undefined
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center glass-card">
                  <span className="text-2xl">{preset.icon}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h4 className="text-lg font-serif font-bold mb-1 text-glow" style={{color: '#36454F'}}>
                    {preset.name}
                  </h4>
                  <p className="text-sm mb-3 opacity-80" style={{color: '#36454F'}}>
                    {preset.description}
                  </p>
                  
                  {/* Size Preview */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {allSizes.slice(0, 8).map((size) => (
                      <span
                        key={size}
                        className="px-2 py-1 text-xs rounded-md glass-card"
                        style={{color: '#36454F', opacity: 0.8}}
                      >
                        {size}px
                      </span>
                    ))}
                    {allSizes.length > 8 && (
                      <span
                        className="px-2 py-1 text-xs rounded-md glass-card"
                        style={{color: '#A47764'}}
                      >
                        +{allSizes.length - 8} more
                      </span>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs font-medium opacity-70" style={{color: '#36454F'}}>
                    <span>📦 {allSizes.length} sizes</span>
                    <span>🎯 {preset.format.toUpperCase()}</span>
                    {preset.customFiles && (
                      <span>📁 {preset.customFiles.length} files</span>
                    )}
                  </div>
                </div>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-classic-blue to-golden-terra flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Preset Details */}
      {selectedPreset && (
        <div className="glass-card rounded-2xl p-6 border-2 border-golden-terra/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{selectedPreset.icon}</span>
            <div>
              <h4 className="text-lg font-serif font-bold text-glow" style={{color: '#36454F'}}>
                {selectedPreset.name} Selected
              </h4>
              <p className="text-sm opacity-75" style={{color: '#36454F'}}>
                Ready for professional export
              </p>
            </div>
          </div>
          
          {/* Detailed Size List */}
          <div className="mb-4">
            <h5 className="text-sm font-semibold mb-2" style={{color: '#36454F'}}>
              Complete Size Set ({getAllPresetSizes(selectedPreset).length} icons):
            </h5>
            <div className="flex flex-wrap gap-1">
              {getAllPresetSizes(selectedPreset).map((size) => (
                <span
                  key={size}
                  className="px-2 py-1 text-xs rounded-md glass-card font-medium"
                  style={{color: '#A47764'}}
                >
                  {size}×{size}
                </span>
              ))}
            </div>
          </div>
          
          {/* Platform-Specific Info */}
          {selectedPreset.customFiles && (
            <div className="pt-4 border-t border-white/20">
              <h5 className="text-sm font-semibold mb-2" style={{color: '#36454F'}}>
                Platform-Specific Features:
              </h5>
              <div className="text-xs space-y-1 opacity-80" style={{color: '#36454F'}}>
                {selectedPreset.id === 'ios-app-icons' && (
                  <>
                    <p>• iPhone & iPad optimized sizes</p>
                    <p>• App Store ready 1024px icon</p>
                    <p>• Retina display support (@1x, @2x, @3x)</p>
                  </>
                )}
                {selectedPreset.id === 'android-icons' && (
                  <>
                    <p>• Adaptive icon support (108dp)</p>
                    <p>• Legacy icon compatibility</p>
                    <p>• Google Play Store ready</p>
                  </>
                )}
                {selectedPreset.id === 'web-favicons' && (
                  <>
                    <p>• Multi-format support (ICO, PNG, SVG)</p>
                    <p>• Apple Touch Icons included</p>
                    <p>• Microsoft Tile icons</p>
                  </>
                )}
                {selectedPreset.id === 'desktop-icons' && (
                  <>
                    <p>• Windows ICO format</p>
                    <p>• macOS ICNS sources</p>
                    <p>• Linux icon standards</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}