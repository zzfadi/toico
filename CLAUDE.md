# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Universal Image to ICO Converter**, a single-page Next.js application that converts multiple image formats (PNG, JPEG, WebP, GIF, BMP, SVG) to multi-size ICO format entirely client-side. The app is built for the "Defined by Jenna" brand with specific styling requirements and maintains complete privacy by processing all images in the browser.

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

- **`src/app/page.tsx`**: Main application container managing state flow between uploader and preview
- **`src/app/components/FileUploader.tsx`**: Handles multi-format file upload, validation (MIME type detection, size limits), drag-and-drop UX with format detection
- **`src/app/components/Preview.tsx`**: Shows conversion progress, generates multiple size previews, handles format-specific processing and download
- **`src/app/components/FormatSupport.tsx`**: Interactive panel showing supported formats and helpful tips
- **`src/app/utils/imageToIco.ts`**: Universal image conversion logic using Canvas API with timeout protection (renamed from svgToIco.ts)
- **`src/app/utils/imageFormats.ts`**: Comprehensive format detection, validation, and metadata handling
- **`src/app/utils/canvasHelpers.ts`**: High-quality image processing utilities for resampling and transparency handling
- **`src/app/utils/workerManager.ts`**: Web Worker coordination for heavy processing (prepared for future enhancements)

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

## Brand Styling

The application uses "Defined by Jenna" brand colors defined in CSS custom properties:

```css
--soft-cream: #F7F5F0        /* Background */
--mocha-mousse: #A47764      /* Primary elements */
--golden-terra: #B8956A      /* Hover states */
--champagne-gold: #F7E7CE    /* Highlights */
--charcoal-gray: #36454F     /* Text */
--classic-blue: #0056B3      /* Trust signals */
```

**Important**: Components use inline styles for colors rather than Tailwind custom classes due to configuration limitations.

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

## State Management

Enhanced React state management in main page component:
- `imageFile`: Original uploaded file (any supported format)
- `imageDataUrl`: Base64 data URL for processing
- `imageMetadata`: Format detection results with dimensions
- `icoDataUrl`: Generated ICO object URL for download
- `error`: Format-specific validation/conversion error messages

The state flows unidirectionally: FileUploader → Preview → Download, with format detection and metadata enrichment at each stage.