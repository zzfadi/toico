# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Universal Image to ICO Converter**, a premium single-page Next.js application that converts multiple image formats (PNG, JPEG, WebP, GIF, BMP, SVG) to multi-size ICO format entirely client-side. The app features an advanced glassmorphism design system built for the "Defined by Jenna" permanent makeup artist brand, emphasizing privacy-first technology and professional aesthetics.

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
```

The dev server runs on http://localhost:3000 (or next available port)

## Architecture

### Core Application Flow
1. **FileUploader** component handles drag-and-drop upload with multi-format validation (PNG, JPEG, WebP, GIF, BMP, SVG)
2. **Preview** component generates previews at multiple sizes (256x256, 128x128, 64x64, 48x48, 32x32, 16x16) for any image format
3. **imageToIco utility** converts any supported image format to downloadable ICO using Canvas API with format-specific processing
4. All processing happens client-side for complete privacy

### Key Components

- **`src/app/page.tsx`**: Main application container with premium hero section, glassmorphism layout, and enhanced brand representation
- **`src/app/components/FileUploader.tsx`**: Advanced drag-and-drop uploader with glassmorphism styling, animated states, and premium UI feedback
- **`src/app/components/Preview.tsx`**: Sophisticated preview system with glass cards, interactive size selection, and animated conversion states
- **`src/app/components/FormatSupport.tsx`**: Floating glassmorphism info panel with detailed format support and professional tips
- **`src/app/utils/imageToIco.ts`**: Universal image conversion logic using Canvas API with timeout protection
- **`src/app/utils/imageFormats.ts`**: Comprehensive format detection, validation, and metadata handling
- **`src/app/utils/canvasHelpers.ts`**: High-quality image processing utilities for resampling and transparency handling
- **`src/app/utils/workerManager.ts`**: Web Worker coordination for heavy processing (prepared for future enhancements)
- **`src/app/globals.css`**: Advanced glassmorphism design system with custom animations, gradients, and visual effects

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

Enhanced React state management in main page component:
- `imageFile`: Original uploaded file (any supported format)
- `imageDataUrl`: Base64 data URL for processing
- `imageMetadata`: Format detection results with dimensions
- `icoDataUrl`: Generated ICO object URL for download
- `error`: Format-specific validation/conversion error messages

The state flows unidirectionally: FileUploader → Preview → Download, with format detection and metadata enrichment at each stage. All components maintain glassmorphism styling consistency throughout state changes.