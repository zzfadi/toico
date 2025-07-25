# Copilot Instructions for Universal Image to ICO Converter

## Project Architecture

This is a client-side Next.js 15 app that converts multiple image formats (PNG, JPEG, WebP, GIF, BMP, SVG) to both ICO and SVG formats with three processing modes:

**Three Processing Modes:**
1. **Single File**: Traditional one-at-a-time conversion with real-time preview
2. **Batch Processing**: Multi-file upload with parallel processing and ZIP download
3. **Export Presets**: Platform-specific icon packages (iOS, Android, Web, Windows)

**Core Architecture:**
- **`page.tsx`**: Central state manager with complex multi-mode state handling
- **`FileUploader`**: Single-file drag-and-drop with multi-format validation
- **`BatchFileUploader`**: Multi-file uploader with progress tracking
- **`Preview`**: Interactive preview with format switching (ICO/SVG)
- **`ExportPresets`**: Platform preset selection interface
- **`SegmentedControl`**: Mode switching control with accessibility

## Critical Canvas Timeout Pattern

**All Canvas API operations use defensive timeout patterns** - this is essential for handling malformed or complex images:

```typescript
// Example from utils/imageToIco.ts
await Promise.race([
  convertImageToIco(imageFile),
  new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Conversion timeout')), 10000)
  )
]);
```

Apply this pattern to any new canvas operations. Timeouts: 5s for previews, 10-15s for conversion depending on format complexity.

## Brand-Specific Styling

Uses "Defined by Jenna" brand colors defined in `globals.css` as CSS variables:
- `--soft-cream` (#F7F5F0): Background
- `--mocha-mousse` (#A47764): Primary buttons/borders
- `--charcoal-gray` (#36454F): Text

**Styling Convention**: Components use inline `style` props with hex colors instead of Tailwind color classes for brand consistency.

## Multi-Format Conversion Implementation

**ICO Conversion (`imageToIco.ts`)**:
- Creates proper multi-size ICO files with binary headers for all image formats
- ICO_SIZES array: `[16, 32, 48, 64, 128, 256]` (size 256 encoded as 0 in ICO headers)
- Format-specific processing: SVG rasterized per-size, raster images use high-quality resampling
- **Transparency handling**: Automatic white background for JPEG/BMP formats

**SVG Conversion (`imageToSvg.ts`)**:
- Converts images to scalable SVG format with intelligent sizing
- Preserves transparency for supported formats
- Optimized for different output sizes (32, 64, 128px typically)

**Export Presets (`presetExporter.ts`)**:
- Platform-specific export with predefined size sets and naming conventions
- ZIP packaging with proper folder structures
- Progress tracking for batch operations
- Support for both ICO and PNG formats based on platform requirements

## State Management Pattern

**Complex Multi-Mode State** in `page.tsx`:

**Core Single-File State**: `imageFile`, `imageDataUrl`, `imageMetadata`, `convertedUrl`, `error`
**Mode Management**: `processingMode` ('single' | 'batch' | 'presets'), `currentFormat` ('ico' | 'svg')
**Preset Export State**: `selectedPreset`, `isExportingPreset`, `presetProgress`, `presetExportResult`

**State Flow Patterns**:
- **Single**: FileUploader → Preview → Download
- **Batch**: BatchFileUploader → Progress Tracking → ZIP Download  
- **Presets**: PresetSelector → FileUploader → Automated Export → Download

File selection clears previous conversion state across all modes. Error states reset downstream state appropriately for each mode.

## Development Workflow

```bash
npm run dev              # Development server (standard Next.js)
npm run build            # Production build  
npm run lint             # ESLint validation
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:debug   # Debug E2E tests
```

Local server: http://localhost:3000 (or next available port)

## Error Handling Convention

- **User-facing errors**: Show specific, actionable messages ("Invalid SVG file", "File too large")
- **Technical errors**: Log to console, show generic "conversion failed" message
- **Timeout errors**: Always suggest trying a different file
- **Format-specific errors**: "JPEG quality too low", "PNG transparency detected", etc.

## Privacy-First Architecture

All processing happens client-side using File API, Canvas API, Web Workers, and Blob URLs. No server endpoints exist for file processing - maintain this architecture for user privacy across all three processing modes.

## Testing Framework

**Comprehensive E2E Testing** with Playwright covering all three modes:
- **154 unique test cases** across 10 test files
- **Multi-browser testing**: Chrome, Firefox, Safari, Edge, Mobile Chrome/Safari
- **Key test areas**: Basic functionality, Upload, Conversion, Batch processing, Export presets, UI interactions, Error handling, Performance
- **Test utilities**: Helper functions in `tests/fixtures/helpers/` for common operations
- **CI Integration**: Automated testing with GitHub Actions

See `docs/testing/E2E_TESTING_GUIDE.md` for comprehensive testing documentation.
