'use server';

import { createGeminiClient, GEMINI_IMAGE_MODELS, ASPECT_RATIOS, type AspectRatio, type ImageSize } from './gemini';
import type {
    TradingCardConfig,
    CardStyleConfig,
    BulkCardGenerationRequest,
    CardGenerationResult,
    BulkCardGenerationResponse,
} from '@/types/trading-cards';
import { loadPromptFile } from './load-prompts';

/**
 * Builds a consistent prompt for trading card generation
 * ensuring the same style is applied across all cards
 */
function buildCardPrompt(
    card: TradingCardConfig,
    styleConfig: CardStyleConfig,
    basePrompt: string,
): string {
    const parts: string[] = [basePrompt];

    // Add style configuration for consistency
    parts.push(`\n\nArt Style: ${styleConfig.artStyle}`);
    
    if (styleConfig.colorPalette) {
        parts.push(`Color Palette: ${styleConfig.colorPalette}`);
    }
    
    if (styleConfig.frameStyle) {
        parts.push(`Card Frame/Border: ${styleConfig.frameStyle}`);
    }
    
    if (styleConfig.backgroundStyle) {
        parts.push(`Background Style: ${styleConfig.backgroundStyle}`);
    }
    
    if (styleConfig.textStyle) {
        parts.push(`Text/Typography Style: ${styleConfig.textStyle}`);
    }
    
    if (styleConfig.additionalStyleNotes) {
        parts.push(`Additional Style Notes: ${styleConfig.additionalStyleNotes}`);
    }

    // Add card-specific details
    parts.push(`\n\nCard Details:`);
    parts.push(`Card Name: "${card.name}"`);
    
    if (card.description) {
        parts.push(`Card Description/Flavor Text: "${card.description}"`);
    }
    
    if (card.attributes) {
        const attrStr = Object.entries(card.attributes)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        parts.push(`Card Attributes: ${attrStr}`);
    }
    
    if (card.promptModifiers) {
        parts.push(`Special Instructions: ${card.promptModifiers}`);
    }

    // Add consistency instruction
    parts.push(`\nIMPORTANT: Maintain exact consistency in art style, color grading, line weight, and overall aesthetic with other cards in this set.`);

    return parts.join('\n');
}

/**
 * Generates a single trading card image using Gemini
 * Based on official SDK: https://ai.google.dev/gemini-api/docs/image-generation
 */
async function generateSingleCard(
    client: ReturnType<typeof createGeminiClient>,
    card: TradingCardConfig,
    styleConfig: CardStyleConfig,
    basePrompt: string,
    referenceImages: BulkCardGenerationRequest['referenceImages'],
    aspectRatio: AspectRatio,
    imageSize: ImageSize | undefined,
    model: string,
): Promise<CardGenerationResult> {
    const prompt = buildCardPrompt(card, styleConfig, basePrompt);

    // Build the content array with prompt and optional reference images
    // SDK format: [{ text: "..." }, { inlineData: { mimeType: "...", data: "..." } }]
    const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Add text prompt first
    contents.push({ text: prompt });

    // Add reference images if provided (up to 14 for gemini-3-pro-image-preview)
    if (referenceImages && referenceImages.length > 0) {
        for (const refImage of referenceImages) {
            contents.push({
                inlineData: {
                    mimeType: refImage.mimeType,
                    data: refImage.data,
                },
            });
        }
    }

    // Configure image generation options per SDK docs
    // For gemini-3-pro-image-preview: supports responseModalities, imageConfig with aspectRatio and imageSize
    const config: {
        responseModalities: ('TEXT' | 'IMAGE')[];
        imageConfig: {
            aspectRatio: string;
            imageSize?: string;
        };
    } = {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
            aspectRatio,
        },
    };

    // Only add imageSize for Gemini 3 Pro (supports 1K, 2K, 4K)
    if (model === GEMINI_IMAGE_MODELS.PRO && imageSize) {
        config.imageConfig.imageSize = imageSize;
    }

    const response = await client.models.generateContent({
        model,
        contents,
        config,
    });

    // Process the response per SDK format
    // response.candidates[0].content.parts contains text and/or inlineData
    let imageData: string | undefined;
    let mimeType: string | undefined;
    let textResponse: string | undefined;

    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            // Check for text response
            if ('text' in part && part.text) {
                textResponse = part.text;
            }
            // Check for image response (base64 encoded)
            if ('inlineData' in part && part.inlineData) {
                imageData = part.inlineData.data;
                mimeType = part.inlineData.mimeType;
            }
        }
    }

    if (!imageData) {
        return {
            cardId: card.id,
            success: false,
            error: 'No image generated in response',
            generatedAt: new Date().toISOString(),
        };
    }

    return {
        cardId: card.id,
        success: true,
        imageData,
        mimeType: mimeType || 'image/png',
        textResponse,
        generatedAt: new Date().toISOString(),
    };
}

/**
 * Generates multiple trading cards in bulk with consistent styling
 * Uses image-to-image generation when reference images are provided
 */
export async function generateBulkTradingCards(
    request: BulkCardGenerationRequest
): Promise<BulkCardGenerationResponse> {
    const { cards, styleConfig, referenceImages, outputConfig } = request;

    if (!cards || cards.length === 0) {
        return {
            success: false,
            totalRequested: 0,
            successCount: 0,
            failedCount: 0,
            results: [],
            error: 'No cards provided for generation',
        };
    }

    // Load the base prompt for trading card generation
    const basePrompt = await loadPromptFile('trading-card-generation.txt');

    // Get configuration with defaults
    const aspectRatio = outputConfig?.aspectRatio || ASPECT_RATIOS.PORTRAIT_2_3;
    const imageSize = outputConfig?.imageSize;
    const model = outputConfig?.model || GEMINI_IMAGE_MODELS.PRO;

    // Create Gemini client
    const client = createGeminiClient();

    let successCount = 0;
    let failedCount = 0;

    // Generate cards in parallel for faster processing
    const cardPromises = cards.map(async (card) => {
        try {
            return await generateSingleCard(
                client,
                card,
                styleConfig,
                basePrompt,
                referenceImages,
                aspectRatio,
                imageSize,
                model,
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                cardId: card.id,
                success: false,
                error: errorMessage,
                generatedAt: new Date().toISOString(),
            } as CardGenerationResult;
        }
    });

    const results = await Promise.all(cardPromises);
    
    // Count successes and failures
    for (const result of results) {
        if (result.success) {
            successCount++;
        } else {
            failedCount++;
        }
    }

    return {
        success: failedCount === 0,
        totalRequested: cards.length,
        successCount,
        failedCount,
        results,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
}

/**
 * Generates trading cards using parallel generation
 * This is an alias for generateBulkTradingCards for backwards compatibility
 * Note: Conversation-based generation requires OAuth authentication with additional scopes
 */
export async function generateCardsWithConversation(
    cards: TradingCardConfig[],
    styleConfig: CardStyleConfig,
    referenceImages?: BulkCardGenerationRequest['referenceImages'],
    aspectRatio: AspectRatio = ASPECT_RATIOS.PORTRAIT_2_3,
    imageSize?: ImageSize,
): Promise<BulkCardGenerationResponse> {
    // Use parallel generation instead (chat API requires OAuth with additional scopes)
    return generateBulkTradingCards({
        cards,
        styleConfig,
        referenceImages,
        outputConfig: {
            aspectRatio,
            imageSize,
            model: GEMINI_IMAGE_MODELS.PRO,
        },
    });
}

