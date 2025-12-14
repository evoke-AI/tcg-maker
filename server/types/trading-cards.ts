import type { AspectRatio, ImageSize, GeminiImageModel } from '@/app/services/gemini';

/**
 * Represents the configuration for a single trading card
 */
export interface TradingCardConfig {
    /** Unique identifier for this card in the batch */
    id: string;
    /** Name of the card (e.g., "Fire Dragon", "Water Spirit") */
    name: string;
    /** Description or flavor text for the card */
    description?: string;
    /** Additional card-specific prompt modifiers */
    promptModifiers?: string;
    /** Card attributes (e.g., attack, defense, mana cost) */
    attributes?: Record<string, string | number>;
}

/**
 * Style configuration for consistent card generation
 */
export interface CardStyleConfig {
    /** Art style description (e.g., "anime style", "realistic oil painting") */
    artStyle: string;
    /** Color palette description */
    colorPalette?: string;
    /** Border/frame style description */
    frameStyle?: string;
    /** Background style for cards */
    backgroundStyle?: string;
    /** Typography style for card text */
    textStyle?: string;
    /** Additional style modifiers to apply to all cards */
    additionalStyleNotes?: string;
}

/**
 * Request configuration for bulk trading card generation
 */
export interface BulkCardGenerationRequest {
    /** Array of card configurations to generate */
    cards: TradingCardConfig[];
    /** Style configuration applied to all cards for consistency */
    styleConfig: CardStyleConfig;
    /** Optional reference image(s) for style transfer (base64 encoded) */
    referenceImages?: {
        /** Base64 encoded image data */
        data: string;
        /** MIME type of the image (e.g., "image/png", "image/jpeg") */
        mimeType: string;
        /** Purpose of this reference image */
        purpose: 'style' | 'template' | 'character' | 'background';
    }[];
    /** Output configuration */
    outputConfig?: {
        /** Aspect ratio for generated images */
        aspectRatio?: AspectRatio;
        /** Resolution for generated images (Gemini 3 Pro only) */
        imageSize?: ImageSize;
        /** Model to use for generation */
        model?: GeminiImageModel;
    };
}

/**
 * Result of a single card generation
 */
export interface CardGenerationResult {
    /** The card ID from the request */
    cardId: string;
    /** Whether generation was successful */
    success: boolean;
    /** Base64 encoded image data (if successful) */
    imageData?: string;
    /** MIME type of the generated image */
    mimeType?: string;
    /** Any text response from the model */
    textResponse?: string;
    /** Error message (if failed) */
    error?: string;
    /** Generation timestamp */
    generatedAt: string;
}

/**
 * Response from bulk card generation
 */
export interface BulkCardGenerationResponse {
    /** Overall success status */
    success: boolean;
    /** Total cards requested */
    totalRequested: number;
    /** Number of successfully generated cards */
    successCount: number;
    /** Number of failed generations */
    failedCount: number;
    /** Individual results for each card */
    results: CardGenerationResult[];
    /** Session identifier for potential follow-up requests */
    sessionId?: string;
    /** Errors if any occurred at the batch level */
    error?: string;
}

/**
 * Multi-turn conversation context for iterative refinement
 */
export interface CardGenerationSession {
    /** Session identifier */
    sessionId: string;
    /** Conversation history for multi-turn editing */
    conversationHistory: Array<{
        role: 'user' | 'model';
        content: string;
        imageData?: string;
    }>;
    /** Style configuration for this session */
    styleConfig: CardStyleConfig;
    /** Created timestamp */
    createdAt: string;
}

