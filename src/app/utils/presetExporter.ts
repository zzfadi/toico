// Preset Export Engine - GOD MODE ACTIVATED!
// Handles professional export workflows with platform-specific ZIP packaging

import JSZip from 'jszip';
import { ExportPreset, generatePresetFilename, getAllPresetSizes } from './exportPresets';
import { convertImageToIco } from './imageToIco';
import { getImageDimensions } from './canvasHelpers';

export interface PresetExportProgress {
  currentSize: number;
  totalSizes: number;
  currentFile: string;
  overallProgress: number;
  status: 'starting' | 'processing' | 'packaging' | 'complete' | 'error';
}

export interface PresetExportResult {
  success: boolean;
  downloadUrl?: string;
  filename: string;
  error?: string;
  filesGenerated: number;
  totalSizes: number;
}

export class PresetExporter {
  private onProgress?: (progress: PresetExportProgress) => void;

  constructor(onProgress?: (progress: PresetExportProgress) => void) {
    this.onProgress = onProgress;
  }

  async exportPreset(
    imageFile: File,
    preset: ExportPreset
  ): Promise<PresetExportResult> {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = imageFile.name.replace(/\.[^/.]+$/, '');
    const allSizes = getAllPresetSizes(preset);
    
    this.reportProgress({
      currentSize: 0,
      totalSizes: allSizes.length,
      currentFile: 'Initializing...',
      overallProgress: 0,
      status: 'starting'
    });

    try {
      // Get image dimensions for validation
      let imageDimensions: { width: number; height: number } | undefined;
      try {
        imageDimensions = await getImageDimensions(imageFile);
      } catch (error) {
        console.warn('Could not get image dimensions:', error);
      }

      // Validate minimum size for quality
      if (imageDimensions && Math.max(imageDimensions.width, imageDimensions.height) < 256) {
        console.warn('Image smaller than recommended 256px minimum for optimal quality');
      }

      let processedCount = 0;
      const generatedFiles: Array<{
        size: number;
        blob: Blob;
        filename: string;
        subfolder?: string;
      }> = [];

      // Generate all required sizes with parallel processing and concurrency control
      const CONCURRENCY_LIMIT = 4; // Process max 4 sizes simultaneously for browser stability
      const processingQueue: Array<() => Promise<void>> = [];

      // Create processing tasks for all sizes
      for (const size of allSizes) {
        const processSize = async () => {
          this.reportProgress({
            currentSize: size,
            totalSizes: allSizes.length,
            currentFile: `Generating ${size}×${size}px...`,
            overallProgress: Math.round((processedCount / allSizes.length) * 80), // 80% for processing
            status: 'processing'
          });

          try {
            let blob: Blob;
            
            if (preset.format === 'ico') {
              // Generate ICO file
              const icoUrl = await convertImageToIco(imageFile, [size]);
              const response = await fetch(icoUrl);
              blob = await response.blob();
              URL.revokeObjectURL(icoUrl);
            } else {
              // Generate PNG file with timeout protection
              blob = await Promise.race([
                this.generatePngAtSize(imageFile, size),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error(`PNG generation timeout for ${size}px after 30 seconds`)), 30000)
                )
              ]);
            }

            // Find custom file configuration for this size
            const customFile = preset.customFiles?.find(cf => cf.size === size);
            const filename = generatePresetFilename(baseName, size, preset, customFile);

            generatedFiles.push({
              size,
              blob,
              filename,
              subfolder: customFile?.subfolder
            });

            processedCount++;
          } catch (error) {
            console.error(`Failed to generate size ${size}px:`, error);
            // Continue with other sizes instead of failing completely
          }
        };

        processingQueue.push(processSize);
      }

      // Process sizes with controlled concurrency
      const processWithConcurrency = async (tasks: Array<() => Promise<void>>, limit: number) => {
        const executing: Promise<void>[] = [];
        
        for (const task of tasks) {
          const promise = task();
          executing.push(promise);
          
          if (executing.length >= limit) {
            await Promise.race(executing);
            // Remove completed promises
            const stillExecuting = executing.filter(p => 
              Promise.race([p.then(() => false), Promise.resolve(true)])
            );
            executing.splice(0, executing.length, ...stillExecuting);
          }
        }
        
        // Wait for all remaining tasks to complete
        await Promise.all(executing);
      };

      await processWithConcurrency(processingQueue, CONCURRENCY_LIMIT);

      // Package into ZIP with proper folder structure
      this.reportProgress({
        currentSize: 0,
        totalSizes: allSizes.length,
        currentFile: 'Creating ZIP package...',
        overallProgress: 85,
        status: 'packaging'
      });

      await this.packageFilesIntoZip(zip, generatedFiles, preset, baseName, timestamp);

      // Generate ZIP blob and download URL
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const zipFilename = `${baseName}-${preset.id}-${timestamp}.zip`;

      this.reportProgress({
        currentSize: allSizes.length,
        totalSizes: allSizes.length,
        currentFile: 'Export complete!',
        overallProgress: 100,
        status: 'complete'
      });

      return {
        success: true,
        downloadUrl,
        filename: zipFilename,
        filesGenerated: generatedFiles.length,
        totalSizes: allSizes.length
      };

    } catch (error) {
      this.reportProgress({
        currentSize: 0,
        totalSizes: allSizes.length,
        currentFile: 'Export failed',
        overallProgress: 0,
        status: 'error'
      });

      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed',
        filesGenerated: 0,
        totalSizes: allSizes.length
      };
    }
  }

  private async generatePngAtSize(imageFile: File, size: number): Promise<Blob> {
    return Promise.race([
      new Promise<Blob>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        canvas.width = size;
        canvas.height = size;

        const img = new Image();
        const imageUrl = URL.createObjectURL(imageFile);
        
        // Set timeout for image loading
        const imageTimeout = setTimeout(() => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Image loading timeout'));
        }, 10000);

        img.onload = () => {
          clearTimeout(imageTimeout);
          try {
            // Enable high-quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw image scaled to exact size
            ctx.drawImage(img, 0, 0, size, size);

            // Set timeout for canvas.toBlob operation
            const blobTimeout = setTimeout(() => {
              URL.revokeObjectURL(imageUrl);
              reject(new Error('Canvas toBlob timeout'));
            }, 5000);

            canvas.toBlob(
              (blob) => {
                clearTimeout(blobTimeout);
                URL.revokeObjectURL(imageUrl);
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to generate PNG blob'));
                }
              },
              'image/png',
              1.0
            );
          } catch (error) {
            clearTimeout(imageTimeout);
            URL.revokeObjectURL(imageUrl);
            reject(error);
          }
        };

        img.onerror = () => {
          clearTimeout(imageTimeout);
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageUrl;
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PNG generation timeout after 15 seconds')), 15000)
      )
    ]);
  }

  private async packageFilesIntoZip(
    zip: JSZip,
    files: Array<{
      size: number;
      blob: Blob;
      filename: string;
      subfolder?: string;
    }>,
    preset: ExportPreset,
    baseName: string,
    timestamp: string
  ): Promise<void> {
    // Create main folder
    const mainFolderName = `${baseName}-${preset.id}-${timestamp}`;
    const mainFolder = zip.folder(mainFolderName);

    if (!mainFolder) {
      throw new Error('Failed to create main folder in ZIP');
    }

    // Add README with usage instructions
    const readmeContent = this.generateReadmeContent(preset, files.length);
    mainFolder.file('README.txt', readmeContent);

    // Organize files based on preset's folder structure
    switch (preset.folderStructure) {
      case 'flat':
        // All files in main folder
        for (const file of files) {
          mainFolder.file(file.filename, file.blob);
        }
        break;

      case 'nested':
        // Group by subfolder
        const subfolders = new Map<string, typeof files>();
        
        for (const file of files) {
          const key = file.subfolder || 'root';
          if (!subfolders.has(key)) {
            subfolders.set(key, []);
          }
          subfolders.get(key)!.push(file);
        }

        for (const [subfolderName, subfolderFiles] of subfolders) {
          const targetFolder = subfolderName === 'root' ? mainFolder : mainFolder.folder(subfolderName);
          if (targetFolder) {
            for (const file of subfolderFiles) {
              targetFolder.file(file.filename, file.blob);
            }
          }
        }
        break;

      case 'platform-specific':
        // Special handling for platform-specific presets
        if (preset.customFiles) {
          const platformFolders = new Map<string, typeof files>();
          
          for (const file of files) {
            const key = file.subfolder || 'general';
            if (!platformFolders.has(key)) {
              platformFolders.set(key, []);
            }
            platformFolders.get(key)!.push(file);
          }

          for (const [platformName, platformFiles] of platformFolders) {
            const platformFolder = mainFolder.folder(platformName);
            if (platformFolder) {
              for (const file of platformFiles) {
                platformFolder.file(file.filename, file.blob);
              }
            }
          }
        } else {
          // Fallback to flat structure
          for (const file of files) {
            mainFolder.file(file.filename, file.blob);
          }
        }
        break;
    }
  }

  private generateReadmeContent(preset: ExportPreset, fileCount: number): string {
    const now = new Date().toLocaleString();
    
    return `${preset.name} Export Package
Generated by Universal Image to ICO Converter
Created: ${now}

📦 Package Contents:
- ${fileCount} optimized ${preset.format.toUpperCase()} files
- Multiple sizes: ${getAllPresetSizes(preset).join(', ')} pixels
- Platform: ${preset.category}

🎯 Usage Instructions:
${this.getUsageInstructions(preset)}

🔒 Privacy Notice:
This package was generated entirely on your device.
No images were uploaded to any server.

🚀 Generated with God Mode activated!
Visit: https://toico.vercel.app
`;
  }

  private getUsageInstructions(preset: ExportPreset): string {
    switch (preset.id) {
      case 'ios-app-icons':
        return `1. Import all icons into your Xcode project
2. Use the appropriate @1x, @2x, @3x versions
3. The 1024px icon is for App Store submission
4. Organize by iPhone/iPad folders as needed`;

      case 'android-icons':
        return `1. Copy icons to respective mipmap folders in your Android project
2. Use ic_launcher.png for legacy icons
3. Use ic_launcher_foreground.png for adaptive icons
4. The 512px icon is for Google Play Store`;

      case 'web-favicons':
        return `1. Upload favicon.ico to your website root
2. Add PNG icons to your assets folder
3. Reference in HTML <head> with appropriate meta tags
4. Use Apple/Android specific icons for mobile`;

      case 'desktop-icons':
        return `1. Windows: Use .ico files for application icons
2. macOS: Convert PNG files to .icns using iconutil
3. Linux: Place in appropriate icon theme directories
4. Use size-appropriate icons for different contexts`;

      default:
        return `1. Select appropriate icon sizes for your use case
2. Follow platform-specific guidelines
3. Test icons at different sizes and contexts
4. Maintain consistent visual appearance`;
    }
  }

  private reportProgress(progress: PresetExportProgress): void {
    this.onProgress?.(progress);
  }
}

// Utility function for easy preset export
export async function exportPresetFromFile(
  imageFile: File,
  preset: ExportPreset,
  onProgress?: (progress: PresetExportProgress) => void
): Promise<PresetExportResult> {
  const exporter = new PresetExporter(onProgress);
  return await exporter.exportPreset(imageFile, preset);
}