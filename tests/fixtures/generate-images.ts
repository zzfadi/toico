import fs from 'fs';
import path from 'path';

/**
 * Generate test image fixtures for E2E testing
 */
export function generateTestImages() {
  const fixturesDir = path.join(__dirname, '..', 'images');

  // 1x1 PNG (transparent)
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8qMwAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(path.join(fixturesDir, 'sample.png'), pngData);

  // 1x1 JPEG (white)
  const jpegData = Buffer.from(
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    'base64'
  );
  fs.writeFileSync(path.join(fixturesDir, 'sample.jpg'), jpegData);

  // Simple SVG
  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect width="100" height="100" fill="red"/>
    <circle cx="50" cy="50" r="30" fill="blue"/>
  </svg>`;
  fs.writeFileSync(path.join(fixturesDir, 'sample.svg'), svgData);

  // WebP (1x1 transparent)
  const webpData = Buffer.from(
    'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    'base64'
  );
  fs.writeFileSync(path.join(fixturesDir, 'sample.webp'), webpData);

  // Large file for testing size limits (creating a larger SVG)
  const largeSvgData = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">
    ${Array.from({ length: 1000 }, (_, i) => 
      `<rect x="${i % 100 * 10}" y="${Math.floor(i / 100) * 10}" width="9" height="9" fill="hsl(${i * 36 % 360}, 50%, 50%)"/>`
    ).join('\n')}
  </svg>`;
  fs.writeFileSync(path.join(fixturesDir, 'large-image.svg'), largeSvgData);

  console.log('Test image fixtures generated successfully!');
}

// Generate fixtures if this file is run directly
if (require.main === module) {
  generateTestImages();
}