# Universal Image Converter

A privacy-first, client-side web application that converts multiple image formats (PNG, JPEG, WebP, GIF, BMP, SVG) to both ICO and SVG formats with three powerful processing modes. Built with Next.js 15 and designed with the "Defined by Jenna" brand aesthetic.

## ✨ Features

### 🚀 **Three Processing Modes**
- **🎯 Single File Mode** - Traditional one-at-a-time conversion with real-time preview
- **🔥 Batch Processing Mode** - Multi-file upload with parallel processing and ZIP download
- **🎨 Export Presets Mode** - Platform-specific icon packages (iOS, Android, Web, Windows)

### 📊 **Dual Output Formats**
- **ICO Format** - Traditional icon files with multiple sizes (16×16 to 256×256)
- **SVG Format** - Scalable vector graphics for modern applications

### 🖼️ **Multi-Format Input Support**
- **PNG** - Perfect for logos with transparency
- **JPEG** - Great for photos (white background added automatically)
- **WebP** - Modern web format with transparency support
- **GIF** - Animated GIFs supported (first frame used)
- **BMP** - Classic bitmap format
- **SVG** - Vector graphics (rasterized for optimal quality)

### 🎯 **Professional Export Presets**
- **iOS App Icons** - Complete iOS icon package with all required sizes
- **Android App Icons** - Android adaptive and legacy icon sets
- **Web Favicons** - Web-optimized favicon packages
- **Windows Desktop** - Windows application icon sets

### 🔧 **Advanced Processing**
- **Batch Operations** - Process multiple files simultaneously with progress tracking
- **High-quality resampling** - Preserves image quality with intelligent scaling
- **Transparency handling** - Automatic white background for formats without transparency
- **Web Worker Processing** - Background processing for smooth performance
- **ZIP Packaging** - Organized downloads with proper file structure

### 🔒 **Privacy-First Architecture**
- **100% client-side processing** - Your images never leave your browser
- **No server uploads** - All conversion happens locally using Canvas API and Web Workers
- **Instant processing** - No waiting for server response times
- **No data collection** - Complete anonymity

### 💎 **Enhanced User Experience**
- **Mode Switching** - Intuitive segmented control for different workflows
- **Drag & drop interface** - Multi-file drag and drop support
- **Format detection** - Automatically detects and displays image format and dimensions
- **Real-time preview** - See how your icons will look at each size
- **Progress tracking** - Individual file progress in batch operations
- **Format-specific guidance** - Helpful tips for each image format
- **Responsive design** - Works seamlessly on desktop and mobile

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/zzfadi/toico.git
cd toico

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev

# The app will be available at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── FileUploader.tsx         # Single-file upload with validation
│   │   ├── BatchFileUploader.tsx    # Multi-file batch uploader
│   │   ├── Preview.tsx              # Interactive preview with format switching
│   │   ├── ExportPresets.tsx        # Platform preset selection
│   │   ├── SegmentedControl.tsx     # Mode switching control
│   │   └── FormatSupport.tsx        # Format information panel
│   ├── utils/
│   │   ├── imageToIco.ts            # Universal image to ICO conversion
│   │   ├── imageToSvg.ts            # SVG conversion utility
│   │   ├── imageFormats.ts          # Format detection and validation
│   │   ├── canvasHelpers.ts         # High-quality image processing
│   │   ├── exportPresets.ts         # Platform preset definitions
│   │   ├── presetExporter.ts        # Batch preset export with ZIP
│   │   ├── batchWorkerManager.ts    # Batch processing coordination
│   │   └── workerManager.ts         # Web Worker management
│   ├── globals.css                  # Brand colors and styling
│   ├── layout.tsx                   # App layout with metadata
│   └── page.tsx                     # Main application with multi-mode state
├── tests/
│   ├── e2e/                         # E2E test suites (154 tests)
│   └── fixtures/                    # Test helpers and sample images
└── public/
    ├── image-worker.js              # Image processing Web Worker
    └── batch-worker.js              # Batch processing Web Worker
```

## 🎨 Supported Image Formats

| Format | Extensions | Max Size | Transparency | Notes |
|--------|------------|----------|--------------|-------|
| PNG | `.png` | 50MB | ✅ | Best for logos and graphics |
| JPEG | `.jpg`, `.jpeg` | 50MB | ❌ | White background added automatically |
| WebP | `.webp` | 50MB | ✅ | Modern format with great compression |
| GIF | `.gif` | 50MB | ✅ | First frame used for conversion |
| BMP | `.bmp` | 50MB | ❌ | Classic bitmap format |
| SVG | `.svg` | 100MB | ✅ | Vector graphics, scales perfectly |

## 🛠️ Technical Details

### Architecture
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom brand colors
- **Processing**: Canvas API with timeout protection
- **State Management**: React hooks with unidirectional data flow

### Key Features
- **Defensive programming**: All canvas operations include timeout protection
- **Memory management**: Proper cleanup of blob URLs and canvas contexts
- **Error handling**: Comprehensive validation with user-friendly messages
- **Performance**: Progressive loading and high-quality image resampling

### Brand Colors
```css
--soft-cream: #F7F5F0        /* Background */
--mocha-mousse: #A47764      /* Primary elements */
--golden-terra: #B8956A      /* Hover states */
--champagne-gold: #F7E7CE    /* Highlights */
--charcoal-gray: #36454F     /* Text */
--classic-blue: #0056B3      /* Trust elements */
```

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server  
npm run lint             # Run ESLint
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:debug   # Debug E2E tests
npm run test:e2e:report  # Show E2E test report
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Comprehensive error handling
- Performance monitoring with timeouts
- Comprehensive E2E testing with Playwright
- Multi-browser and mobile testing
- 154 test cases across all features

## 📱 Browser Support

- **Chrome 90+** - Full support including WebP
- **Firefox 88+** - Full support
- **Safari 14+** - Full support  
- **Edge 90+** - Full support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Designed for "Defined by Jenna" brand
- Icons and graphics processed with HTML5 Canvas API
- Inspired by the need for privacy-focused image conversion tools

---

**Made with ❤️ for the web community**
