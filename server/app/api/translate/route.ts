'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createOpenAIClient } from '@/app/services/openai';
import { loadPromptFile } from '@/app/services/load-prompts';
import { validateUnifiedAuth } from '@/lib/unifiedAuth';

export async function POST(request: NextRequest) {
  // Validate authentication and user status
  const authResult = await validateUnifiedAuth(request);
  
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: authResult.status || 401 }
    );
  }

  const { userId } = authResult;

  // Parse request body
  const { text, targetLanguage, context } = await request.json();

  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: 'Text and target language are required' },
      { status: 400 }
    );
  }

  if (text.length > 5000) {
    return NextResponse.json(
      { error: 'Text too long. Maximum 5000 characters allowed.' },
      { status: 400 }
    );
  }

  // Load translation prompt
  const systemPrompt = await loadPromptFile('translation.txt');

  // Create user prompt
  const userPrompt = `Source text: ${text}
Target language: ${targetLanguage}${context ? `\nContext: ${context}` : ''}`;

  // Create OpenAI client and make translation request
  const openai = await createOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const translatedText = response.choices[0]?.message?.content?.trim();

  if (!translatedText) {
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    translatedText,
    originalText: text,
    targetLanguage,
    userId: userId,
  });
} 