
import { GoogleGenAI } from '@google/genai';
import type { AnalysisResult, AutoCropResult, AutoCropSuggestion, CropCoordinates, Language, QualityAssessment } from '../types';
import { fileToBase64, base64ToFile } from '../utils/imageProcessor';
import { sanitizeText } from '../utils/text';
import { getApiKey } from '../utils/apiKey';

const IMAGE_GENERATION_MODEL = 'gemini-2.5-flash-image';

const THUMBNAIL_RESOLUTION_MAP = {
    '1K': { width: 1280, height: 720 },
    '2K': { width: 2048, height: 1152 },
    '4K': { width: 3840, height: 2160 },
} as const;

const THUMBNAIL_MIME_MAP = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
} as const;

const THUMBNAIL_EXTENSION_MAP = {
    jpeg: 'jpg',
    png: 'png',
    webp: 'webp',
} as const;

function safeJsonParse<T>(text: string | undefined, fallbackError: string): T {
    if (!text) {
        throw new Error(`${fallbackError}: Empty response from AI`);
    }

    try {
        let cleanText = sanitizeText(text).trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        }
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        cleanText = cleanText.trim();
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.error('Failed to parse AI response:', text);
        throw new Error(`${fallbackError}: Invalid JSON from AI`);
    }
}

async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            const errorMessage = lastError.message;
            const lowerMessage = errorMessage.toLowerCase();

            // Always retry RETRYABLE errors (e.g. model returned text instead of image)
            const isRetryable = errorMessage.startsWith('RETRYABLE:');

            // Don't retry only truly permanent failures (bad API key, invalid JSON)
            if (!isRetryable && (
                lowerMessage.includes('invalid api key') ||
                lowerMessage.includes('invalid json')
            )) {
                throw lastError;
            }

            if (attempt < maxRetries - 1) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                console.warn(`AI request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('AI request failed after retries');
}

function getInlineImageData(response: any) {
    if (!response) {
        throw new Error('AI service unavailable - no response received');
    }

    if (!response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`AI blocked request: ${response.promptFeedback.blockReason}`);
        }
        throw new Error('AI returned no results - may be rate limited or model unavailable');
    }

    const candidate = response.candidates[0];

    // Any non-image response is retryable — never give up
    if (candidate.finishReason === 'SAFETY' || !candidate.content || !candidate.content.parts) {
        throw new Error('RETRYABLE: AI response has no content - retrying');
    }

    // Search all parts for image data
    const imagePart = candidate.content.parts.find((part: any) =>
        part.inlineData?.data
    );
    if (!imagePart) {
        // Log what we got for debugging
        const textParts = candidate.content.parts
            .filter((p: any) => p.text)
            .map((p: any) => p.text)
            .join(' ');
        console.warn('AI returned text instead of image:', textParts.slice(0, 200));
        throw new Error('RETRYABLE: AI did not generate image - returned text instead');
    }

    return imagePart.inlineData;
}

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Generated image could not be loaded'));
        };

        image.src = objectUrl;
    });
};

const renderImageFile = async (
    sourceFile: File,
    baseName: string,
    format: keyof typeof THUMBNAIL_MIME_MAP,
    targetSize?: { width: number; height: number }
): Promise<File> => {
    const image = await loadImageFromFile(sourceFile);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas context unavailable');
    }

    canvas.width = targetSize?.width ?? image.naturalWidth;
    canvas.height = targetSize?.height ?? image.naturalHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const mimeType = THUMBNAIL_MIME_MAP[format];
    const extension = THUMBNAIL_EXTENSION_MAP[format];
    const quality = format === 'jpeg' || format === 'webp' ? 0.92 : undefined;

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (!result) {
                reject(new Error('Failed to render generated thumbnail'));
                return;
            }

            resolve(result);
        }, mimeType, quality);
    });

    return new File([blob], `${baseName}.${extension}`, { type: blob.type || mimeType });
};

const clampRect = (rect: CropCoordinates, width: number, height: number): CropCoordinates => {
    const x = Math.max(0, Math.min(width, rect.x));
    const y = Math.max(0, Math.min(height, rect.y));
    const w = Math.max(1, Math.min(width - x, rect.width));
    const h = Math.max(1, Math.min(height - y, rect.height));
    return { x, y, width: w, height: h };
};

const normalizeAutoCropResult = (result: AutoCropResult, width: number, height: number): AutoCropResult => {
    const safeZone = clampRect(result.safeZone, width, height);
    const mainSubject = clampRect(result.mainSubject, width, height);
    const facesBoundingBox = result.facesBoundingBox ? clampRect(result.facesBoundingBox, width, height) : null;
    const suggestedCrops = (result.suggestedCrops || [])
        .filter((item): item is AutoCropSuggestion => !!item?.rect)
        .map((item) => ({
            ...item,
            confidence: Math.max(0, Math.min(1, item.confidence ?? 0)),
            rect: clampRect(item.rect, width, height),
        }))
        .sort((a, b) => b.confidence - a.confidence);

    return {
        ...result,
        safeZone,
        mainSubject,
        facesBoundingBox,
        suggestedCrops,
    };
};

/**
 * Initializes and returns a GoogleGenAI instance.
 * 
 * SECURITY NOTE:
 * In this implementation, we are using a user-provided API key stored locally in the browser.
 * Access control is handled by the "Credit System" in the UI layer (App.tsx).
 * 
 * If the user has 0 credits, the UI blocks the call to these functions, ensuring
 * the API is not called unnecessarily.
 * 
 * For maximum security, this logic should eventually move to a backend proxy
 * where the key is never exposed to the client bundle.
 */
const getGenAI = () => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        console.error("API Key is missing in local storage.");
        throw new Error("API_KEY_MISSING");
    }

    return new GoogleGenAI({ apiKey });
};

/**
 * STANDALONE YouTube Thumbnail generator.
 */
export const generateYouTubeThumbnail = async (
    topic: string, 
    textOverlay: string, 
    options: { resolution: '1K' | '2K' | '4K', format: 'jpeg' | 'png' | 'webp', referenceFile?: File }
): Promise<{ file: File }> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const requestedSize = THUMBNAIL_RESOLUTION_MAP[options.resolution];
        const trimmedTopic = topic.trim();
        const trimmedText = textOverlay.trim();
        const parts: any[] = [];
        const promptLines = [
            'Create a polished, high-CTR YouTube thumbnail.',
            `Topic: ${trimmedTopic}.`,
            'Use a strong single focal point, bold contrast, saturated colors, and cinematic lighting.',
            'Keep the composition clean and readable on both mobile and desktop.',
            'Target exact 16:9 framing with a clear subject and strong visual hierarchy.',
            'The result must look like a professional creator thumbnail, not a poster or generic artwork.',
            'Avoid watermarks, platform logos, and unreadable or distorted text.',
        ];

        if (trimmedText) {
            promptLines.push(`Required headline text: "${trimmedText}". Make it large, sharp, and readable.`);
        } else {
            promptLines.push('If text is used, keep it minimal, large, and perfectly readable.');
        }

        if (options.referenceFile) {
            const base64Ref = await fileToBase64(options.referenceFile);
            parts.push({ inlineData: { data: base64Ref, mimeType: options.referenceFile.type } });
            promptLines.push('Use the attached image as a visual reference. Preserve the main subject or composition cues, but restyle it into a premium YouTube thumbnail.');
        }

        parts.push({ text: promptLines.join(' ') });

        const response = await ai.models.generateContent({
            model: IMAGE_GENERATION_MODEL,
            contents: { parts },
        });

        const imagePart = getInlineImageData(response);
        const generatedFile = await base64ToFile(
            imagePart.data,
            `yt_thumb_raw_${Date.now()}`,
            imagePart.mimeType || 'image/png'
        );
        const finalFile = await renderImageFile(
            generatedFile,
            `yt_thumb_${Date.now()}`,
            options.format,
            requestedSize
        );

        return { 
            file: finalFile,
        };
    });
};

export const analyzeImage = async (file: File, language: Language = 'cs'): Promise<AnalysisResult> => {
  return withRetry(async () => {
    const ai = getGenAI();
    const base64Image = await fileToBase64(file);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Image } },
          { text: 'Analyzuj tuto fotografii. Vrať popis, doporučení a technické informace. Odpověz česky.' },
        ],
      },
      config: { responseMimeType: 'application/json' }
    });
    return safeJsonParse<AnalysisResult>(response.text, 'Image analysis failed');
  });
};

export const autopilotImage = async (file: File): Promise<{ file: File }> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: "Vylepši tuto fotografii profesionálně se zaměřením na barvy a dynamický rozsah." },
                ],
            }
        });
        const imagePart = getInlineImageData(response);
        return { file: await base64ToFile(imagePart.data, `auto_${file.name}`, imagePart.mimeType) };
    });
};

export const generateImage = async (prompt: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({ 
        model: 'gemini-3.1-flash-image-preview', 
        contents: { parts: [{ text: prompt }] } 
    });
    const imagePart = getInlineImageData(response);
    return imagePart.data;
  });
};

export const removeBackground = async (file: File): Promise<{ file: File }> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: 'Odstraň pozadí. Hlavní subjekt ponech ostrý. Výstup s transparentním pozadím.' }
                ]
            }
        });
        const imagePart = getInlineImageData(response);
        return { file: await base64ToFile(imagePart.data, `bg_removed_${file.name.replace(/\\.[^/.]+$/, '')}.png`, 'image/png') };
    });
};

export const replaceBackground = async (file: File, description: string): Promise<{ file: File }> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: `Nahraď pozadí za: ${description}. Subjekt ponech beze změn a zachovej realistické světlo.` }
                ]
            }
        });
        const imagePart = getInlineImageData(response);
        return { file: await base64ToFile(imagePart.data, `bg_replaced_${file.name}`, imagePart.mimeType) };
    });
};

export const enhanceFaces = async (file: File): Promise<{ file: File }> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: 'Jemné vylepšení obličeje: sjednotit pleť, rozjasnit oči, redukovat nedokonalosti, zachovat přirozenost.' }
                ]
            }
        });
        const imagePart = getInlineImageData(response);
        return { file: await base64ToFile(imagePart.data, `face_enhanced_${file.name}`, imagePart.mimeType) };
    });
};

export const analyzeForAutoCrop = async (
    file: File,
    imageSize: { width: number; height: number }
): Promise<AutoCropResult> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const { width, height } = imageSize;
        const prompt = `Analyzuj obrázek pro optimální ořez.
Vrať pouze JSON. Použij pixelové souřadnice v původním prostoru (0..width/height).
Velikost obrázku: ${width}x${height}.
Požadavky:
1) Urči bounding box hlavního subjektu
2) Vrať safe zónu, kde musí zůstat důležitý obsah
3) Navrhni ořez pro poměry: 1:1, 4:3, 3:2, 16:9
4) Uveď confidence 0-1 pro každý návrh
JSON tvar:
{
  "mainSubject": { "x": number, "y": number, "width": number, "height": number },
  "facesBoundingBox": { "x": number, "y": number, "width": number, "height": number } | null,
  "suggestedCrops": [
    { "aspectRatio": "1:1", "rect": { "x": number, "y": number, "width": number, "height": number }, "confidence": number },
    { "aspectRatio": "4:3", "rect": { "x": number, "y": number, "width": number, "height": number }, "confidence": number },
    { "aspectRatio": "3:2", "rect": { "x": number, "y": number, "width": number, "height": number }, "confidence": number },
    { "aspectRatio": "16:9", "rect": { "x": number, "y": number, "width": number, "height": number }, "confidence": number }
  ],
  "safeZone": { "x": number, "y": number, "width": number, "height": number },
  "composition": "centered" | "rule-of-thirds" | "golden-ratio"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: prompt }
                ],
            },
            config: { responseMimeType: 'application/json' }
        });

        const parsed = safeJsonParse<AutoCropResult>(response.text, 'Autocrop analysis failed');
        return normalizeAutoCropResult(parsed, width, height);
    });
};

export const assessQuality = async (file: File): Promise<QualityAssessment> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: "Ohodnoť technickou kvalitu fotografie 0-100 a vrať flagy jako Rozmazané, Ostré, Šum apod." }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        return safeJsonParse<QualityAssessment>(response.text, 'Quality assessment failed');
    });
};

export const retouchWithPrompt = async (file: File, prompt: string): Promise<{ file: File }> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: `Edit this photo: ${prompt}. Return ONLY the edited image. Keep the same style, composition and resolution. Apply ONLY the requested edit, nothing else.` }
                ]
            },
            config: {
                responseModalities: ['image', 'text'],
            }
        });
        const imagePart = getInlineImageData(response);
        return { file: await base64ToFile(imagePart.data, `retouched_${file.name}`, imagePart.mimeType) };
    }, 5);
};

export const retouchWithMask = async (file: File, maskBase64: string): Promise<{ file: File }> => {
    return withRetry(async () => {
        const ai = getGenAI();
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { inlineData: { data: maskBase64, mimeType: 'image/png' } },
                    { text: 'The second image is a mask. White areas mark regions to retouch. Remove or fix content in white mask areas using intelligent inpainting. Match surrounding texture and lighting. Result must look natural. Return ONLY the edited image.' }
                ]
            },
            config: {
                responseModalities: ['image', 'text'],
            }
        });
        const imagePart = getInlineImageData(response);
        return { file: await base64ToFile(imagePart.data, `retouched_${file.name}`, imagePart.mimeType) };
    }, 5);
};
