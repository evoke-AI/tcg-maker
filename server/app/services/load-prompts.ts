'use server';

import { promises as fs } from 'fs';
import path from 'path';

const promptsDir = path.join(process.cwd(), 'prompts');

export async function loadPromptFile(filename: string): Promise<string> {
  try {
    const filePath = path.join(promptsDir, filename);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error loading prompt file ${filename}:`, error);
    throw new Error(`Failed to load prompt file: ${filename}`);
  }
}
