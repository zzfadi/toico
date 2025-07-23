# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **SVG to ICO Converter**, a single-page Next.js application that converts SVG files to ICO format entirely client-side. The app is built for the "Defined by Jenna" brand with specific styling requirements.

## Development Commands

```bash
# Start development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The dev server runs on http://localhost:3000

## Architecture

### Core Application Flow
1. **FileUploader** component handles drag-and-drop SVG upload with validation
2. **Preview** component generates previews at multiple sizes (256x256, 64x64, 32x32, 16x16)  
3. **svgToIco utility** converts SVG to downloadable ICO using Canvas API
4. All processing happens client-side for privacy

### Key Components

- **`src/app/page.tsx`**: Main application container managing state flow between uploader and preview
- **`src/app/components/FileUploader.tsx`**: Handles file upload, validation (SVG MIME type, size limits), drag-and-drop UX
- **`src/app/components/Preview.tsx`**: Shows conversion progress, generates multiple size previews, handles download
- **`src/app/utils/svgToIco.ts`**: Core conversion logic using Canvas API with timeout protection

### Conversion Process

The SVG-to-ICO conversion uses a simplified approach:
1. Parse SVG content from data URL
2. Render SVG to PNG using Canvas API at 256x256
3. Create blob with `image/x-icon` MIME type (browsers handle as PNG for favicons)
4. Generate object URL for download

**Critical**: All canvas operations have timeout protection (3-10 seconds) to prevent hanging on malformed SVGs.

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

- File validation: SVG MIME type, 100MB size limit
- Canvas timeout protection prevents infinite loops
- Progressive preview loading with `Promise.allSettled()`
- Proper resource cleanup with `URL.revokeObjectURL()`

## State Management

Simple React state in main page component:
- `svgFile`: Original uploaded file
- `svgDataUrl`: Base64 data URL for processing
- `icoDataUrl`: Generated ICO object URL for download
- `error`: Validation/conversion error messages

The state flows unidirectionally from FileUploader → Preview → Download.