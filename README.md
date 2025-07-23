# Universal Image to ICO Converter

A privacy-first, client-side web application that converts multiple image formats (PNG, JPEG, WebP, GIF, BMP, SVG) to multi-size ICO format instantly in your browser. Built with Next.js 15 and designed with the "Defined by Jenna" brand aesthetic.

## ✨ Features

### 🖼️ **Multi-Format Support**
- **PNG** - Perfect for logos with transparency
- **JPEG** - Great for photos (white background added automatically)
- **WebP** - Modern web format with transparency support
- **GIF** - Animated GIFs supported (first frame used)
- **BMP** - Classic bitmap format
- **SVG** - Vector graphics (rasterized for optimal quality)

### 🎯 **Smart Processing**
- **Multi-size ICO generation** - Creates 6 sizes: 16×16, 32×32, 48×48, 64×64, 128×128, 256×256
- **High-quality resampling** - Preserves image quality with intelligent scaling
- **Transparency handling** - Automatic white background for formats that don't support transparency
- **Size optimization** - Pixelated rendering for small icons (≤32px) for crisp results

### 🔒 **Privacy-First**
- **100% client-side processing** - Your images never leave your browser
- **No server uploads** - All conversion happens locally using Canvas API
- **Instant processing** - No waiting for server response times

### 💎 **Enhanced User Experience**
- **Drag & drop interface** - Simply drag images onto the upload area
- **Format detection** - Automatically detects and displays image format and dimensions
- **Real-time preview** - See how your icon will look at each size
- **Selective sizing** - Choose which ICO sizes to include
- **Format-specific guidance** - Helpful tips for each image format

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
│   │   ├── FileUploader.tsx      # Multi-format file upload with validation
│   │   ├── Preview.tsx           # Image preview and ICO conversion
│   │   ├── FormatSupport.tsx     # Format information panel
│   │   └── DebugConverter.tsx    # Development testing utilities
│   ├── utils/
│   │   ├── imageToIco.ts         # Universal image to ICO conversion
│   │   ├── imageFormats.ts       # Format detection and validation
│   │   ├── canvasHelpers.ts      # High-quality image processing
│   │   └── workerManager.ts      # Web Worker management (future)
│   ├── globals.css               # Brand colors and styling
│   ├── layout.tsx                # App layout with metadata
│   └── page.tsx                  # Main application component
└── public/
    └── image-worker.js           # Web Worker for image processing
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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server  
npm run lint         # Run ESLint
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Comprehensive error handling
- Performance monitoring with timeouts

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
