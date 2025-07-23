// Export Presets System - GOD MODE ACTIVATED!
// Professional export presets for iOS, Android, and Web platforms

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'mobile' | 'web' | 'desktop';
  sizes: number[];
  format: 'ico' | 'png' | 'svg';
  folderStructure: 'flat' | 'nested' | 'platform-specific';
  fileNaming: 'size-suffix' | 'platform-suffix' | 'descriptive';
  includeSizes?: boolean;
  customFiles?: Array<{
    size: number;
    filename: string;
    subfolder?: string;
  }>;
}

// 🍎 iOS App Icons - Complete Professional Set
export const IOS_APP_ICONS: ExportPreset = {
  id: 'ios-app-icons',
  name: 'iOS App Icons',
  description: 'Complete iOS app icon set for App Store submission',
  icon: '📱',
  category: 'mobile',
  format: 'png',
  sizes: [
    // iPhone App Icons
    20, 29, 40, 58, 60, 80, 87, 120, 180,
    // iPad App Icons  
    20, 29, 40, 58, 76, 80, 152, 167,
    // App Store & Marketing
    1024,
    // Additional Sizes for Completeness
    16, 32, 64, 128, 256, 512
  ],
  folderStructure: 'platform-specific',
  fileNaming: 'descriptive',
  customFiles: [
    { size: 20, filename: 'Icon-App-20x20@1x.png', subfolder: 'iPhone' },
    { size: 40, filename: 'Icon-App-20x20@2x.png', subfolder: 'iPhone' },
    { size: 60, filename: 'Icon-App-20x20@3x.png', subfolder: 'iPhone' },
    { size: 29, filename: 'Icon-App-29x29@1x.png', subfolder: 'iPhone' },
    { size: 58, filename: 'Icon-App-29x29@2x.png', subfolder: 'iPhone' },
    { size: 87, filename: 'Icon-App-29x29@3x.png', subfolder: 'iPhone' },
    { size: 40, filename: 'Icon-App-40x40@1x.png', subfolder: 'iPhone' },
    { size: 80, filename: 'Icon-App-40x40@2x.png', subfolder: 'iPhone' },
    { size: 120, filename: 'Icon-App-40x40@3x.png', subfolder: 'iPhone' },
    { size: 60, filename: 'Icon-App-60x60@1x.png', subfolder: 'iPhone' },
    { size: 120, filename: 'Icon-App-60x60@2x.png', subfolder: 'iPhone' },
    { size: 180, filename: 'Icon-App-60x60@3x.png', subfolder: 'iPhone' },
    
    // iPad
    { size: 20, filename: 'Icon-App-20x20@1x.png', subfolder: 'iPad' },
    { size: 40, filename: 'Icon-App-20x20@2x.png', subfolder: 'iPad' },
    { size: 29, filename: 'Icon-App-29x29@1x.png', subfolder: 'iPad' },
    { size: 58, filename: 'Icon-App-29x29@2x.png', subfolder: 'iPad' },
    { size: 40, filename: 'Icon-App-40x40@1x.png', subfolder: 'iPad' },
    { size: 80, filename: 'Icon-App-40x40@2x.png', subfolder: 'iPad' },
    { size: 76, filename: 'Icon-App-76x76@1x.png', subfolder: 'iPad' },
    { size: 152, filename: 'Icon-App-76x76@2x.png', subfolder: 'iPad' },
    { size: 167, filename: 'Icon-App-83.5x83.5@2x.png', subfolder: 'iPad' },
    
    // App Store
    { size: 1024, filename: 'Icon-App-1024x1024@1x.png', subfolder: 'AppStore' }
  ]
};

// 🤖 Android Icons - Adaptive + Legacy
export const ANDROID_ICONS: ExportPreset = {
  id: 'android-icons',
  name: 'Android Icons',
  description: 'Complete Android app icon set with adaptive icons',
  icon: '🤖',
  category: 'mobile',
  format: 'png',
  sizes: [36, 48, 72, 96, 144, 192, 512],
  folderStructure: 'platform-specific',
  fileNaming: 'descriptive',
  customFiles: [
    // Legacy Icons
    { size: 36, filename: 'ic_launcher.png', subfolder: 'mipmap-ldpi' },
    { size: 48, filename: 'ic_launcher.png', subfolder: 'mipmap-mdpi' },
    { size: 72, filename: 'ic_launcher.png', subfolder: 'mipmap-hdpi' },
    { size: 96, filename: 'ic_launcher.png', subfolder: 'mipmap-xhdpi' },
    { size: 144, filename: 'ic_launcher.png', subfolder: 'mipmap-xxhdpi' },
    { size: 192, filename: 'ic_launcher.png', subfolder: 'mipmap-xxxhdpi' },
    
    // Adaptive Icons (108dp with 72dp visible area)
    { size: 162, filename: 'ic_launcher_foreground.png', subfolder: 'mipmap-ldpi' },
    { size: 216, filename: 'ic_launcher_foreground.png', subfolder: 'mipmap-mdpi' },
    { size: 324, filename: 'ic_launcher_foreground.png', subfolder: 'mipmap-hdpi' },
    { size: 432, filename: 'ic_launcher_foreground.png', subfolder: 'mipmap-xhdpi' },
    { size: 648, filename: 'ic_launcher_foreground.png', subfolder: 'mipmap-xxhdpi' },
    { size: 864, filename: 'ic_launcher_foreground.png', subfolder: 'mipmap-xxxhdpi' },
    
    // Play Store
    { size: 512, filename: 'ic_launcher_playstore.png', subfolder: 'PlayStore' }
  ]
};

// 🌐 Web Favicons - Complete Package
export const WEB_FAVICONS: ExportPreset = {
  id: 'web-favicons',
  name: 'Web Favicons',
  description: 'Complete favicon package for modern websites',
  icon: '🌐',
  category: 'web',
  format: 'ico',
  sizes: [16, 32, 48, 64, 128, 256],
  folderStructure: 'nested',
  fileNaming: 'descriptive',
  customFiles: [
    // ICO Files
    { size: 16, filename: 'favicon-16x16.png', subfolder: 'png' },
    { size: 32, filename: 'favicon-32x32.png', subfolder: 'png' },
    { size: 48, filename: 'favicon-48x48.png', subfolder: 'png' },
    { size: 64, filename: 'favicon-64x64.png', subfolder: 'png' },
    { size: 128, filename: 'favicon-128x128.png', subfolder: 'png' },
    { size: 256, filename: 'favicon-256x256.png', subfolder: 'png' },
    
    // Apple Touch Icons
    { size: 57, filename: 'apple-touch-icon-57x57.png', subfolder: 'apple' },
    { size: 60, filename: 'apple-touch-icon-60x60.png', subfolder: 'apple' },
    { size: 72, filename: 'apple-touch-icon-72x72.png', subfolder: 'apple' },
    { size: 76, filename: 'apple-touch-icon-76x76.png', subfolder: 'apple' },
    { size: 114, filename: 'apple-touch-icon-114x114.png', subfolder: 'apple' },
    { size: 120, filename: 'apple-touch-icon-120x120.png', subfolder: 'apple' },
    { size: 144, filename: 'apple-touch-icon-144x144.png', subfolder: 'apple' },
    { size: 152, filename: 'apple-touch-icon-152x152.png', subfolder: 'apple' },
    { size: 180, filename: 'apple-touch-icon-180x180.png', subfolder: 'apple' },
    
    // Android Chrome
    { size: 192, filename: 'android-chrome-192x192.png', subfolder: 'android' },
    { size: 512, filename: 'android-chrome-512x512.png', subfolder: 'android' },
    
    // Microsoft Tiles
    { size: 70, filename: 'mstile-70x70.png', subfolder: 'microsoft' },
    { size: 144, filename: 'mstile-144x144.png', subfolder: 'microsoft' },
    { size: 150, filename: 'mstile-150x150.png', subfolder: 'microsoft' },
    { size: 310, filename: 'mstile-310x150.png', subfolder: 'microsoft' },
    { size: 310, filename: 'mstile-310x310.png', subfolder: 'microsoft' }
  ]
};

// 🖥️ Desktop App Icons
export const DESKTOP_ICONS: ExportPreset = {
  id: 'desktop-icons',
  name: 'Desktop App Icons',
  description: 'Multi-platform desktop application icons',
  icon: '🖥️',
  category: 'desktop',
  format: 'ico',
  sizes: [16, 24, 32, 48, 64, 128, 256, 512, 1024],
  folderStructure: 'nested',
  fileNaming: 'size-suffix',
  customFiles: [
    // Windows ICO
    { size: 256, filename: 'app.ico', subfolder: 'windows' },
    
    // macOS ICNS (PNG sources)
    { size: 16, filename: 'icon_16x16.png', subfolder: 'macos' },
    { size: 32, filename: 'icon_16x16@2x.png', subfolder: 'macos' },
    { size: 32, filename: 'icon_32x32.png', subfolder: 'macos' },
    { size: 64, filename: 'icon_32x32@2x.png', subfolder: 'macos' },
    { size: 128, filename: 'icon_128x128.png', subfolder: 'macos' },
    { size: 256, filename: 'icon_128x128@2x.png', subfolder: 'macos' },
    { size: 256, filename: 'icon_256x256.png', subfolder: 'macos' },
    { size: 512, filename: 'icon_256x256@2x.png', subfolder: 'macos' },
    { size: 512, filename: 'icon_512x512.png', subfolder: 'macos' },
    { size: 1024, filename: 'icon_512x512@2x.png', subfolder: 'macos' },
    
    // Linux
    { size: 48, filename: 'app-48x48.png', subfolder: 'linux' },
    { size: 64, filename: 'app-64x64.png', subfolder: 'linux' },
    { size: 128, filename: 'app-128x128.png', subfolder: 'linux' },
    { size: 256, filename: 'app-256x256.png', subfolder: 'linux' }
  ]
};

// 🎮 All Available Presets
export const EXPORT_PRESETS: ExportPreset[] = [
  IOS_APP_ICONS,
  ANDROID_ICONS,
  WEB_FAVICONS,
  DESKTOP_ICONS
];

// 🔧 Preset Utilities
export function getPresetById(id: string): ExportPreset | undefined {
  return EXPORT_PRESETS.find(preset => preset.id === id);
}

export function getPresetsByCategory(category: ExportPreset['category']): ExportPreset[] {
  return EXPORT_PRESETS.filter(preset => preset.category === category);
}

export function getAllPresetSizes(preset: ExportPreset): number[] {
  const sizes = new Set([...preset.sizes]);
  
  if (preset.customFiles) {
    preset.customFiles.forEach(file => sizes.add(file.size));
  }
  
  return Array.from(sizes).sort((a, b) => a - b);
}

export function generatePresetFilename(
  originalName: string, 
  size: number, 
  preset: ExportPreset,
  customFile?: { size: number; filename: string; subfolder?: string }
): string {
  if (customFile) {
    return customFile.filename;
  }
  
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  
  switch (preset.fileNaming) {
    case 'size-suffix':
      return `${baseName}-${size}px.${preset.format === 'ico' ? 'ico' : 'png'}`;
    case 'platform-suffix':
      return `${baseName}_${preset.id}_${size}.${preset.format === 'ico' ? 'ico' : 'png'}`;
    case 'descriptive':
      return `${baseName}-${size}x${size}.${preset.format === 'ico' ? 'ico' : 'png'}`;
    default:
      return `${baseName}-${size}.${preset.format === 'ico' ? 'ico' : 'png'}`;
  }
}