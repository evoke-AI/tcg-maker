import { NextRequest, NextResponse } from 'next/server';
import { generateBulkTradingCards, generateCardsWithConversation } from '@/app/services/trading-card-generator';
import type { BulkCardGenerationRequest } from '@/types/trading-cards';

/**
 * POST /api/trading-cards/generate
 * 
 * Generates multiple trading card images in bulk using Gemini Image Generation.
 * Maintains consistent styling across all cards in the set.
 * 
 * Request body should include:
 * - cards: Array of card configurations (id, name, description, etc.)
 * - styleConfig: Style configuration for consistency
 * - referenceImages (optional): Reference images for style transfer
 * - outputConfig (optional): Aspect ratio, resolution, model selection
 * - useConversation (optional): Use multi-turn conversation for better consistency
 */
export async function POST(request: NextRequest) {
    // Parse request body
    const body = await request.json();
    const {
        cards,
        styleConfig,
        referenceImages,
        outputConfig,
        useConversation = false,
    } = body as BulkCardGenerationRequest & { useConversation?: boolean };

    // Validate required fields
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
        return NextResponse.json(
            { error: 'Cards array is required and must not be empty' },
            { status: 400 }
        );
    }

    if (!styleConfig || !styleConfig.artStyle) {
        return NextResponse.json(
            { error: 'Style configuration with artStyle is required' },
            { status: 400 }
        );
    }

    // Validate each card has required fields
    for (const card of cards) {
        if (!card.id || !card.name) {
            return NextResponse.json(
                { error: 'Each card must have an id and name' },
                { status: 400 }
            );
        }
    }

    // Validate reference images if provided
    if (referenceImages) {
        if (!Array.isArray(referenceImages)) {
            return NextResponse.json(
                { error: 'referenceImages must be an array' },
                { status: 400 }
            );
        }

        for (const img of referenceImages) {
            if (!img.data || !img.mimeType) {
                return NextResponse.json(
                    { error: 'Each reference image must have data and mimeType' },
                    { status: 400 }
                );
            }
        }
    }

    // Limit batch size to prevent timeout
    const MAX_BATCH_SIZE = 100;
    if (cards.length > MAX_BATCH_SIZE) {
        return NextResponse.json(
            { error: `Maximum batch size is ${MAX_BATCH_SIZE} cards per request` },
            { status: 400 }
        );
    }

    // Generate trading cards
    let result;

    if (useConversation) {
        // Use multi-turn conversation for better consistency
        result = await generateCardsWithConversation(
            cards,
            styleConfig,
            referenceImages,
            outputConfig?.aspectRatio,
            outputConfig?.imageSize,
        );
    } else {
        // Use standard bulk generation
        result = await generateBulkTradingCards({
            cards,
            styleConfig,
            referenceImages,
            outputConfig,
        });
    }

    return NextResponse.json(result);
}

/**
 * GET /api/trading-cards/generate
 * 
 * Returns information about the trading card generation API
 */
export async function GET() {
    return NextResponse.json({
        name: 'Trading Card Generation API',
        description: 'Generate bulk trading card images with consistent styling using Gemini Image Generation',
        version: '1.0.0',
        endpoints: {
            POST: {
                description: 'Generate trading card images in bulk',
                body: {
                    cards: {
                        type: 'array',
                        description: 'Array of card configurations',
                        required: true,
                        items: {
                            id: 'string (required)',
                            name: 'string (required)',
                            description: 'string (optional)',
                            promptModifiers: 'string (optional)',
                            attributes: 'object (optional)',
                        },
                    },
                    styleConfig: {
                        type: 'object',
                        description: 'Style configuration for consistency',
                        required: true,
                        properties: {
                            artStyle: 'string (required)',
                            colorPalette: 'string (optional)',
                            frameStyle: 'string (optional)',
                            backgroundStyle: 'string (optional)',
                            textStyle: 'string (optional)',
                            additionalStyleNotes: 'string (optional)',
                        },
                    },
                    referenceImages: {
                        type: 'array',
                        description: 'Optional reference images for style transfer',
                        items: {
                            data: 'string (base64)',
                            mimeType: 'string',
                            purpose: 'style | template | character | background',
                        },
                    },
                    outputConfig: {
                        type: 'object',
                        description: 'Output configuration',
                        properties: {
                            aspectRatio: '1:1 | 2:3 | 3:2 | 3:4 | 4:3 | 4:5 | 5:4 | 9:16 | 16:9 | 21:9',
                            imageSize: '1K | 2K | 4K (Gemini 3 Pro only)',
                            model: 'gemini-2.5-flash-image | gemini-3-pro-image-preview',
                        },
                    },
                    useConversation: {
                        type: 'boolean',
                        description: 'Use multi-turn conversation for better consistency',
                        default: false,
                    },
                },
            },
        },
        models: {
            'gemini-2.5-flash-image': 'Fast, optimized for high-volume tasks (1024px)',
            'gemini-3-pro-image-preview': 'Professional quality, up to 4K resolution',
        },
    });
}

