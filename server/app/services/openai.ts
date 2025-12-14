'use server';

import OpenAI from 'openai';

export async function createOpenAIClient() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}
