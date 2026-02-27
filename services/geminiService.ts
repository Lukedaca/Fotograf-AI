
import { GoogleGenAI } from '@google/genai';
import type { AnalysisResult, AutoCropResult, AutoCropSuggestion, CropCoordinates, Language, QualityAssessment } from '../types';
import { fileToBase64, base64ToFile } from '../utils/imageProcessor';
import { sanitizeText } from '../utils/text';
import { getApiKey } from '../utils/apiKey';

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
            const errorMessage = lastError.message.toLowerCase();
            if (
                errorMessage.includes('invalid api key') ||
                errorMessage.includes('blocked') ||
                errorMessage.includes('invalid json')
            ) {
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
    if (!candidate.content || !candidate.content.parts) {
        throw new Error('AI response has no content - unexpected format');
    }

    const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
    if (!imagePart) {
        throw new Error('AI did not generate image data - try again or use different settings');
    }

    if (!imagePart.inlineData || !imagePart.inlineData.data) {
        throw new Error('AI image data is empty - generation may have failed');
    }

    return imagePart.inlineData;
}

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
        
        let prompt = `Vytvoř ultra-kvalitní virální YouTube miniaturu.
        Téma: ${topic}.
        POVINNÝ text: "${textOverlay}".
        Kompozice: vysoký kontrast, syté barvy, filmové konturové světlo,
        optimalizováno pro maximální CTR. Typografie musí být velká, výrazná a 3D.
        Drž profesionální creator estetiku.`;

        const parts: any[] = [];
        
        if (options.referenceFile) {
            const base64Ref = await fileToBase64(options.referenceFile);
            parts.push({ inlineData: { data: base64Ref, mimeType: options.referenceFile.type } });
            prompt += `\n\nPOUŽIJ PŘILOŽENÝ OBRÁZEK JAKO REFERENCI. Zachovej z něj hlavní subjekt, styl nebo kompozici, ale transformuj jej do virální YouTube estetiky.`;
        }
        
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: { parts },
            config: { 
                imageConfig: { 
                    aspectRatio: "16:9", 
                    imageSize: "LARGE" 
                } 
            }
        });

        const imagePart = getInlineImageData(response);
    
        let mimeType = 'image/jpeg';
        let extension = 'jpg';
        if (options.format === 'png') { mimeType = 'image/png'; extension = 'png'; }
        else if (options.format === 'webp') { mimeType = 'image/webp'; extension = 'webp'; }

        return { 
            file: await base64ToFile(
                imagePart.data, 
                `yt_thumb_${Date.now()}.${extension}`, 
                mimeType
            ) 
        };
    });
};

export const analyzeImage = async (file: File, language: Language = 'cs'): Promise<AnalysisResult> => {
  return withRetry(async () => {
    const ai = getGenAI();
    const base64Image = await fileToBase64(file);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash',
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
            model: 'gemini-3.1-flash-image',
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
        model: 'gemini-3.1-flash-image', 
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
            model: 'gemini-3.1-flash-image',
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
            model: 'gemini-3.1-flash-image',
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
            model: 'gemini-3.1-flash-image',
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
            model: 'gemini-3.1-flash',
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
            model: 'gemini-3.1-flash',
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
