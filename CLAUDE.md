# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Universal Image to ICO Converter**, a premium Next.js application that converts multiple image formats (PNG, JPEG, WebP, GIF, BMP, SVG) to both ICO and SVG formats with three processing modes: single file conversion, batch processing, and export presets for platforms like iOS, Android, and Web. All processing happens entirely client-side with an advanced glassmorphism design system built for the "Defined by Jenna" permanent makeup artist brand.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# Show E2E test report
npm run test:e2e:report

# Install Playwright browsers
npm run test:e2e:install
```

The dev server runs on http://localhost:3000 (or next available port)

## Architecture

### Core Application Architecture

The application has evolved into a sophisticated multi-mode converter with three distinct processing workflows:

**1. Single File Mode:**
- FileUploader → Preview → Download (traditional one-at-a-time conversion)
- Real-time preview with selectable icon sizes
- ICO or SVG output formats

**2. Batch Processing Mode:**
- BatchFileUploader handles multiple files simultaneously
- Parallel processing with progress tracking
- ZIP download containing all converted files
- Optimized for bulk operations

**3. Export Presets Mode:**
- Platform-specific icon packages (iOS, Android, Web, Windows)
- Pre-configured size sets for each platform
- Professional naming conventions and folder structures
- Single image input generates complete platform packages

### Key Components

**Core UI Components:**
- **`src/app/page.tsx`**: Main application with three-mode interface, state management, and premium hero section
- **`src/app/components/FileUploader.tsx`**: Single-file drag-and-drop uploader with format validation
- **`src/app/components/BatchFileUploader.tsx`**: Multi-file uploader with parallel processing and progress tracking
- **`src/app/components/Preview.tsx`**: Interactive preview system with size selection and format switching
- **`src/app/components/ExportPresets.tsx`**: Platform preset selection interface (iOS, Android, Web, Windows)
- **`src/app/components/SegmentedControl.tsx`**: Mode switching control for single/batch/preset modes
- **`src/app/components/FormatSupport.tsx`**: Floating info panel with format guidance

**Conversion Utilities:**
- **`src/app/utils/imageToIco.ts`**: Core ICO conversion with multi-format support and Canvas API
- **`src/app/utils/imageToSvg.ts`**: SVG conversion with intelligent sizing and optimization
- **`src/app/utils/imageFormats.ts`**: Format detection, validation, and metadata handling
- **`src/app/utils/canvasHelpers.ts`**: High-quality image processing and resampling utilities
- **`src/app/utils/exportPresets.ts`**: Platform preset definitions and configuration
- **`src/app/utils/presetExporter.ts`**: Batch preset export with ZIP packaging
- **`src/app/utils/batchWorkerManager.ts`**: Web Worker coordination for batch processing
- **`src/app/utils/workerManager.ts`**: General-purpose worker management utilities

**Styling:**
- **`src/app/globals.css`**: Advanced glassmorphism design system with brand colors and animations

### Multi-Format Conversion Process

The universal image-to-ICO conversion process handles different formats appropriately:

**For Raster Images (PNG, JPEG, WebP, GIF, BMP):**
1. Load image to canvas using `loadImageToCanvas()`
2. Detect transparency and add white background if needed (JPEG, BMP)
3. Resize with high-quality resampling for each ICO size
4. Extract first frame for animated GIFs
5. Generate PNG data for each size and create ICO file

**For SVG Images:**
1. Parse SVG content from file
2. Render SVG to canvas at each target size for optimal quality
3. Generate PNG data for each size and create ICO file

**Critical**: All canvas operations have timeout protection (5-15 seconds) to prevent hanging on malformed or complex images.

## Supported Image Formats

The application supports 6 major image formats with format-specific processing:

| Format | Extensions | Max Size | Transparency | Processing Notes |
|--------|------------|----------|--------------|------------------|
| **PNG** | `.png` | 50MB | ✅ | Optimal for logos and graphics |
| **JPEG** | `.jpg`, `.jpeg` | 50MB | ❌ | White background added automatically |
| **WebP** | `.webp` | 50MB | ✅ | Modern format with transparency support |
| **GIF** | `.gif` | 50MB | ✅ | First frame extracted for conversion |
| **BMP** | `.bmp` | 50MB | ❌ | White background added automatically |
| **SVG** | `.svg` | 100MB | ✅ | Rasterized at each size for optimal quality |

### Format-Specific Features
- **Smart transparency handling**: Automatic white background for formats without transparency
- **High-quality resampling**: Intelligent scaling with appropriate smoothing algorithms
- **Animated GIF support**: First frame extraction with user notification
- **SVG optimization**: Per-size rasterization instead of single-size scaling
- **Format detection**: MIME type + file extension validation with fallback

## Advanced Glassmorphism Design System

The application features a premium glassmorphism design with sophisticated visual effects and brand integration.

### Brand Colors
"Defined by Jenna" permanent makeup artist brand palette:
```css
--soft-cream: #F7F5F0        /* Background base */
--mocha-mousse: #A47764      /* Primary brand color */
--golden-terra: #B8956A      /* Accent and hover states */
--champagne-gold: #F7E7CE    /* Highlights and luxury accents */
--charcoal-gray: #36454F     /* Professional text */
--classic-blue: #0056B3      /* Trust and security indicators */
```

### Glassmorphism Effects
Advanced CSS utility classes for consistent glass design:
```css
.glass-card         /* Semi-transparent backgrounds with backdrop blur */
.glass-button       /* Interactive buttons with glass effects */
.premium-gradient   /* Sophisticated multi-layer gradients */
.text-glow          /* Professional text shadow effects */
.floating-animation /* Subtle floating animations */
.pulse-glow         /* Animated glow effects for emphasis */
```

### Visual Features
- **Multi-layer backgrounds**: Gradient overlays with radial accent patterns
- **Backdrop blur effects**: 10-20px blur for depth and sophistication  
- **Interactive animations**: Hover scaling, glow effects, and smooth transitions
- **Professional typography**: Font weight variations with text glow effects
- **Brand integration**: "Defined by Jenna" logo styling and professional positioning

**Important**: All glassmorphism effects use inline styles combined with CSS classes for optimal browser compatibility.

## Error Handling & Performance

### Multi-Format Validation
- **Format detection**: MIME type validation with file extension fallback
- **Size limits**: 50MB for raster images, 100MB for SVG files  
- **Dimension checking**: Recommends 256×256+ for optimal ICO quality
- **Browser compatibility**: Feature detection for WebP and other modern formats

### Performance Optimizations  
- **Canvas timeout protection**: 5s for previews, 10-15s for conversion
- **Progressive preview loading**: `Promise.allSettled()` for non-blocking UI
- **High-quality resampling**: Format-appropriate scaling algorithms
- **Memory management**: Proper cleanup of blob URLs, canvas contexts, and image objects
- **Web Worker ready**: Infrastructure for background processing (future enhancement)

### Error Recovery
- **Format-specific errors**: "JPEG quality too low", "PNG transparency detected", etc.
- **Timeout handling**: User-friendly messages suggesting alternative files  
- **Graceful degradation**: Fallbacks for unsupported formats or browser limitations

## Premium User Experience

### Hero Section & Brand Positioning
- **Compelling introduction**: Privacy-first messaging with "Defined by Jenna" brand integration
- **Feature highlights**: Glassmorphism badges showcasing key benefits (100% Private, 6 Formats, Instant Processing, Free Forever)
- **Professional presentation**: Permanent makeup artist brand positioned as community gift
- **Trust indicators**: Security icons and privacy-first technology emphasis

### Enhanced Interactive Elements
- **FileUploader**: Premium drag-and-drop with animated states, glass effects, and smart file detection
- **Preview**: Sophisticated icon size selection with visual feedback and glassmorphism cards
- **FormatSupport**: Floating info panel with detailed format guidance and professional tips
- **Download**: Celebration UI with conversion summary and prominent download button

### Accessibility & UX Improvements
- **Visual feedback**: Loading states, hover animations, and success confirmations
- **Professional messaging**: Community-focused language emphasizing the free tool nature
- **Brand consistency**: "Defined by Jenna" representation throughout the experience
- **Responsive design**: Mobile-optimized glassmorphism effects and layouts

## State Management

The main application (`src/app/page.tsx`) manages complex state across three processing modes:

**Core Single-File State:**
- `imageFile`: Original uploaded file (any supported format)
- `imageDataUrl`: Base64 data URL for processing
- `imageMetadata`: Format detection results with dimensions
- `convertedUrl`: Generated output file URL (ICO/SVG)
- `currentFormat`: Selected output format ('ico' | 'svg')
- `error`: Format-specific validation/conversion error messages

**Mode Management:**
- `processingMode`: Current mode ('single' | 'batch' | 'presets')
- `selectedSizes`: Set of ICO sizes for conversion (16, 32, 48, 64, 128, 256)
- `svgSelectedSizes`: Set of SVG sizes for conversion (32, 64, 128)

**Preset Export State:**
- `selectedPreset`: Currently selected export preset (iOS, Android, etc.)
- `isExportingPreset`: Loading state during preset export
- `presetProgress`: Progress tracking for batch preset operations
- `presetExportResult`: Results and download info for completed preset exports

State flows vary by mode:
- **Single**: FileUploader → Preview → Download
- **Batch**: BatchFileUploader → Progress Tracking → ZIP Download
- **Presets**: PresetSelector → FileUploader → Automated Export → Download

## Testing Architecture

Comprehensive E2E testing with Playwright covering all three processing modes:

**Test Structure:**
- `tests/e2e/basic.spec.ts`: Core application loading and UI tests
- `tests/e2e/upload.spec.ts`: File upload and validation tests
- `tests/e2e/conversion.spec.ts`: Single-file conversion functionality
- `tests/e2e/batch-processing.spec.ts`: Bulk conversion workflows
- `tests/e2e/export-presets.spec.ts`: Platform preset export tests
- `tests/e2e/ui-interactions.spec.ts`: User interface interaction tests
- `tests/e2e/error-handling.spec.ts`: Error states and recovery
- `tests/e2e/performance.spec.ts`: Performance and timeout testing

**Test Configuration:**
- Multi-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (Pixel 5, iPhone 12)
- Automatic dev server startup
- Screenshot and video capture on failures
- JUnit XML reporting for CI/CD integration

**Test Fixtures:**
- `tests/fixtures/images/`: Sample images in all supported formats
- `tests/fixtures/helpers/`: Reusable test helper functions
- Automated test image generation for consistency