'use client';

import { useState, useEffect } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function SegmentedControl({ 
  options, 
  value, 
  onChange, 
  className = '',
  disabled = false 
}: SegmentedControlProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [animationStyle, setAnimationStyle] = useState<React.CSSProperties>({});

  // Update animation when value changes
  useEffect(() => {
    const index = options.findIndex(option => option.value === value);
    if (index !== -1 && index !== selectedIndex) {
      setSelectedIndex(index);
      
      // Calculate animation position
      const width = 100 / options.length;
      const translateX = index * 100;
      
      setAnimationStyle({
        width: `${width}%`,
        transform: `translateX(${translateX}%)`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      });
    }
  }, [value, options, selectedIndex]);

  // Initialize animation on mount
  useEffect(() => {
    const index = options.findIndex(option => option.value === value);
    if (index !== -1) {
      setSelectedIndex(index);
      const width = 100 / options.length;
      const translateX = index * 100;
      
      setAnimationStyle({
        width: `${width}%`,
        transform: `translateX(${translateX}%)`,
        transition: 'none' // No animation on initial render
      });
      
      // Enable transitions after mount
      setTimeout(() => {
        setAnimationStyle(prev => ({
          ...prev,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }));
      }, 100);
    }
  }, [options, value]);

  return (
    <div className={`relative ${className}`}>
      {/* Glassmorphism container */}
      <div 
        className="relative glass-card rounded-full p-1 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(164, 119, 100, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        }}
      >
        {/* Animated selection indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-full pointer-events-none"
          style={{
            ...animationStyle,
            background: 'linear-gradient(135deg, #A47764, #B8956A)',
            boxShadow: '0 2px 8px rgba(164, 119, 100, 0.3), 0 1px 2px rgba(164, 119, 100, 0.4)',
            zIndex: 1
          }}
        />
        
        {/* Option buttons */}
        <div className="relative flex z-10">
          {options.map((option) => {
            const isSelected = option.value === value;
            
            return (
              <button
                key={option.value}
                onClick={() => !disabled && onChange(option.value)}
                disabled={disabled}
                className={`
                  flex-1 px-4 py-3 rounded-full transition-all duration-300 
                  font-semibold text-sm relative overflow-hidden
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:scale-105 active:scale-95
                  ${isSelected ? 'text-white' : 'hover:bg-white/10'}
                `}
                style={{
                  color: isSelected ? '#FFFFFF' : '#36454F',
                  textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  zIndex: 2
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  {option.icon && (
                    <span 
                      className="text-lg leading-none"
                      style={{
                        filter: isSelected ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'none'
                      }}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span className="font-serif font-bold">
                    {option.label}
                  </span>
                </div>
                
                {/* Hover effect overlay */}
                <div 
                  className={`
                    absolute inset-0 rounded-full transition-opacity duration-200
                    ${isSelected ? 'opacity-0' : 'opacity-0 hover:opacity-100'}
                  `}
                  style={{
                    background: 'linear-gradient(135deg, rgba(164, 119, 100, 0.1), rgba(184, 149, 106, 0.05))'
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Floating description tooltip */}
      {options.find(opt => opt.value === value)?.description && (
        <div 
          className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-20
                     px-3 py-2 rounded-lg text-xs font-medium text-center
                     whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200
                     pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(164, 119, 100, 0.95), rgba(184, 149, 106, 0.9))',
            color: '#FFFFFF',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(164, 119, 100, 0.3)'
          }}
        >
          {options.find(opt => opt.value === value)?.description}
          
          {/* Tooltip arrow */}
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '4px solid #A47764'
            }}
          />
        </div>
      )}
    </div>
  );
}