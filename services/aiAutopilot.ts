import { GoogleGenAI } from '@google/genai';
import type { AIAutopilotResult, EnhancementMode, ManualEdits } from '../types';
import { base64ToFile, fileToBase64 } from '../utils/imageProcessor';
import { getApiKey } from '../utils/apiKey';
import { getUserProfile } from './userProfileService';

const getGenAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }
  return new GoogleGenAI({ apiKey });
};

const getInlineImageData = (response: any) => {
  if (!response?.candidates?.length) {
    throw new Error('AI returned no results');
  }
  const candidate = response.candidates[0];
  const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error('AI did not generate image data');
  }
  return imagePart.inlineData;
};

const buildStyleHint = () => {
  const { autopilotTendencies } = getUserProfile();
  const hints: string[] = [];
  const pushHint = (label: string, value: number) => {
    if (Math.abs(value) < 0.2) return;
    hints.push(`${label}: ${value > 0 ? 'increase' : 'decrease'} slightly`);
  };
  pushHint('brightness', autopilotTendencies.brightness);
  pushHint('contrast', autopilotTendencies.contrast);
  pushHint('saturation', autopilotTendencies.saturation);
  pushHint('vibrance', autopilotTendencies.vibrance);
  pushHint('shadows', autopilotTendencies.shadows);
  pushHint('highlights', autopilotTendencies.highlights);
  pushHint('clarity', autopilotTendencies.clarity);
  pushHint('sharpness', autopilotTendencies.sharpness);
  pushHint('noise reduction', autopilotTendencies.noiseReduction);
  if (hints.length === 0) return 'No strong preferences detected yet.';
  return hints.join(', ');
};

const createPrompt = (mode: EnhancementMode) => {
  const base = 'Enhance this photo professionally focusing on color, light, and dynamic range.';
  const modeHints: Record<EnhancementMode, string> = {
    auto: 'General best look, preserve realism.',
    portrait: 'Natural skin tones, eye detail, gentle contrast.',
    landscape: 'Vibrant skies, depth, crisp details.',
    product: 'Clean background, true colors, sharp edges.',
    food: 'Warm tones, appetizing colors, soft highlights.',
    'real-estate': 'Straight lines, balanced exposure, HDR feel.',
    'social-media': 'High impact, vibrant colors, punchy contrast.',
    print: 'Color accuracy, balanced contrast for print.',
    cinematic: 'Film-like grade, subtle contrast, slight vignette.',
    'your-style': `Match the user's editing tendencies. Preferences: ${buildStyleHint()}`,
  };
  return `${base} Mode: ${mode}. ${modeHints[mode]}`;
};

const emptyEdits: ManualEdits = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  shadows: 0,
  highlights: 0,
  clarity: 0,
  sharpness: 0,
  noiseReduction: 0,
  cropRect: undefined,
  aspectRatio: undefined,
  watermark: { enabled: false, text: '', opacity: 50, size: 20, position: 'bottom-right', color: '#ffffff' },
};

const createPreset = (id: string, name: string, edits: Partial<ManualEdits>) => ({
  id,
  name,
  edits: {
    ...emptyEdits,
    ...edits,
    cropRect: undefined,
  },
});

const createStylePresets = (mode: EnhancementMode) => {
  const base = [
    createPreset('soft', 'Soft Glow', { brightness: 8, highlights: -5, clarity: 5 }),
    createPreset('punch', 'Punchy', { contrast: 18, saturation: 10, sharpness: 10 }),
    createPreset('matte', 'Matte', { contrast: -10, shadows: 12, highlights: -8 }),
  ];

  if (mode === 'cinematic') {
    return [
      createPreset('cine', 'Cinematic', { contrast: 12, saturation: -5, clarity: 8 }),
      ...base,
    ];
  }
  if (mode === 'portrait') {
    return [
      createPreset('skin', 'Skin Clean', { highlights: -10, clarity: 4, saturation: -5 }),
      ...base,
    ];
  }
  return base;
};

export const runAutopilot = async (file: File, mode: EnhancementMode): Promise<AIAutopilotResult> => {
  const ai = getGenAI();
  const base64Image = await fileToBase64(file);
  const prompt = createPrompt(mode);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: file.type } },
        { text: prompt },
      ],
    },
  });

  const imagePart = getInlineImageData(response);
  const enhancedFile = await base64ToFile(imagePart.data, `autopilot_${file.name}`, imagePart.mimeType);

  return {
    enhancedImageBase64: imagePart.data,
    enhancedFile,
    appliedEdits: emptyEdits,
    analysis: {
      exposure: { value: 0, suggestion: 'Analyzing' },
      colors: { temperature: 0, saturation: 0, suggestion: 'Analyzing' },
      composition: { score: 0, suggestion: 'Analyzing' },
      sharpness: { value: 0, suggestion: 'Analyzing' },
    },
    stylePresets: createStylePresets(mode),
    nextSuggestions: [],
  };
};
