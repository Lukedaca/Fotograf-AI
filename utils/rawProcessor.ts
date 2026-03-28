
// Define minimal interface for exifr
interface ExifrModule {
    thumbnail: (file: File | Blob | ArrayBuffer) => Promise<Uint8Array | undefined>;
    preview: (file: File | Blob | ArrayBuffer) => Promise<Uint8Array | undefined>;
    default: ExifrModule; 
}

export const RAW_EXTENSIONS = [".cr2", ".cr3", ".nef", ".arw", ".orf", ".raf", ".dng", ".pef", ".rw2"];
export const RAW_EXTENSIONS_STRING = RAW_EXTENSIONS.join(',');

interface ImageCandidate {
    blob: Blob;
    width: number;
    height: number;
    resolution: number;
    source: string;
}

// Helper: Check if a blob is a valid image and get dimensions
const validateImageBlob = (blob: Blob): Promise<{ isValid: boolean; width: number; height: number }> => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            // 1. Check dimensions (Filter out 1x1 masks or tiny icons)
            if (img.width < 50 || img.height < 50) {
                URL.revokeObjectURL(url);
                resolve({ isValid: false, width: 0, height: 0 });
                return;
            }

            // 2. Check for CONTENT (Filter out solid black images)
            const canvas = document.createElement('canvas');
            canvas.width = 40; 
            canvas.height = 40;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, 40, 40);
                try {
                    const imageData = ctx.getImageData(0, 0, 40, 40);
                    const data = imageData.data;
                    let totalSum = 0;
                    // Scan pixels
                    for (let i = 0; i < data.length; i += 4) {
                        totalSum += data[i] + data[i + 1] + data[i + 2]; // R+G+B
                    }
                    
                    if (totalSum === 0) {
                         URL.revokeObjectURL(url);
                         resolve({ isValid: false, width: 0, height: 0 });
                         return;
                    }
                } catch (e) {
                    // Ignore CORS issues
                }
            }

            resolve({ isValid: true, width: img.width, height: img.height });
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            resolve({ isValid: false, width: 0, height: 0 });
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });
};

// Helper to scan binary data for JPEG candidates (Fallback method)
const scanForJpegCandidates = async (file: File): Promise<Blob[]> => {
    try {
        const buffer = await file.arrayBuffer();
        const view = new Uint8Array(buffer);
        const candidates: { start: number, length: number }[] = [];

        // Scan for JPEG SOI marker (FF D8 FF)
        // Optimization: Skip bytes to be faster
        for (let i = 0; i < view.length - 2; i++) {
            if (view[i] === 0xFF && view[i + 1] === 0xD8 && view[i + 2] === 0xFF) {
                const start = i;
                let foundEOI = false;
                
                // Look for EOI marker (FF D9)
                const maxSearch = Math.min(view.length - 1, i + 20_000_000); 
                
                for (let j = i + 200; j < maxSearch; j++) {
                     if (view[j] === 0xFF && view[j + 1] === 0xD9) {
                        const end = j + 2;
                        const length = end - start;
                        
                        // Filter: Candidate must be > 100KB 
                        if (length > 100_000) {
                             candidates.push({ start, length });
                        }
                        foundEOI = true;
                        break; 
                     }
                }
                
                if (foundEOI) {
                    i += 1000; 
                }
            }
        }

        candidates.sort((a, b) => b.length - a.length);
        return candidates.slice(0, 3).map(c => 
            new Blob([view.slice(c.start, c.start + c.length)], { type: 'image/jpeg' })
        );

    } catch (e) {
        console.error("Scanner failed", e);
        return [];
    }
};

let exifrInstance: ExifrModule | null = null;
let exifrLoadFailed = false;

const getExifr = async (): Promise<ExifrModule | null> => {
    if (exifrInstance) return exifrInstance;
    if (exifrLoadFailed) return null;
    try {
        // @ts-ignore
        const module = await import('https://esm.sh/exifr@7.1.3');
        exifrInstance = module.default || module;
        console.log('[RAW] Exifr loaded OK');
        return exifrInstance;
    } catch (e) {
        console.warn("[RAW] Exifr load failed, using binary scanner fallback", e);
        exifrLoadFailed = true;
        return null;
    }
};

export interface ProcessedRawFile {
    originalName: string;
    blob: Blob;
    width: number;
    height: number;
    sourceMethod: string;
}

export interface RawConvertOptions {
    quality: number;       // 1-100, JPEG quality
    maxResolution: number; // 0 = original, otherwise max long edge in px
}

const DEFAULT_OPTIONS: RawConvertOptions = { quality: 92, maxResolution: 0 };

/**
 * Re-encodes image blob through Canvas with specified quality and resolution.
 * This is REAL processing - pixel data goes through decode → canvas → JPEG encode.
 */
const reEncodeBlob = (sourceBlob: Blob, options: RawConvertOptions): Promise<{ blob: Blob; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(sourceBlob);
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            // Resize if maxResolution is set
            if (options.maxResolution > 0 && (width > options.maxResolution || height > options.maxResolution)) {
                if (width > height) {
                    height = Math.round((height * options.maxResolution) / width);
                    width = options.maxResolution;
                } else {
                    width = Math.round((width * options.maxResolution) / height);
                    height = options.maxResolution;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                return reject(new Error('Canvas context failed'));
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            const jpegQuality = Math.max(0.01, Math.min(1, options.quality / 100));
            canvas.toBlob(
                (result) => {
                    URL.revokeObjectURL(url);
                    if (result) {
                        resolve({ blob: result, width, height });
                    } else {
                        reject(new Error('JPEG encoding failed'));
                    }
                },
                'image/jpeg',
                jpegQuality
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to decode image'));
        };
        img.src = url;
    });
};

/**
 * Main function to process a RAW file.
 * Extracts embedded preview, then re-encodes through Canvas with quality/resize control.
 */
export const processRawFile = async (file: File, options: RawConvertOptions = DEFAULT_OPTIONS): Promise<File> => {
    console.log(`[RAW] Processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    const exifr = await getExifr();
    const candidates: ImageCandidate[] = [];

    // 1. Try Exifr Preview
    if (exifr) {
        try {
            const previewData = await exifr.preview(file);
            if (previewData) {
                console.log(`[RAW] Exifr preview: ${previewData.length} bytes`);
                const blob = new Blob([previewData], { type: 'image/jpeg' });
                const { isValid, width, height } = await validateImageBlob(blob);
                if (isValid) {
                    console.log(`[RAW] Preview valid: ${width}x${height}`);
                    candidates.push({ blob, width, height, resolution: width * height, source: 'Metadata (Preview)' });
                }
            } else {
                console.log('[RAW] No exifr preview found');
            }
        } catch (e) {
            console.warn('[RAW] Exifr preview extraction failed', e);
        }

        // 2. Try Exifr Thumbnail
        try {
            const thumbData = await exifr.thumbnail(file);
            if (thumbData) {
                console.log(`[RAW] Exifr thumbnail: ${thumbData.length} bytes`);
                const blob = new Blob([thumbData], { type: 'image/jpeg' });
                const { isValid, width, height } = await validateImageBlob(blob);
                if (isValid) {
                    console.log(`[RAW] Thumbnail valid: ${width}x${height}`);
                    candidates.push({ blob, width, height, resolution: width * height, source: 'Metadata (Thumbnail)' });
                }
            }
        } catch (e) {
            console.warn('[RAW] Exifr thumbnail extraction failed', e);
        }
    } else {
        console.log('[RAW] Exifr not available, using binary scanner');
    }

    // Check if we already found a high-res image (> 4 Megapixels)
    const hasHighRes = candidates.some(c => c.resolution > 4_000_000);

    if (!hasHighRes) {
        // 3. Run Brute Force Scanner
        console.log('[RAW] Running binary JPEG scanner...');
        const scannedBlobs = await scanForJpegCandidates(file);
        console.log(`[RAW] Scanner found ${scannedBlobs.length} candidates`);
        for (const blob of scannedBlobs) {
            const { isValid, width, height } = await validateImageBlob(blob);
            if (isValid) {
                console.log(`[RAW] Scanner candidate valid: ${width}x${height}`);
                candidates.push({ blob, width, height, resolution: width * height, source: 'Binary Scan' });
            }
        }
    }

    if (candidates.length === 0) {
        throw new Error(`Nebyl nalezen validní náhled v souboru ${file.name}. Zkuste jiný RAW formát.`);
    }

    // 4. Select the BEST candidate
    candidates.sort((a, b) => b.resolution - a.resolution);
    const bestCandidate = candidates[0];
    console.log(`[RAW] Best candidate: ${bestCandidate.source} ${bestCandidate.width}x${bestCandidate.height}`);

    // 5. Re-encode through Canvas (real processing - not just extracting embedded JPEG)
    const { blob: processedBlob, width, height } = await reEncodeBlob(bestCandidate.blob, options);
    console.log(`[RAW] Re-encoded: ${width}x${height}, ${(processedBlob.size / 1024 / 1024).toFixed(2)} MB`);

    const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
    return new File([processedBlob], newFileName, { type: 'image/jpeg' });
};

export const isRawFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return RAW_EXTENSIONS.includes(ext);
};
