# Copilot Instructions for SVG to ICO Converter

## Project Architecture

This is a client-side Next.js 15 app that converts SVG files to multi-size ICO format in the browser. The app follows a three-component state flow pattern:

1. **`page.tsx`**: Central state manager coordinating file upload → preview → conversion
2. **`FileUploader`**: Drag-and-drop with SVG validation (MIME type + 100MB limit)  
3. **`Preview`**: Generates multi-size previews (256px, 64px, 32px, 16px) and triggers ICO conversion

## Critical Canvas Timeout Pattern

**All Canvas API operations use defensive timeout patterns** - this is essential for handling malformed SVGs:

```typescript
// Example from utils/svgToIco.ts
await Promise.race([
  convertSvgToIco(svgDataUrl),
  new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Conversion timeout')), 10000)
  )
]);
```

Apply this pattern to any new canvas operations. Timeouts: 5s for previews, 10s for conversion.

## Brand-Specific Styling

Uses "Defined by Jenna" brand colors defined in `globals.css` as CSS variables:
- `--soft-cream` (#F7F5F0): Background
- `--mocha-mousse` (#A47764): Primary buttons/borders
- `--charcoal-gray` (#36454F): Text

**Styling Convention**: Components use inline `style` props with hex colors instead of Tailwind color classes for brand consistency.

## ICO File Format Implementation

The `svgToIco.ts` utility creates proper multi-size ICO files with binary headers, not simple PNG-to-ICO conversion. When modifying:

- Maintain the ICO_SIZES array: `[16, 32, 48, 64, 128, 256]`
- The `createIcoFile()` function writes ICO directory headers + PNG data
- Size 256 is encoded as 0 in ICO headers (ICO format limitation)

## State Management Pattern

Use the existing unidirectional state flow in `page.tsx`:
- File selection clears previous conversion state
- Error state resets all downstream state (SVG + ICO)
- Successful conversion prevents re-conversion until new file upload

## Development Workflow

```bash
npm run dev --turbopack  # Development with Turbopack
npm run build           # Production build  
npm run lint           # ESLint validation
```

Local server: http://localhost:3000

## Error Handling Convention

- **User-facing errors**: Show specific, actionable messages ("Invalid SVG file", "File too large")
- **Technical errors**: Log to console, show generic "conversion failed" message
- **Timeout errors**: Always suggest trying a different file

## Privacy-First Architecture

All processing happens client-side using File API, Canvas API, and Blob URLs. No server endpoints exist for file processing - maintain this architecture for user privacy.
