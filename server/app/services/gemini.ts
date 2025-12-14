import { GoogleGenAI } from '@google/genai';

/**
 * Creates a Google Gemini AI client instance.
 * 
 * The SDK looks for GOOGLE_API_KEY or GEMINI_API_KEY environment variables.
 * For image generation models, you may need to use Google AI Studio API key
 * from: https://aistudio.google.com/app/apikey
 */
export function createGeminiClient() {
    // Try multiple possible env var names
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error(
            'API key not found. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable. ' +
            'Get your API key from: https://aistudio.google.com/app/apikey'
        );
    }
    
    return new GoogleGenAI({ apiKey });
}

/**
 * Gemini Image Generation Models
 * - gemini-2.5-flash-image: Fast, optimized for high-volume, low-latency tasks (1024px)
 * - gemini-3-pro-image-preview: Professional asset production, complex instructions (up to 4K)
 */
export const GEMINI_IMAGE_MODELS = {
    FLASH: 'gemini-2.5-flash-image',
    PRO: 'gemini-3-pro-image-preview',
} as const;

export type GeminiImageModel = typeof GEMINI_IMAGE_MODELS[keyof typeof GEMINI_IMAGE_MODELS];

/**
 * Available aspect ratios for image generation
 */
export const ASPECT_RATIOS = {
    SQUARE: '1:1',
    PORTRAIT_2_3: '2:3',
    LANDSCAPE_3_2: '3:2',
    PORTRAIT_3_4: '3:4',
    LANDSCAPE_4_3: '4:3',
    PORTRAIT_4_5: '4:5',
    LANDSCAPE_5_4: '5:4',
    PORTRAIT_9_16: '9:16',
    LANDSCAPE_16_9: '16:9',
    ULTRAWIDE_21_9: '21:9',
} as const;

export type AspectRatio = typeof ASPECT_RATIOS[keyof typeof ASPECT_RATIOS];

/**
 * Available resolutions for Gemini 3 Pro Image Preview
 */
export const IMAGE_SIZES = {
    '1K': '1K',
    '2K': '2K',
    '4K': '4K',
} as const;

export type ImageSize = typeof IMAGE_SIZES[keyof typeof IMAGE_SIZES];

